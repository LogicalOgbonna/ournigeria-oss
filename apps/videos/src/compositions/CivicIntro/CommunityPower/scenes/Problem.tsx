import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { ci, countUp } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const PROBLEM_STATS = [
  { label: "Elected Officials", value: 11000, suffix: "+" },
  { label: "Publicly Known", value: 30, suffix: "%" },
  { label: "Missing Photos", value: 70, suffix: "%" },
  { label: "No Contact Info", value: 85, suffix: "%" },
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0, 15], [0, 1]);
  const titleY = ci(frame, [0, 15], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
      }}
    >
      <EmeraldOrbs opacity={0.3} />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 10,
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontFamily: instrumentSerif,
            fontWeight: 400,
            color: "#fff",
            lineHeight: 1.2,
          }}
        >
          The Problem
        </div>
        <div
          style={{
            fontSize: 20,
            fontFamily: dmSans,
            color: "rgba(255,255,255,0.4)",
            marginTop: 12,
          }}
        >
          Nigeria has thousands of officials, but most are invisible
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          width: "100%",
          maxWidth: 520,
          zIndex: 10,
        }}
      >
        {PROBLEM_STATS.map((stat, i) => {
          const start = 30 + i * 15;
          const prog = spring({
            frame: Math.max(0, frame - start),
            fps,
            config: { damping: 18, stiffness: 80 },
          });

          const current = countUp(
            frame,
            start + 5,
            start + 5 + Math.round(fps * 1),
            stat.value,
          );

          const isWarning = i >= 2;

          return (
            <div
              key={i}
              style={{
                padding: "24px 20px",
                borderRadius: 20,
                background: isWarning
                  ? "rgba(239, 68, 68, 0.04)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${isWarning ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.06)"}`,
                textAlign: "center",
                opacity: prog,
                transform: `scale(${0.85 + prog * 0.15})`,
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  fontFamily: ibmPlexMono,
                  fontWeight: 700,
                  color: isWarning ? "#ef4444" : "#fff",
                  lineHeight: 1,
                  textShadow: isWarning
                    ? "0 0 30px rgba(239, 68, 68, 0.3)"
                    : "none",
                }}
              >
                {stat.value > 100
                  ? current.toLocaleString()
                  : current}
                {stat.suffix}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: dmSans,
                  marginTop: 10,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom caption */}
      <div
        style={{
          opacity: ci(frame, [120, 140], [0, 1]),
          transform: `translateY(${ci(frame, [120, 140], [20, 0])}px)`,
          zIndex: 10,
          marginTop: 40,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontFamily: dmSans,
            fontWeight: 600,
            color: "#f59e0b",
          }}
        >
          Citizens deserve better.
        </div>
      </div>
    </AbsoluteFill>
  );
};
