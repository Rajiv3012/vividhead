# VividHead Backend (Hugging Face Space)

FastAPI service that analyzes uploaded `.mp4` videos and maps head motion to ISL grammatical modifiers.

## Mathematical Logic

### Euler Angle Conversion
We utilize a Perspective-n-Point (PnP) geometry solver to estimate the 3D pose of the head based on 2D facial landmarks obtained from the MediaPipe Face Mesh. PnP maps 2D image points to a 3D generic facial model.
The solver computes the rotation vector, which is then transformed into a rotation matrix using the Rodrigues formula.
Finally, we decompose the rotation matrix to extract the set of Euler angles:
* **Pitch (X-axis):** Up and down nodding motion.
* **Yaw (Y-axis):** Left and right shaking motion.
* **Roll (Z-axis):** Side-to-side tilting motion.

### Threshold Values
The `head_logic.py` module defines empirical thresholds for standardizing movement detection in Indian Sign Language:
* **Pitch Amplitude Threshold:** Minimum deviation to register a "nod" (affirmative). Default `> 3.0` degrees temporal variance.
* **Yaw Amplitude Threshold:** Minimum deviation to register a "shake" (negative). Default `> 3.0` degrees temporal variance.
* **Roll Amplitude Threshold:** Minimum deviation to register a "tilt" (question/uncertainty). Default `> 2.5` degrees.
Variances must exceed thresholds within our configured temporal sliding window to output high-confidence modifiers.

## API Endpoints Specs

### `GET /health`
Returns service health.

### `GET /dataset-index`
Returns detected phrase class folders from `../dataset`.

### `POST /analyze`
Analyzes semantic head motion from video files.

**Input:**
* `multipart/form-data` request.
* `file`: A binary video file (`.mp4 | .webm | .mov`). 
* `source_phrase` (optional): User's selected manual phrase context.

**Output `JSON`:**
```json
{
  "modifier": "affirmation | negation | question_uncertainty | neutral | undetermined",
  "confidence": 0.85,
  "reason": "Pitch variance exceeded nod threshold.",
  "fps": 30.0,
  "total_frames": 150,
  "frames": [
    {
      "pitch": 0.5,
      "yaw": 0.1,
      "roll": -0.2
    }
  ],
  "source_phrase": "optional_echoed_phrase"
}
```

## Local Development

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 7860
```

## Evaluation Pipeline (Baseline First)
1. Generate a label template from dataset folders:
```bash
python evaluate_dataset.py --dataset-root ../dataset --labels-csv dataset_labels.csv --write-template
```
2. Fill `dataset_labels.csv` with expected labels per folder.
3. Run baseline evaluation and export full metrics:
```bash
python evaluate_dataset.py --dataset-root ../dataset --labels-csv dataset_labels.csv --output-json artifacts/baseline_metrics.json
```

## Hybrid Temporal Classifier (If Baseline Is Weak)
Train a lightweight calibrated temporal classifier on pitch/yaw/roll sequences:
```bash
python train_hybrid.py --dataset-root ../dataset --labels-csv dataset_labels.csv --output-dir artifacts/hybrid
```
Then evaluate with calibrated hybrid predictions:
```bash
python evaluate_dataset.py --dataset-root ../dataset --labels-csv dataset_labels.csv --use-hybrid --hybrid-model-dir artifacts/hybrid --output-json artifacts/hybrid_metrics.json
```

## Hugging Face Space Deployment
1. Push this `backend/` folder to your Docker Space repository.
2. Ensure `Dockerfile` and `requirements.txt` are committed.
3. Use port `7860`.
4. Backend URL target: <https://huggingface.co/spaces/01mayankk/computervision-backend>
