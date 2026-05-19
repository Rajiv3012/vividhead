// This directive marks this module as a client component.
"use client";
// This import provides animated transitions and layout orchestration.
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
// This import provides semantic translator utilities for human-first output.
import { buildFinalTranslation, formatDisplaySource, getISLMeaning } from "@/logic/translator";

// This type defines one frame entry from the analyzer response.
type FrameData = {
  // This field stores normalized mesh points for visualization.
  mesh_points: [number, number][];
};

// This type defines shape of analyzer response used by result panel.
type AnalyzeResponse = {
  // This field stores resolved grammatical modifier.
  modifier: string;
  // This field stores confidence score from backend.
  confidence: number;
  // This field stores model-provided explanation details.
  reason: string;
  // This field stores sampled frame data for optional mesh preview.
  frames: FrameData[];
};

// This type defines props required by the detailed result engine.
type ResultPanelProps = {
  // This field stores analyzer output to render final panel.
  result: AnalyzeResponse | null;
  // This field indicates backend request in progress state.
  loading: boolean;
  // This field stores selected phrase-like source for context mapping.
  sourceName: string;
};

// This component renders scanning state and the detailed result engine.
export default function ResultPanel({ result, loading, sourceName }: ResultPanelProps) {
  // This line normalizes source name used in context statements.
  const source = formatDisplaySource(sourceName);
  // This line maps modifier into human-first movement semantics.
  const semantic = getISLMeaning(result?.modifier ?? "neutral", sourceName);
  // This line computes confidence percentage for progress bar display.
  const confidencePercent = Number(((result?.confidence ?? 0) * 100).toFixed(1));
  // This line creates phrase sentence from source for context section.
  const phraseSentence = `The signer is expressing the phrase: "${source}".`;
  // This line builds final translation sentence from semantic engine.
  const finalSummary = buildFinalTranslation(result?.modifier ?? "neutral", sourceName);
  // This line selects a sample mesh point count for quick feedback.
  const meshPointCount = result?.frames?.[0]?.mesh_points?.length ?? 0;

  // This return renders right-side panel with loading and result states.
  return (
    // This layout group coordinates smooth layout transitions.
    <LayoutGroup>
      {/* This container keeps consistent card shape and styling. */}
      <motion.div layout className="glass-panel neon-outline relative min-h-[320px] overflow-hidden rounded-3xl p-6">
        {/* This loading beam renders animated neon border while processing. */}
        {loading ? <motion.div className="beam-border absolute inset-0 rounded-3xl" aria-hidden="true" /> : null}
        {/* This animate presence switches scanning and result content smoothly. */}
        <AnimatePresence mode="wait">
          {/* This condition renders detailed result card when result exists. */}
          {result ? (
            // This motion section uses layout animation for result transition.
            <motion.section
              key="result"
              layoutId="result-layout"
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="relative z-10"
            >
              {/* This wrapper creates subtle anti-gravity vertical drifting. */}
              <motion.div animate={{ y: [0, -5, 0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="space-y-4">
                {/* This heading labels the intelligence panel identity. */}
                <h3 className="text-lg font-semibold text-white">Detailed Result Engine</h3>
                {/* This section presents contextual interpretation details. */}
                <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-3">
                {/* This line item displays source context and english statement. */}
                <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                  <p className="text-sm font-medium text-cyan-300">📹 Video Context:</p>
                  <p className="text-sm text-white/85">Source: {source}</p>
                  <p className="text-sm text-white/70">{phraseSentence}</p>
                </motion.div>
                {/* This line item displays detected intent explanation. */}
                <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                  <p className="text-sm font-medium text-cyan-300">🧠 Detected Intent:</p>
                  <p className="text-sm text-white/85">{semantic.englishContext}</p>
                </motion.div>
                {/* This line item displays movement indicator and technical detail. */}
                <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className={`rounded-2xl border bg-black/25 p-3 ${semantic.pulseClass}`}>
                  <p className="text-sm font-medium text-cyan-300">👤 Movement Detected: {semantic.indicatorIcon} {semantic.action}</p>
                  <p className="text-sm text-white/70">Technical Detail: {semantic.technicalDetail}</p>
                </motion.div>
                {/* This line item displays confidence with neon progress bar. */}
                <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                  <p className="text-sm font-medium text-cyan-300">📊 Confidence Score:</p>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidencePercent}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full shadow-[0_0_18px_rgba(34,211,238,0.65)]"
                      style={{ backgroundColor: semantic.themeColor }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-white/85">{confidencePercent}% Confidence</p>
                </motion.div>
                {/* This line item displays final synthesized english meaning. */}
                <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="rounded-2xl border border-cyan-300/40 bg-black/65 p-3">
                  <p className="text-sm font-medium text-cyan-300">📢 Simple English Summary:</p>
                  <p className="text-sm font-semibold text-white">{finalSummary}</p>
                  <p className="mt-1 text-xs text-white/70">({semantic.explanation})</p>
                  <p className="mt-1 text-xs text-white/60">{result.reason} | Mesh points sampled: {meshPointCount}</p>
                </motion.div>
                </motion.div>
              </motion.div>
            </motion.section>
          ) : (
            // This fallback section shows scanning state before results.
            <motion.section
              key="scanning"
              layoutId="result-layout"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 flex h-full min-h-[260px] flex-col items-center justify-center"
            >
              {/* This pulse circle provides scanning visual feedback. */}
              <motion.div
                className="h-24 w-24 rounded-full border border-cyan-300/50 bg-cyan-300/10"
                animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* This scanning label clarifies idle/processing state. */}
              <p className="mt-4 text-sm font-medium text-cyan-200">{loading ? "Scanning..." : "Awaiting analysis..."}</p>
              {/* This helper subtitle guides the expected user action. */}
              <p className="mt-2 text-xs text-white/55">Upload or capture a clip, then run analysis.</p>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}
