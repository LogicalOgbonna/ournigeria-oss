import React from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import { ci } from "@/lib/animation-utils";

/** Dark panel wipe from left to right */
export const SceneWipe: React.FC<{
  triggerFrame: number;
  duration?: number;
  color?: string;
}> = ({ triggerFrame, duration, color = "#080c0a" }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const dur = duration ?? Math.round(fps * 0.5);

  const elapsed = frame - triggerFrame;
  if (elapsed < 0 || elapsed > dur) return null;

  const half = dur / 2;
  // First half: panel enters from left; second half: panel exits to right
  const x =
    elapsed <= half
      ? ci(elapsed, [0, half], [-width, 0])
      : ci(elapsed, [half, dur], [0, width]);

  return (
    <AbsoluteFill style={{ zIndex: 9990, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: 0,
          width,
          height,
          background: color,
        }}
      />
    </AbsoluteFill>
  );
};

/** Vignette overlay for Focus Zoom effect */
export const Vignette: React.FC<{ opacity: number }> = ({ opacity }) => {
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        zIndex: 9980,
        pointerEvents: "none",
        background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${opacity * 0.6}) 100%)`,
      }}
    />
  );
};

/** Camera wrapper: applies scale + translate to children */
export const Camera: React.FC<{
  scale: number;
  x?: number;
  y?: number;
  children: React.ReactNode;
}> = ({ scale, x = 0, y = 0, children }) => {
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale}) translate(${x}px, ${y}px)`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
