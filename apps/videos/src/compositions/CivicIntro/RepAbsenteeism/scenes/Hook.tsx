import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const RepAbsenteeismHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Opacity = ci(frame, [0.3 * fps, 1 * fps], [0, 1]);
  const line1Y = ci(frame, [0.3 * fps, 1 * fps], [40, 0]);
  const line2Opacity = ci(frame, [1.2 * fps, 2 * fps], [0, 1]);
  const line2Y = ci(frame, [1.2 * fps, 2 * fps], [25, 0]);
  const statOpacity = ci(frame, [2 * fps, 2.8 * fps], [0, 1]);
  const fadeOut = ci(frame, [4 * fps, 4.8 * fps], [1, 0]);

  // Blinking attendance indicator
  const blink = Math.floor((frame / fps) / 0.4) % 2 === 0;

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

      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 80px" }}>
        <div style={{ opacity: line1Opacity, transform: `translateY(${line1Y}px)` }}>
          <div style={{ fontSize: 62, fontFamily: instrumentSerif, fontWeight: 400, color: "#fff", lineHeight: 1.15 }}>
            You Pay Their Salary.
          </div>
        </div>

        <div style={{ opacity: line2Opacity, transform: `translateY(${line2Y}px)`, marginTop: 8 }}>
          <div
            style={{
              fontSize: 62,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.15,
              background: "linear-gradient(135deg, #ef4444, #f97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Are They Showing Up?
          </div>
        </div>

        <div style={{ opacity: statOpacity, marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { label: "Avg NASS Attendance", value: "58%", color: "#f97316" },
            { label: "Bills Sponsored", value: "2.1", color: "#fbbf24" },
            { label: "Your Rep's Salary/yr", value: "₦42M", color: "#34d399" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                padding: "12px 20px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 28, fontFamily: ibmPlexMono, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, fontFamily: dmSans, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
