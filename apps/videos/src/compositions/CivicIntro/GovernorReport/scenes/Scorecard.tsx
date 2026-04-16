import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const GOVERNORS = [
  { name: "Soludo (Anambra)", grade: "A", color: "#34d399", score: 88, metric: "92% budget execution" },
  { name: "Makinde (Oyo)", grade: "B+", color: "#059669", score: 78, metric: "78% education spend" },
  { name: "Sanwo-Olu (Lagos)", grade: "B", color: "#0891b2", score: 71, metric: "67% health allocation" },
  { name: "Buni (Yobe)", grade: "D", color: "#f97316", score: 38, metric: "31% capital execution" },
  { name: "Adeleke (Osun)", grade: "F", color: "#ef4444", score: 22, metric: "19% projects completed" },
];

const GRADE_COLOR: Record<string, string> = {
  "A": "#34d399", "B+": "#059669", "B": "#0891b2",
  "C": "#d97706", "D": "#f97316", "F": "#ef4444",
};

export const GovernorScorecardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 80px",
        gap: 20,
      }}
    >
      <EmeraldOrbs opacity={0.25} />

      <div
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: 38, fontFamily: instrumentSerif, color: "#fff" }}>
          Governor Report Cards — 2024
        </div>
        <div style={{ fontSize: 15, fontFamily: dmSans, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
          Scored on: budget execution · health · education · infrastructure
        </div>
      </div>

      <div style={{ width: 520, display: "flex", flexDirection: "column", gap: 10, zIndex: 10 }}>
        {GOVERNORS.map((gov, i) => {
          const prog = spring({
            frame: Math.max(0, frame - 15 - i * 8),
            fps,
            config: { damping: 18, stiffness: 90 },
          });
          const barWidth = ci(frame, [20 + i * 8, 50 + i * 8], [0, gov.score]);
          const gradeColor = GRADE_COLOR[gov.grade] || "#94a3b8";

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 18px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid rgba(255,255,255,0.07)`,
                borderLeft: `4px solid ${gradeColor}`,
                opacity: prog,
                transform: `translateY(${(1 - prog) * 24}px)`,
              }}
            >
              {/* Grade badge */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${gradeColor}22`,
                  border: `2px solid ${gradeColor}55`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 22, fontFamily: ibmPlexMono, fontWeight: 700, color: gradeColor }}>
                  {gov.grade}
                </span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: dmSans, color: "#fff" }}>
                  {gov.name}
                </div>
                <div style={{ fontSize: 12, fontFamily: dmSans, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  {gov.metric}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    height: 4,
                    borderRadius: 100,
                    background: "rgba(255,255,255,0.06)",
                    width: "100%",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: "100%",
                      borderRadius: 100,
                      background: `linear-gradient(90deg, ${gradeColor}88, ${gradeColor})`,
                    }}
                  />
                </div>
              </div>

              {/* Score */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span style={{ fontSize: 24, fontFamily: ibmPlexMono, fontWeight: 700, color: gradeColor }}>
                  {gov.score}
                </span>
                <span style={{ fontSize: 13, fontFamily: dmSans, color: "rgba(255,255,255,0.3)" }}>/100</span>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
