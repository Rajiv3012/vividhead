// This directive marks this module as a client-side component.
"use client";
// This import provides refs and state hooks for webcam control.
import { useRef, useState } from "react";
// This import provides framer motion transitions for controls.
import { motion } from "framer-motion";

// This type defines callbacks and loading controls for webcam capture.
type WebcamCaptureProps = {
  // This callback returns the recorded webcam blob for analysis upload.
  onCapture: (blob: Blob | null) => void;
  // This field disables controls while backend processing is running.
  loading: boolean;
};

// This component provides live webcam preview and recording actions.
export default function WebcamCapture({ onCapture, loading }: WebcamCaptureProps) {
  // This ref stores the preview video element.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // This ref stores the active media stream for cleanup.
  const streamRef = useRef<MediaStream | null>(null);
  // This ref stores media recorder instance while recording.
  const recorderRef = useRef<MediaRecorder | null>(null);
  // This ref stores recorded chunks before blob assembly.
  const chunksRef = useRef<Blob[]>([]);
  // This state tracks whether camera stream is active.
  const [cameraOn, setCameraOn] = useState<boolean>(false);
  // This state tracks active recording mode.
  const [recording, setRecording] = useState<boolean>(false);
  // This state stores local status messages for the user.
  const [status, setStatus] = useState<string>("Camera is off.");

  // This method requests webcam permission and starts preview stream.
  const startCamera = async () => {
    // This try block handles permission and hardware access failures.
    try {
      // This line requests webcam video stream from browser.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      // This line stores stream for recorder and cleanup routines.
      streamRef.current = stream;
      // This guard ensures video element exists before binding source.
      if (videoRef.current) {
        // This line binds webcam stream to preview element.
        videoRef.current.srcObject = stream;
      }
      // This line marks camera as active in local state.
      setCameraOn(true);
      // This line updates status to guide the next action.
      setStatus("Camera is ready. Record a short clip.");
    } catch (_error) {
      // This line surfaces permission or hardware errors.
      setStatus("Could not access webcam. Please allow camera permissions.");
    }
  };

  // This method stops stream tracks and clears preview safely.
  const stopCamera = () => {
    // This line reads currently active stream reference.
    const stream = streamRef.current;
    // This guard stops tracks only when stream exists.
    if (stream) {
      // This loop stops all active media tracks.
      stream.getTracks().forEach((track) => track.stop());
    }
    // This line clears stream ref after stopping tracks.
    streamRef.current = null;
    // This guard clears preview source when element exists.
    if (videoRef.current) {
      // This line removes video source to release browser resources.
      videoRef.current.srcObject = null;
    }
    // This line marks camera as inactive in local state.
    setCameraOn(false);
  };

  // This method starts a browser recording from active webcam stream.
  const startRecording = () => {
    // This guard ensures stream exists before recording starts.
    if (!streamRef.current) {
      // This line requests user to enable camera first.
      setStatus("Start camera first, then record.");
      // This return prevents invalid recorder creation.
      return;
    }
    // This line resets chunk buffer for fresh recording.
    chunksRef.current = [];
    // This line creates recorder with browser-supported mime type.
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    // This line stores recorder for stop controls.
    recorderRef.current = recorder;
    // This callback captures each recorded binary chunk.
    recorder.ondataavailable = (event: BlobEvent) => {
      // This guard only stores non-empty chunks.
      if (event.data.size > 0) {
        // This line appends chunk for final blob assembly.
        chunksRef.current.push(event.data);
      }
    };
    // This callback finalizes blob and notifies parent component.
    recorder.onstop = () => {
      // This line creates final blob from all chunks.
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      // This line forwards webcam recording to parent analyzer flow.
      onCapture(blob);
      // This line updates UI status after successful capture.
      setStatus("Webcam clip captured. Click analyze.");
      // This line marks recording as stopped.
      setRecording(false);
    };
    // This line starts recording with regular chunk emission cadence.
    recorder.start(300);
    // This line marks recording as active for control states.
    setRecording(true);
    // This line updates status message for user guidance.
    setStatus("Recording... click Stop Recording when done.");
  };

  // This method stops recording if recorder is currently active.
  const stopRecording = () => {
    // This guard checks recorder exists and is recording.
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      // This line stops recorder and triggers onstop callback.
      recorderRef.current.stop();
    }
  };

  // This method clears prior capture and keeps camera ready.
  const clearCapture = () => {
    // This line sends null to parent to clear captured blob.
    onCapture(null);
    // This line updates status to indicate clean state.
    setStatus("Capture cleared. Record a new clip.");
  };

  // This return renders webcam controls and live preview.
  return (
    // This wrapper uses consistent glass visual language.
    <motion.div className="glass-panel neon-outline rounded-3xl p-6 md:p-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* This heading labels webcam mode panel clearly. */}
      <h2 className="text-xl font-semibold text-white">Use webcam</h2>
      {/* This helper text describes capture workflow briefly. */}
      <p className="mt-2 text-sm text-slate-200">Start camera, record a short clip, then run analysis.</p>
      {/* This video block shows live camera preview. */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-200/30 bg-slate-950/70">
        {/* This preview renders current webcam stream if available. */}
        <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
      </div>
      {/* This row contains camera and recording controls. */}
      <div className="mt-4 flex flex-wrap gap-2">
        {/* This button starts camera permissions and preview. */}
        <button onClick={startCamera} disabled={cameraOn || loading} className="rounded-xl border border-cyan-200/35 bg-cyan-300/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          Start Camera
        </button>
        {/* This button starts recording when camera is available. */}
        <button onClick={startRecording} disabled={!cameraOn || recording || loading} className="rounded-xl border border-emerald-200/35 bg-emerald-300/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          Start Recording
        </button>
        {/* This button stops an active recording session. */}
        <button onClick={stopRecording} disabled={!recording || loading} className="rounded-xl border border-amber-200/35 bg-amber-300/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          Stop Recording
        </button>
        {/* This button clears captured blob from parent state. */}
        <button onClick={clearCapture} disabled={loading} className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          Clear Capture
        </button>
        {/* This button turns off camera and releases device resources. */}
        <button onClick={stopCamera} disabled={!cameraOn || loading} className="rounded-xl border border-rose-200/35 bg-rose-300/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
          Stop Camera
        </button>
      </div>
      {/* This line communicates webcam status in readable contrast. */}
      <p className="mt-3 text-xs text-slate-100">{status}</p>
    </motion.div>
  );
}
