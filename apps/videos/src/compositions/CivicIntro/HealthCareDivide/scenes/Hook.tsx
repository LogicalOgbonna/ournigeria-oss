import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0.3 * fps, 1 * fps], [0, 1]);
  const titleY = ci(frame, [0.3 * fps, 1 * fps], [50, 0]);

  const statOpacity = ci(frame, [2 * fps, 2.8 * fps], [0, 1]);
  const statY = ci(frame, [2 * fps, 2.8 * fps], [30, 0]);

  const subOpacity = ci(frame, [2.8 * fps, 3.5 * fps], [0, 1]);
  const subY = ci(frame, [2.8 * fps, 3.5 * fps], [20, 0]);

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
      <EmeraldOrbs opacity={0.4} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "0 80px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 58,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            Nigeria's Health Budget
          </div>
          <div
            style={{
              fontSize: 58,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.15,
              background: "linear-gradient(135deg, #34d399, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Per Person, Per Day
          </div>
        </div>

        {/* Big stat */}
        <div
          style={{
            opacity: statOpacity,
            transform: `translateY(${statY}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontFamily: ibmPlexMono,
              fontWeight: 700,
              color: "#fbbf24",
              lineHeight: 1,
              letterSpacing: "-2px",
            }}
          >
            ₦187
          </div>
          <div
            style={{
              fontSize: 18,
              fontFamily: dmSans,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            per Nigerian per day
          </div>
        </div>

        {/* Sub text */}
        <div
          style={{
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          <p
            style={{
              fontSize: 24,
              maxWidth: 420,
              margin: "0 auto",
              color: "rgba(255,255,255,0.5)",
              fontFamily: dmSans,
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            Less than a bottle of water. Less than a phone call.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
