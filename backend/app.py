# This import provides filesystem path operations.
from pathlib import Path
# This import provides temporary file management for uploads.
from tempfile import NamedTemporaryFile
# This import provides typed dictionary annotations.
from typing import Dict, List

# This import provides FastAPI web framework primitives.
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
# This import provides CORS middleware for frontend access.
from fastapi.middleware.cors import CORSMiddleware
# This import provides pydantic base model for typed responses.
from pydantic import BaseModel

# This import brings in the core head-motion analysis engine.
from head_logic import HeadMotionAnalyzer

# This line creates a FastAPI app with project metadata.
app = FastAPI(title="VividHead Backend", version="1.0.0", description="ISL Non-Manual Feature interpreter for head motions.")

# This line configures permissive CORS for Vercel + local development.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# This line initializes reusable analyzer instance for requests.
analyzer = HeadMotionAnalyzer()
# This line stores expected dataset root path used for folder scanning.
DATASET_ROOT = Path("../dataset")


# This model describes full analysis response contract.
class AnalyzeResponse(BaseModel):
    # This field stores mapped grammatical modifier.
    modifier: str
    # This field stores confidence score in [0, 1].
    confidence: float
    # This field stores human-readable reasoning text.
    reason: str
    # This field stores measured video FPS.
    fps: float
    # This field stores number of successfully analyzed frames.
    total_frames: int
    # This field stores sampled frame-level pose details.
    frames: List[Dict]
    # This field stores resolved source phrase label for UI summaries.
    source_phrase: str


# This model describes dataset index response payload.
class DatasetIndexResponse(BaseModel):
    # This field stores sorted class folder names discovered on disk.
    classes: List[str]


# This route provides liveness status for deployment checks.
@app.get("/health")
def health_check() -> Dict[str, str]:
    # This return confirms service availability.
    return {"status": "ok", "service": "vividhead-backend"}

@app.get("/")
def home():
    return {"message": "VividHead API running 🚀"}


# This route lists phrase folders from the structured ISL dataset root.
@app.get("/dataset-index", response_model=DatasetIndexResponse)
def dataset_index() -> DatasetIndexResponse:
    # This guard handles absent dataset folders gracefully.
    if not DATASET_ROOT.exists():
        # This return provides empty class list when dataset is unavailable.
        return DatasetIndexResponse(classes=[])
    # This comprehension gathers child directory names as class labels.
    classes = sorted([item.name for item in DATASET_ROOT.iterdir() if item.is_dir()])
    # This return sends deterministic class ordering to clients.
    return DatasetIndexResponse(classes=classes)


# This route ingests MP4 video uploads and returns motion modifiers.
@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_video(file: UploadFile = File(...), source_phrase: str = Form("")) -> AnalyzeResponse:
    # This guard enforces mp4-only uploads for expected workflow.
    if not file.filename.lower().endswith((".mp4", ".webm", ".mov")):
        # This exception reports unsupported file type details.
        raise HTTPException(status_code=400, detail="Only .mp4, .webm, or .mov files are supported.")
    # This line creates a temporary on-disk file for OpenCV streaming.
    with NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix or ".mp4") as temp_file:
        # This line captures temporary path for downstream analyzer.
        temp_path = Path(temp_file.name)
        # This line reads uploaded bytes into memory once.
        payload = await file.read()
        # This line writes upload bytes to temporary file.
        temp_file.write(payload)
    # This try block ensures temp file cleanup on success/failure.
    try:
        # This line executes the full MediaPipe + PnP analysis pipeline.
        result = analyzer.analyze_video(str(temp_path))
        # This line resolves phrase label from form field or filename stem.
        resolved_phrase = source_phrase.strip() if source_phrase.strip() else Path(file.filename).stem
        # This line converts tuples to JSON-serializable nested lists.
        serialized_frames = [
            {
                "frame_index": frame["frame_index"],
                "timestamp": frame["timestamp"],
                "pitch": frame["pitch"],
                "yaw": frame["yaw"],
                "roll": frame["roll"],
                "mesh_points": [[float(point[0]), float(point[1])] for point in frame["mesh_points"]],
            }
            for frame in result["frames"]
        ]
        # This return sends validated response payload to frontend.
        return AnalyzeResponse(
            modifier=result["modifier"],
            confidence=result["confidence"],
            reason=result["reason"],
            fps=result["fps"],
            total_frames=result["total_frames"],
            frames=serialized_frames,
            source_phrase=resolved_phrase,
        )
    finally:
        # This guard checks temporary file existence before deletion.
        if temp_path.exists():
            # This line removes temporary file to avoid disk growth.
            temp_path.unlink()
