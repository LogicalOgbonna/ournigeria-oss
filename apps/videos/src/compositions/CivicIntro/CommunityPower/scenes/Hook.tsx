import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Opacity = ci(frame, [0.3 * fps, 1 * fps], [0, 1]);
  const line1Y = ci(frame, [0.3 * fps, 1 * fps], [50, 0]);

  const line2Opacity = ci(frame, [1 * fps, 1.8 * fps], [0, 1]);
  const line2Y = ci(frame, [1 * fps, 1.8 * fps], [30, 0]);

  const subOpacity = ci(frame, [2 * fps, 2.8 * fps], [0, 1]);

  const fadeOut = ci(frame, [4 * fps, 4.8 * fps], [1, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut,
      }}
    >
      <EmeraldOrbs opacity={0.6} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "0 60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontFamily: dmSans,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Introducing
          </div>
          <div
            style={{
              fontSize: 68,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            People Power
          </div>
        </div>

        <div
          style={{
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
          }}
        >
          <div
            style={{
              fontSize: 44,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.15,
              background: "linear-gradient(135deg, #34d399, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginTop: 8,
            }}
          >
            Verified by Citizens
          </div>
        </div>

        <div
          style={{
            opacity: subOpacity,
            marginTop: 32,
          }}
        >
          <p
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.4)",
              fontFamily: dmSans,
              fontWeight: 500,
            }}
          >
            No government can hide when citizens work together
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
