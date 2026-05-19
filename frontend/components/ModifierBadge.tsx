// This directive marks this badge as a client component.
"use client";
// This import provides Framer Motion enter animations.
import { motion } from "framer-motion";

// This type defines accepted modifier badge props.
type ModifierBadgeProps = {
  // This field stores resolved modifier label.
  modifier: string;
  // This field stores confidence value from backend.
  confidence: number;
  // This field stores model reasoning sentence.
  reason: string;
  // This field stores analyzed frame count for context.
  totalFrames: number;
  // This field stores measured source fps for context.
  fps: number;
};

// This helper maps modifier labels to display text.
const modifierText: Record<string, string> = {
  affirmation: "Affirmation (Nod)",
  negation: "Negation (Shake)",
  question_uncertainty: "Question / Uncertainty (Tilt)",
  neutral: "Neutral",
  undetermined: "Undetermined",
};

// This component renders animated floating result card.
export default function ModifierBadge({ modifier, confidence, reason, totalFrames, fps }: ModifierBadgeProps) {
  // This line computes percentage string for confidence display.
  const percentage = Math.round(confidence * 100);
  // This line maps confidence score to qualitative trust level text.
  const confidenceLabel = percentage >= 80 ? "High confidence" : percentage >= 55 ? "Moderate confidence" : "Low confidence";
  // This line maps modifiers to user-friendly interpretation summaries.
  const interpretation =
    modifier === "affirmation"
      ? "The head motion pattern indicates agreement or confirmation."
      : modifier === "negation"
        ? "The head motion pattern indicates disagreement or rejection."
        : modifier === "question_uncertainty"
          ? "The head motion pattern indicates questioning or uncertainty."
          : "No dominant head-motion modifier was detected.";

  // This return renders animated badge and details.
  return (
    // This motion section floats in after analysis completion.
    <motion.section
      initial={{ opacity: 0, y: 28, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="glass-panel neon-outline float-slow rounded-3xl p-6"
    >
      {/* This small label identifies card category. */}
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Detected modifier</p>
      {/* This heading presents mapped linguistic output. */}
      <h3 className="mt-2 text-2xl font-semibold text-white">{modifierText[modifier] ?? modifier}</h3>
      {/* This paragraph shows confidence and explanation text. */}
      <p className="mt-3 text-sm font-medium text-cyan-100">Confidence: {percentage}% ({confidenceLabel})</p>
      {/* This paragraph provides more descriptive interpretation for users. */}
      <p className="mt-2 text-sm text-slate-100">{interpretation}</p>
      {/* This paragraph gives classifier rationale to the user. */}
      <p className="mt-2 text-sm text-slate-200">{reason}</p>
      {/* This paragraph shows numeric processing context for transparency. */}
      <p className="mt-3 text-xs text-slate-300">Frames analyzed: {totalFrames} | Source FPS: {fps.toFixed(2)}</p>
    </motion.section>
  );
}
