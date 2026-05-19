// This directive marks page component as client-side interactive.
"use client";
// This import provides state and memo hooks.
import { useEffect, useMemo, useState } from "react";
// This import provides motion utilities for floating elements.
import { motion } from "framer-motion";
// This import provides upload interaction component.
import UploadZone from "@/components/UploadZone";
// This import provides webcam recording and capture component.
import WebcamCapture from "@/components/WebcamCapture";
// This import provides right-side detailed result interpretation panel.
import ResultPanel from "@/components/ResultPanel";
// This import provides custom VividHead brand symbol.
import VividLogo from "@/components/VividLogo";

// This type defines frame payload received from backend.
type FrameData = {
  // This field stores source frame index.
  frame_index: number;
  // This field stores frame timestamp in seconds.
  timestamp: number;
  // This field stores frame pitch angle.
  pitch: number;
  // This field stores frame yaw angle.
  yaw: number;
  // This field stores frame roll angle.
  roll: number;
  // This field stores normalized mesh points for canvas draw.
  mesh_points: [number, number][];
};

// This type defines analyzer response payload structure.
type AnalyzeResponse = {
  // This field stores final mapped modifier.
  modifier: string;
  // This field stores backend confidence score.
  confidence: number;
  // This field stores classifier explanation text.
  reason: string;
  // This field stores measured source fps value.
  fps: number;
  // This field stores analyzed frame count.
  total_frames: number;
  // This field stores sampled frame-level pose data.
  frames: FrameData[];
  // This field stores backend-resolved source phrase label.
  source_phrase?: string;
};

// This type defines dataset class list payload from backend endpoint.
type DatasetIndexResponse = {
  // This field stores available phrase class names from dataset folders.
  classes: string[];
};

// This helper resolves backend URL from environment with deployed Hugging Face remote fallback.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://01mayankk-computervision-backend.hf.space";

