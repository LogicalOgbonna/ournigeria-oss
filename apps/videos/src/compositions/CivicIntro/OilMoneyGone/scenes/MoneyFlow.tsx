import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const FLOWS = [
  { label: "Debt Repayment", amount: "₦8.25T", pct: 56, color: "#ef4444", icon: "💸" },
  { label: "Recurrent Expenditure", amount: "₦4.12T", pct: 28, color: "#f97316", icon: "🏛️" },
  { label: "Fuel Subsidy Remnant", amount: "₦1.20T", pct: 8, color: "#fbbf24", icon: "⛽" },
  { label: "Capital Projects", amount: "₦1.13T", pct: 8, color: "#34d399", icon: "🏗️" },
];

export const MoneyFlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 12], [0, 1]);
  const headerY = ci(frame, [0, 12], [20, 0]);

  return (
    <AbsoluteFill style={{ background: "#080c0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 80px", gap: 20 }}>
      <EmeraldOrbs opacity={0.25} />

      <div style={{ opacity: headerOpacity, transform: `translateY(${headerY}px)`, textAlign: "center", zIndex: 10 }}>
        <div style={{ fontSize: 36, fontFamily: instrumentSerif, color: "#fff", lineHeight: 1.2 }}>
          ₦14.7T Oil Revenue → Spent As:
        </div>
      </div>

      <div style={{ width: 520, display: "flex", flexDirection: "column", gap: 14, zIndex: 10 }}>
        {FLOWS.map((f, i) => {
          const prog = spring({ frame: Math.max(0, frame - 10 - i * 8), fps, config: { damping: 18, stiffness: 90 } });
          const barWidth = ci(frame, [15 + i * 8, 45 + i * 8], [0, f.pct]);

          return (
            <div key={i} style={{ opacity: prog, transform: `translateY(${(1 - prog) * 20}px)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{f.icon}</span>
                  <span style={{ fontSize: 15, fontFamily: dmSans, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{f.label}</span>
                </div>
                <span style={{ fontSize: 16, fontFamily: ibmPlexMono, fontWeight: 700, color: f.color }}>{f.amount} ({f.pct}%)</span>
              </div>
              <div style={{ height: 12, borderRadius: 100, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ width: `${barWidth}%`, height: "100%", borderRadius: 100, background: `linear-gradient(90deg, ${f.color}77, ${f.color})` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ zIndex: 10, opacity: ci(frame, [85, 100], [0, 1]), textAlign: "center" }}>
        <div style={{ padding: "12px 24px", borderRadius: 14, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <span style={{ fontSize: 17, fontFamily: dmSans, fontWeight: 600, color: "#fff", lineHeight: 1.5 }}>
            Only <span style={{ color: "#34d399" }}>8%</span> reaches actual infrastructure.{" "}
            <span style={{ color: "rgba(255,255,255,0.5)" }}>The rest? Gone before you see it.</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
