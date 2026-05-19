// This directive marks the component for client-side rendering.
"use client";
// This import provides hook utilities for canvas updates.
import { useEffect, useRef } from "react";

// This type defines a normalized 2D landmark point.
type MeshPoint = [number, number];

// This type defines props accepted by mesh canvas component.
type MeshCanvasProps = {
  // This field carries the current frame mesh points to draw.
  points: MeshPoint[];
};

// This component draws neon face mesh points over a dark canvas.
export default function MeshCanvas({ points }: MeshCanvasProps) {
  // This ref stores canvas element instance for drawing context access.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // This effect repaints canvas whenever points data changes.
  useEffect(() => {
    // This line reads current canvas reference.
    const canvas = canvasRef.current;
    // This guard exits when canvas is not mounted yet.
    if (!canvas) {
      // This return skips rendering without a canvas target.
      return;
    }
    // This line reads 2D drawing context from canvas.
    const context = canvas.getContext("2d");
    // This guard exits when context acquisition fails.
    if (!context) {
      // This return prevents null-context runtime errors.
      return;
    }
    // This line reads canvas dimensions for normalized mapping.
    const { width, height } = canvas;
    // This line clears previous frame drawing artifacts.
    context.clearRect(0, 0, width, height);
    // This line paints subtle translucent backdrop.
    context.fillStyle = "rgba(4, 8, 20, 0.86)";
    // This line fills complete canvas region.
    context.fillRect(0, 0, width, height);
    // This line configures neon stroke color for mesh network.
    context.strokeStyle = "rgba(94, 242, 255, 0.7)";
    // This line configures line thickness for mesh links.
    context.lineWidth = 1.2;
    // This line starts new path for connecting points.
    context.beginPath();
    // This loop iterates through all provided mesh points.
    points.forEach((point, index) => {
      // This line converts normalized x to canvas x coordinate.
      const x = point[0] * width;
      // This line converts normalized y to canvas y coordinate.
      const y = point[1] * height;
      // This condition moves path cursor at first point.
      if (index === 0) {
        // This line positions path start at first point.
        context.moveTo(x, y);
      } else {
        // This line draws line from previous point to current point.
        context.lineTo(x, y);
      }
      // This line sets cyan fill for each landmark node.
      context.fillStyle = "rgba(114, 255, 201, 0.9)";
      // This line begins a new circular node path.
      context.beginPath();
      // This line draws a small node circle at current point.
      context.arc(x, y, 2.2, 0, Math.PI * 2);
      // This line fills the node circle on canvas.
      context.fill();
    });
    // This line applies stroke to the currently defined path.
    context.stroke();
  }, [points]);

  // This return renders the neon mesh canvas container.
  return (
    // This line wraps canvas in glass panel shell.
    <div className="glass-panel neon-outline float-slow overflow-hidden rounded-3xl p-3">
      {/* This canvas displays detected face mesh landmarks. */}
      <canvas ref={canvasRef} width={640} height={360} className="h-auto w-full rounded-2xl" />
    </div>
  );
}
