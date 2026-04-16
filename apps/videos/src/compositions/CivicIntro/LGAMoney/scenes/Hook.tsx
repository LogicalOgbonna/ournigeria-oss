import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci, countUp } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

// Total FAAC to all 774 LGAs for 2023: ₦1.2T
const FAAC_TARGET = 1_200_000_000_000;

const formatFAAC = (n: number): string => {
  if (n >= 1_000_000_000_000) {
    return `₦${(n / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (n >= 1_000_000_000) {
    return `₦${(n / 1_000_000_000).toFixed(0)}B`;
  }
  return `₦${(n / 1_000_000).toFixed(0)}M`;
};

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0.3 * fps, 1 * fps], [0, 1]);
  const titleY = ci(frame, [0.3 * fps, 1 * fps], [50, 0]);

  // Counter starts at 1.5*fps, ends at 3.5*fps
  const counterValue = countUp(
    frame,
    Math.round(1.5 * fps),
    Math.round(3.5 * fps),
    FAAC_TARGET
  );

  const counterOpacity = ci(frame, [1.3 * fps, 1.8 * fps], [0, 1]);

  const subOpacity = ci(frame, [3.5 * fps, 4.2 * fps], [0, 1]);
  const subY = ci(frame, [3.5 * fps, 4.2 * fps], [20, 0]);

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
      <EmeraldOrbs opacity={0.35} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "0 80px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        {/* Title lines */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 54,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            Every LGA in Nigeria Received
          </div>
          <div
            style={{
              fontSize: 54,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.15,
              background: "linear-gradient(135deg, #fbbf24, #f97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Money This Month
          </div>
        </div>

        {/* Animated FAAC counter */}
        <div
          style={{
            opacity: counterOpacity,
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
            {formatFAAC(counterValue)}
          </div>
          <div
            style={{
              fontSize: 16,
              fontFamily: dmSans,
              fontWeight: 500,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Total FAAC to all 774 LGAs · 2023
          </div>
        </div>

        {/* Sub */}
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
              lineHeight: 1.55,
            }}
          >
            But do you know where YOUR local government's share went?
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
