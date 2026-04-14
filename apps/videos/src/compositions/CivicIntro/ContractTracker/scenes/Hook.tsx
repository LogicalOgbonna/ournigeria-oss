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

  const subOpacity = ci(frame, [1.2 * fps, 1.8 * fps], [0, 1]);
  const subY = ci(frame, [1.2 * fps, 1.8 * fps], [20, 0]);

  const statOpacity = ci(frame, [2.2 * fps, 2.8 * fps], [0, 1]);
  const statY = ci(frame, [2.2 * fps, 2.8 * fps], [30, 0]);

  const statSubOpacity = ci(frame, [2.6 * fps, 3.2 * fps], [0, 1]);

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
        {/* Title block */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 62,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            Your Government Awarded
          </div>
          <div
            style={{
              fontSize: 62,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.15,
              background: "linear-gradient(135deg, #fbbf24, #f97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ₦2.4 Trillion in Contracts
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            marginTop: 24,
          }}
        >
          <p
            style={{
              fontSize: 24,
              maxWidth: 420,
              margin: "0 auto",
              color: "rgba(255,255,255,0.55)",
              fontFamily: dmSans,
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            In 2023. How many were completed?
          </p>
        </div>

        {/* Big stat */}
        <div
          style={{
            opacity: statOpacity,
            transform: `translateY(${statY}px)`,
            marginTop: 36,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontFamily: ibmPlexMono,
              fontWeight: 700,
              color: "#ef4444",
              lineHeight: 1,
            }}
          >
            11%
          </div>
          <div
            style={{
              opacity: statSubOpacity,
              fontSize: 18,
              fontFamily: dmSans,
              fontWeight: 500,
              color: "rgba(255,255,255,0.45)",
              marginTop: 10,
            }}
          >
            of contracted projects were delivered on time
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
