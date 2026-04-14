import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const REPS = [
  { name: "Tajudeen Abbas (Speaker)", state: "Kaduna", attended: 84, bills: 12, color: "#34d399" },
  { name: "Benjamin Kalu (Deputy)", state: "Abia", attended: 79, bills: 9, color: "#059669" },
  { name: "Obi Aguocha", state: "Abia East", attended: 41, bills: 1, color: "#f97316" },
  { name: "Abubakar Fulata", state: "Jigawa", attended: 22, bills: 0, color: "#ef4444" },
  { name: "Gideon Gwani", state: "Taraba", attended: 18, bills: 0, color: "#ef4444" },
];

export const VoteRecordScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 12], [0, 1]);
  const headerY = ci(frame, [0, 12], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 80px",
        gap: 18,
      }}
    >
      <EmeraldOrbs opacity={0.25} />

      <div style={{ opacity: headerOpacity, transform: `translateY(${headerY}px)`, textAlign: "center", zIndex: 10 }}>
        <div style={{ fontSize: 34, fontFamily: instrumentSerif, color: "#fff" }}>
          2023–2024 NASS Attendance
        </div>
        <div style={{ fontSize: 14, fontFamily: dmSans, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
          House of Reps — Selected Members
        </div>
      </div>

      <div style={{ width: 520, display: "flex", flexDirection: "column", gap: 10, zIndex: 10 }}>
        {REPS.map((rep, i) => {
          const prog = spring({ frame: Math.max(0, frame - 12 - i * 7), fps, config: { damping: 18, stiffness: 90 } });
          const barWidth = ci(frame, [18 + i * 7, 45 + i * 7], [0, rep.attended]);

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
                border: `1px solid rgba(255,255,255,0.06)`,
                borderLeft: `4px solid ${rep.color}`,
                opacity: prog,
                transform: `translateY(${(1 - prog) * 20}px)`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: dmSans, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {rep.name}
                </div>
                <div style={{ fontSize: 11, fontFamily: dmSans, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                  {rep.state}
                </div>
                <div style={{ marginTop: 6, height: 4, borderRadius: 100, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 100, background: `linear-gradient(90deg, ${rep.color}88, ${rep.color})` }} />
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontFamily: ibmPlexMono, fontWeight: 700, color: rep.color }}>
                  {rep.attended}%
                </div>
                <div style={{ fontSize: 10, fontFamily: dmSans, color: "rgba(255,255,255,0.3)" }}>
                  {rep.bills} bill{rep.bills !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ zIndex: 10, opacity: ci(frame, [80, 95], [0, 1]) }}>
        <div style={{ padding: "10px 24px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <span style={{ fontSize: 16, fontFamily: dmSans, fontWeight: 600, color: "#ef4444" }}>
            The bottom 10 reps collectively sponsored 0 bills in 12 months.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
