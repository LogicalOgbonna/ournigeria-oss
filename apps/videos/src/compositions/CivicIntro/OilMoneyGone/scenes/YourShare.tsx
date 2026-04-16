import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, countUp, formatNumber } from "@/lib/animation-utils";
import { dmSans, instrumentSerif, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const YourShareScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const earned = countUp(frame, 10, 50, 74_000); // ₦74k per capita oil revenue
  const received = countUp(frame, 35, 75, 5_920); // ₦5,920 per capita capital spend

  const earnedProg = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 20, stiffness: 80 } });
  const receivedProg = spring({ frame: Math.max(0, frame - 35), fps, config: { damping: 20, stiffness: 80 } });

  const wastedPct = Math.round((1 - 5920 / 74000) * 100);

  return (
    <AbsoluteFill style={{ background: "#080c0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px 80px", gap: 32 }}>
      <EmeraldOrbs opacity={0.35} />

      <div style={{ opacity: ci(frame, [0, 12], [0, 1]), transform: `translateY(${ci(frame, [0, 12], [25, 0])}px)`, textAlign: "center", zIndex: 10 }}>
        <div style={{ fontSize: 38, fontFamily: instrumentSerif, color: "#fff" }}>Per Capita Oil Money: You vs Reality</div>
      </div>

      <div style={{ display: "flex", gap: 24, zIndex: 10, width: "100%", maxWidth: 700 }}>
        {/* Oil earned per capita */}
        <div style={{ flex: 1, padding: "24px 20px", borderRadius: 20, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", textAlign: "center", opacity: earnedProg, transform: `scale(${0.85 + earnedProg * 0.15})` }}>
          <div style={{ fontSize: 13, fontFamily: dmSans, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Earned Per Nigerian</div>
          <div style={{ fontSize: 44, fontFamily: ibmPlexMono, fontWeight: 700, color: "#fbbf24", lineHeight: 1 }}>₦{formatNumber(earned)}</div>
          <div style={{ fontSize: 13, fontFamily: dmSans, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>from oil & gas 2023</div>
        </div>

        {/* Capital spend per capita */}
        <div style={{ flex: 1, padding: "24px 20px", borderRadius: 20, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", textAlign: "center", opacity: receivedProg, transform: `scale(${0.85 + receivedProg * 0.15})` }}>
          <div style={{ fontSize: 13, fontFamily: dmSans, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Capital Spent Per You</div>
          <div style={{ fontSize: 44, fontFamily: ibmPlexMono, fontWeight: 700, color: "#ef4444", lineHeight: 1 }}>₦{formatNumber(received)}</div>
          <div style={{ fontSize: 13, fontFamily: dmSans, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>actually reached you</div>
        </div>
      </div>

      {/* Gap callout */}
      <div style={{ zIndex: 10, opacity: ci(frame, [75, 90], [0, 1]), textAlign: "center" }}>
        <div style={{ fontSize: 22, fontFamily: instrumentSerif, color: "#fff" }}>
          <span style={{ color: "#ef4444" }}>{wastedPct}%</span> of your oil money{" "}
          <span style={{ color: "rgba(255,255,255,0.5)" }}>never reaches you.</span>
        </div>
        <div style={{ fontSize: 16, fontFamily: dmSans, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
          Track every naira on OurNigeria.
        </div>
      </div>
    </AbsoluteFill>
  );
};
