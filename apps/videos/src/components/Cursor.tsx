import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { interpolateCursorPath, type CursorWaypoint } from "@/lib/animation-utils";

export const Cursor: React.FC<{ waypoints: CursorWaypoint[] }> = ({
  waypoints,
}) => {
  const frame = useCurrentFrame();
  const { x, y, visible } = interpolateCursorPath(frame, waypoints);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 9999,
        pointerEvents: "none",
        filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.3))",
      }}
    >
      <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
        <path
          d="M2 2L2 22L7.5 16.5L12.5 25L16 23.5L11 15H18L2 2Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export const ClickPulse: React.FC<{
  x: number;
  y: number;
  triggerFrame: number;
  color?: string;
}> = ({ x, y, triggerFrame, color = "rgba(52, 211, 153, 0.6)" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = frame - triggerFrame;
  const duration = Math.round(fps * 0.5);

  if (elapsed < 0 || elapsed > duration) return null;

  const progress = elapsed / duration;
  const scale = 1 + progress * 3;
  const opacity = 1 - progress;

  return (
    <div
      style={{
        position: "absolute",
        left: x - 20,
        top: y - 20,
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        transform: `scale(${scale})`,
        opacity,
        zIndex: 9998,
        pointerEvents: "none",
      }}
    />
  );
};
