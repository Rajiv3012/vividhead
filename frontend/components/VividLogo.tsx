// This directive marks this SVG component for client rendering.
"use client";
// This import provides React typing for SVG props.
import type { SVGProps } from "react";

// This component renders the VividHead brand mark with motion symbolism.
export default function VividLogo(props: SVGProps<SVGSVGElement>) {
  // This return renders minimalist head silhouette using three neon lines.
  return (
    // This svg defines the logo canvas dimensions and viewbox.
    <svg viewBox="0 0 72 72" fill="none" aria-label="VividHead logo" {...props}>
      {/* This left contour line forms one side of the head silhouette. */}
      <path d="M23 18C17 26 16 45 24 54" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.72" />
      {/* This center tracking line animates to represent active motion sensing. */}
      <line className="logo-tilt" x1="36" y1="16" x2="36" y2="56" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
      {/* This right contour line forms the opposite side of the silhouette. */}
      <path d="M49 18C55 26 56 45 48 54" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.72" />
      {/* This lower arc line closes the facial geometry impression. */}
      <path d="M24 54C29 59 43 59 48 54" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.88" />
    </svg>
  );
}
