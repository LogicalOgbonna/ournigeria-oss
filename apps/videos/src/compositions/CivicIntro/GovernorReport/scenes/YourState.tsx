import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, instrumentSerif, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const METRICS = [
  { label: "Budget Execution Rate", value: "67%", target: "90%", gap: "23% behind target", bad: true },
  { label: "Health Sector Spending", value: "₦45.2B", target: "₦78B allocated", gap: "₦32.8B unspent", bad: true },
  { label: "Education Enrolment", value: "+12%", target: "+15% goal", gap: "On track", bad: false },
  { label: "Infrastructure Projects", value: "18 of 54", target: "completed this year", gap: "33% delivery rate", bad: true },
];

export const YourStateScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = ci(frame, [0, 15], [0, 1]);
  const headingY = ci(frame, [0, 15], [30, 0]);

  const ctaOpacity = ci(frame, [95, 110], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 80px",
        gap: 24,
      }}
    >
      <EmeraldOrbs opacity={0.35} />

      <div
        style={{
          opacity: headingOpacity,
          transform: `translateY(${headingY}px)`,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: 38, fontFamily: instrumentSerif, color: "#fff", lineHeight: 1.2 }}>
          What Your Governor
        </div>
        <div
          style={{
            fontSize: 38,
            fontFamily: instrumentSerif,
            lineHeight: 1.2,
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Owes You
        </div>
      </div>

      <div style={{ width: 520, display: "flex", flexDirection: "column", gap: 10, zIndex: 10 }}>
        {METRICS.map((m, i) => {
          const prog = spring({
            frame: Math.max(0, frame - 20 - i * 8),
            fps,
            config: { damping: 18, stiffness: 90 },
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderRadius: 14,
                background: m.bad ? "rgba(239,68,68,0.04)" : "rgba(52,211,153,0.04)",
                border: `1px solid ${m.bad ? "rgba(239,68,68,0.12)" : "rgba(52,211,153,0.15)"}`,
                opacity: prog,
                transform: `translateY(${(1 - prog) * 16}px)`,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontFamily: dmSans, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 12, fontFamily: dmSans, color: m.bad ? "rgba(239,68,68,0.7)" : "#34d399", marginTop: 3 }}>
                  {m.gap}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontFamily: ibmPlexMono, fontWeight: 700, color: m.bad ? "#ef4444" : "#34d399" }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 11, fontFamily: dmSans, color: "rgba(255,255,255,0.35)" }}>
                  {m.target}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ opacity: ctaOpacity, zIndex: 10, textAlign: "center" }}>
        <div style={{ fontSize: 18, fontFamily: dmSans, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
          Check your own state at{" "}
          <span style={{ color: "#34d399" }}>ournigeria.ng</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
