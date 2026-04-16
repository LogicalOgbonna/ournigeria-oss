import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, countUp, formatNumber } from "@/lib/animation-utils";
import { dmSans, instrumentSerif, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const CostOfAbsenceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = ci(frame, [0, 15], [0, 1]);
  const headingY = ci(frame, [0, 15], [30, 0]);

  // Total wasted salary for absent reps
  const WASTED = 2_940_000_000; // ~₦2.94B
  const animatedWaste = countUp(frame, 15, 60, WASTED);

  const wastedProg = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 20, stiffness: 80 } });

  const items = [
    { icon: "🏫", text: "9,800 primary school desks" },
    { icon: "💊", text: "14.7M malaria treatment courses" },
    { icon: "🚰", text: "980 rural boreholes" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px 80px",
        gap: 30,
      }}
    >
      <EmeraldOrbs opacity={0.35} />

      <div style={{ opacity: headingOpacity, transform: `translateY(${headingY}px)`, textAlign: "center", zIndex: 10 }}>
        <div style={{ fontSize: 28, fontFamily: dmSans, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
          In 2023, absent reps cost Nigeria:
        </div>
        <div
          style={{
            fontSize: 68,
            fontFamily: ibmPlexMono,
            fontWeight: 700,
            color: "#ef4444",
            textShadow: "0 0 40px rgba(239,68,68,0.4)",
            opacity: wastedProg,
            transform: `scale(${0.85 + wastedProg * 0.15})`,
            lineHeight: 1,
          }}
        >
          ₦{(animatedWaste / 1_000_000_000).toFixed(2)}B
        </div>
        <div style={{ fontSize: 18, fontFamily: dmSans, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
          in salaries paid for zero work
        </div>
      </div>

      <div style={{ fontSize: 26, fontFamily: instrumentSerif, color: "#fff", zIndex: 10, opacity: ci(frame, [50, 65], [0, 1]) }}>
        That money could have paid for:
      </div>

      <div style={{ display: "flex", gap: 20, zIndex: 10 }}>
        {items.map((item, i) => {
          const prog = spring({ frame: Math.max(0, frame - 60 - i * 10), fps, config: { damping: 18, stiffness: 90 } });
          return (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "18px 16px",
                borderRadius: 16,
                background: "rgba(52,211,153,0.04)",
                border: "1px solid rgba(52,211,153,0.12)",
                textAlign: "center",
                opacity: prog,
                transform: `translateY(${(1 - prog) * 18}px)`,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 14, fontFamily: dmSans, fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
                {item.text}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
