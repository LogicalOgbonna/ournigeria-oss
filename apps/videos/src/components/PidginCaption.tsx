import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans } from "@/lib/fonts";

/**
 * Animated Pidgin English caption overlay.
 * Positioned at the bottom of the frame with a semi-transparent background.
 */
export const PidginCaption: React.FC<{
  text: string;
  animationStart?: number;
  position?: "bottom" | "top";
}> = ({ text, animationStart = 0, position = "bottom" }) => {
  const frame = useCurrentFrame();

  const opacity = ci(
    frame,
    [animationStart, animationStart + 12],
    [0, 1],
  );

  const y = ci(
    frame,
    [animationStart, animationStart + 12],
    [20, 0],
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        [position]: 80,
        opacity,
        transform: `translateY(${position === "bottom" ? y : -y}px)`,
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(10px)",
          borderRadius: 16,
          padding: "16px 24px",
          border: "1px solid rgba(52, 211, 153, 0.2)",
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: "#fff",
            fontFamily: dmSans,
            fontWeight: 600,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          <span style={{ color: "#34d399", marginRight: 8 }}>🗣</span>
          {text}
        </div>
      </div>
    </div>
  );
};
