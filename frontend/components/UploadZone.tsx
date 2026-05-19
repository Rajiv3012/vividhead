// This directive marks the component as client-rendered.
"use client";
// This import provides typed file input change events.
import type { ChangeEvent } from "react";
// This import provides drag event typing for drop-zone handling.
import type { DragEvent } from "react";
// This import provides state hook for drag-hover visuals.
import { useState } from "react";
// This import provides Framer Motion interaction animations.
import { motion } from "framer-motion";

// This type defines props for upload component behavior.
type UploadZoneProps = {
  // This callback sends selected file to parent state.
  onFileSelect: (file: File | null) => void;
  // This field stores currently selected file for preview text.
  selectedFile: File | null;
  // This field disables interaction while API request is in flight.
  loading: boolean;
};

// This component renders anti-gravity styled upload controls.
export default function UploadZone({ onFileSelect, selectedFile, loading }: UploadZoneProps) {
  // This state tracks drag-hover condition for glowing dotted border.
  const [dragActive, setDragActive] = useState<boolean>(false);

  // This handler captures file input changes and forwards first file.
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    // This line reads first selected file or null.
    const file = event.target.files?.[0] ?? null;
    // This line forwards file state to parent component.
    onFileSelect(file);
  };

  // This handler enables drag-over visual state and prevents default open.
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    // This line prevents browser from opening file directly.
    event.preventDefault();
    // This line toggles drag-active style state.
    setDragActive(true);
  };

  // This handler disables drag-hover state when drag leaves drop zone.
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    // This line prevents default browser behavior.
    event.preventDefault();
    // This line clears drag-active style state.
    setDragActive(false);
  };

  // This handler receives dropped file and forwards it to parent.
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    // This line prevents default browser file handling.
    event.preventDefault();
    // This line clears drag-active state after drop.
    setDragActive(false);
    // This line reads first dropped file if available.
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    // This line forwards dropped file to parent state.
    onFileSelect(droppedFile);
  };

  // This return renders animated upload panel UI.
  return (
    // This wrapper adds hover lift motion to glass card.
    <motion.div
      className="glass-panel neon-outline float-slow rounded-3xl p-6 md:p-8"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}
      animate={{ scale: selectedFile ? 0.98 : 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
    >
      {/* This heading labels the upload section purpose. */}
      <h2 className="text-xl font-semibold text-white">Drop an ISL clip</h2>
      {/* This paragraph provides upload format guidance. */}
      <p className="mt-2 text-sm text-slate-100">Upload an `.mp4` to decode head-motion modifiers.</p>
      {/* This label styles hidden file input as a button-like surface. */}
      <label
        className={`mt-5 flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed px-4 py-4 text-sm font-medium text-white transition ${dragActive ? "border-cyan-300 bg-cyan-400/25 shadow-[0_0_20px_rgba(34,211,238,0.45)]" : "border-cyan-200/45 bg-white/10 hover:bg-cyan-400/20"}`}
      >
        {/* This span shows button text based on loading state. */}
        <span>{loading ? "Analyzing..." : dragActive ? "Drop file here" : "Choose MP4 file"}</span>
        {/* This input captures file selection while remaining visually hidden. */}
        <input type="file" accept="video/mp4" className="hidden" onChange={handleFileChange} disabled={loading} />
      </label>
      {/* This paragraph prints selected filename when available. */}
      <p className="mt-4 text-xs text-slate-100">{selectedFile ? `Selected: ${selectedFile.name}` : "No file selected yet."}</p>
    </motion.div>
  );
}