// This component implements full anti-gravity upload and result flow.
export default function HomePage() {
  // This state stores selected video file.
  const [file, setFile] = useState<File | null>(null);
  // This state tracks loading state for request lifecycle.
  const [loading, setLoading] = useState<boolean>(false);
  // This state stores backend analysis response.
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  // This state stores user-facing error details.
  const [error, setError] = useState<string>("");
  // This state switches between upload and webcam input modes.
  const [mode, setMode] = useState<"upload" | "webcam">("upload");
  // This state stores webcam captured blob for analysis requests.
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  // This state stores dataset phrase labels fetched from backend.
  const [phraseOptions, setPhraseOptions] = useState<string[]>([]);
  // This state stores user-selected phrase label for semantic summaries.
  const [selectedPhrase, setSelectedPhrase] = useState<string>("");
  // This memo resolves source phrase context from current input mode.
  const sourceName = useMemo(() => {
    // This condition prefers backend-resolved phrase from inference response.
    if (result?.source_phrase) {
      // This return ensures UI uses canonical phrase context after analysis.
      return result.source_phrase;
    }
    // This condition prefers selected dataset phrase when user picks one.
    if (selectedPhrase) {
      // This return preserves selected dataset phrase context.
      return selectedPhrase;
    }
    // This condition selects uploaded file name for context source.
    if (mode === "upload") {
      // This return provides selected file name fallback.
      return file?.name ?? "unknown phrase";
    }
    // This return labels webcam source when using live capture.
    return "live capture";
  }, [file, mode, result?.source_phrase, selectedPhrase]);

  // This effect loads dataset phrase labels for the phrase selector.
  useEffect(() => {
    // This async function fetches class labels from backend dataset endpoint.
    const loadDatasetClasses = async () => {
      // This try block handles network and parsing failures.
      try {
        // This line requests available class labels from backend.
        const response = await fetch(`${API_URL}/dataset-index`);
        // This guard exits on non-2xx responses without breaking UI.
        if (!response.ok) {
          // This return skips state updates when request fails.
          return;
        }
        // This line parses class list payload from response body.
        const payload = (await response.json()) as DatasetIndexResponse;
        // This line writes class labels into local dropdown options.
        setPhraseOptions(payload.classes ?? []);
      } catch (_error) {
        // This line keeps UI resilient when dataset endpoint is unavailable.
        setPhraseOptions([]);
      }
    };
    // This line starts initial dataset class fetch on component mount.
    loadDatasetClasses();
  }, []);

  // This handler submits selected file to backend analyze endpoint.
  const analyze = async () => {
    // This guard blocks request when no file is selected.
    if (mode === "upload" && !file) {
      // This line sets validation message for missing file.
      setError("Please select an .mp4 file before analyzing.");
      // This return exits early to prevent invalid request.
      return;
    }
    // This guard validates webcam mode capture availability.
    if (mode === "webcam" && !capturedBlob) {
      // This line sets validation message for missing webcam capture.
      setError("Please record a webcam clip before analyzing.");
      // This return exits early to prevent invalid request.
      return;
    }
    // This line clears previous error before new request.
    setError("");
    // This line marks UI as loading.
    setLoading(true);
    // This line resets prior result for clean transition.
    setResult(null);
    // This line initializes multipart form payload.
    const formData = new FormData();
    // This condition forwards selected phrase label for semantic metadata.
    if (selectedPhrase) {
      // This line appends selected phrase to backend analyze request.
      formData.append("source_phrase", selectedPhrase);
    }
    // This line appends selected file under expected key.
    // This condition appends upload file in upload mode.
    if (mode === "upload" && file) {
      // This line appends selected file for backend processing.
      formData.append("file", file);
    }
    // This condition appends webcam blob as webm file in webcam mode.
    if (mode === "webcam" && capturedBlob) {
      // This line wraps blob in a File object for multipart upload.
      const webcamFile = new File([capturedBlob], "webcam-capture.webm", { type: "video/webm" });
      // This line appends webcam file under backend expected key.
      formData.append("file", webcamFile);
    }
    // This try block handles network request lifecycle.
    try {
      // This line posts file to backend analyze endpoint.
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });
      // This guard handles non-2xx responses from backend.
      if (!response.ok) {
        // This line parses backend error payload if provided.
        const detail = await response.text();
        // This line throws request error for catch handler.
        throw new Error(detail || "Failed to analyze video.");
      }
      // This line parses successful JSON analysis payload.
      const payload = (await response.json()) as AnalyzeResponse;
      // This line stores parsed result for UI rendering.
      setResult(payload);
    } catch (requestError) {
      // This line narrows unknown error to readable message.
      const message = requestError instanceof Error ? requestError.message : "Unexpected error during analysis.";
      // This line writes user-facing error content.
      setError(message);
    } finally {
      // This line clears loading state regardless of outcome.
      setLoading(false);
    }
  };

  // This return renders anti-gravity homepage composition.
  return (
    // This main element constrains content width and spacing.
    <main className="relative mx-auto min-h-screen max-w-6xl overflow-hidden px-6 py-10">
      {/* This floating glow orb adds animated background depth. */}
      <motion.div
        className="pointer-events-none absolute -left-16 top-10 h-52 w-52 rounded-full bg-[#22d3ee]/20 blur-3xl"
        animate={{ x: [0, 16, -8, 0], y: [0, 10, -6, 0], opacity: [0.35, 0.62, 0.42, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* This floating glow orb adds animated background depth. */}
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-16 h-64 w-64 rounded-full bg-[#a855f7]/20 blur-3xl"
        animate={{ x: [0, -14, 8, 0], y: [0, -10, 6, 0], opacity: [0.3, 0.58, 0.38, 0.3] }}
        transition={{ duration: 8.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* This floating glow orb adds deep-blue anti-gravity atmosphere. */}
      <motion.div
        className="pointer-events-none absolute left-1/3 top-1/2 h-56 w-56 rounded-full bg-blue-600/20 blur-3xl"
        animate={{ x: [0, 10, -10, 0], y: [0, -8, 6, 0], opacity: [0.28, 0.5, 0.34, 0.28] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* This floating container displays product heading content. */}
      <motion.header
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="glass-panel mb-8 rounded-3xl p-8 md:p-10"
      >
        {/* This row aligns logo and title text in the header card. */}
        <div className="flex items-start gap-4">
          {/* This component renders the custom geometric VividHead symbol. */}
          <div className="rounded-full border border-white/10 bg-black/20 p-2">
            <VividLogo className="h-12 w-12" />
          </div>
          {/* This block contains heading and subheading copy. */}
          <div>
        {/* This title brands the VividHead landing section. */}
            <h1 className="text-4xl font-semibold text-white md:text-5xl">VividHead</h1>
        {/* This subtitle explains NMF-focused translation capability. */}
            <p className="mt-3 max-w-2xl text-white/60">Transform head Non-Manual Features into grammatical text modifiers with fluid, high-fidelity motion intelligence.</p>
          </div>
        </div>
      </motion.header>

      {/* This section lets users choose upload or webcam input mode. */}
      <motion.section initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.05 }} className="mb-6 flex flex-wrap gap-2">
        {/* This button switches input mode to file upload. */}
        <motion.button
          whileHover={{ y: -2, scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode("upload")}
          className={`rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] ${mode === "upload" ? "opacity-100" : "opacity-75"}`}
        >
          Upload MP4
        </motion.button>
        {/* This button switches input mode to webcam recording. */}
        <motion.button
          whileHover={{ y: -2, scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode("webcam")}
          className={`rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] ${mode === "webcam" ? "opacity-100" : "opacity-75"}`}
        >
          Webcam Live Capture
        </motion.button>
      </motion.section>

      {/* This section provides optional phrase selector from dataset labels. */}
      <motion.section initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08 }} className="mb-6">
        {/* This label explains selector purpose for natural summaries. */}
        <label className="mb-2 block text-sm font-medium text-white/80">Phrase context (optional)</label>
        {/* This select allows user to pick dataset folder phrase as source. */}
        <select
          value={selectedPhrase}
          onChange={(event) => setSelectedPhrase(event.target.value)}
          className="glass-panel w-full max-w-md rounded-xl px-3 py-2 text-sm text-white outline-none"
        >
          <option value="" className="bg-[#0f1222] text-white">Auto-detect from file/capture</option>
          {phraseOptions.map((phrase) => (
            <option key={phrase} value={phrase} className="bg-[#0f1222] text-white">
              {phrase}
            </option>
          ))}
        </select>
      </motion.section>

      {/* This grid arranges upload and mesh visualizer panels. */}
      <motion.section initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.68, delay: 0.1 }} className="grid gap-6 md:grid-cols-2">
        {/* This condition renders file-upload panel when upload mode is active. */}
        {mode === "upload" ? (
          // This component handles mp4 selection interaction.
          <UploadZone onFileSelect={setFile} selectedFile={file} loading={loading} />
        ) : (
          // This component handles webcam preview and recording capture.
          <WebcamCapture onCapture={setCapturedBlob} loading={loading} />
        )}
        {/* This component renders scanning state and detailed result engine. */}
        <ResultPanel result={result} loading={loading} sourceName={sourceName} />
      </motion.section>

      {/* This action row contains analysis trigger button. */}
      <motion.section initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="mt-6">
        {/* This motion button adds lift and tap feedback. */}
        <motion.button
          whileHover={{ y: -4, scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          onClick={analyze}
          disabled={loading}
          className={`rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-3 text-sm font-semibold text-white transition hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] disabled:cursor-not-allowed disabled:opacity-70 ${loading ? "processing-glow" : ""}`}
        >
          {loading ? "Analyzing Motion..." : "Run VividHead Analysis"}
        </motion.button>
        {/* This loading hint text explains current processing stage. */}
        {loading ? <p className="mt-3 text-sm text-cyan-100">Processing video, extracting landmarks, and classifying motion...</p> : null}
        {/* This error line shows request issues in red tint. */}
        {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
      </motion.section>
    </main>
  );
}
