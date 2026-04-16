import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const OilMoneyHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const l1 = ci(frame, [0.3 * fps, 1 * fps], [0, 1]);
  const l1y = ci(frame, [0.3 * fps, 1 * fps], [40, 0]);
  const l2 = ci(frame, [1.2 * fps, 2 * fps], [0, 1]);
  const l2y = ci(frame, [1.2 * fps, 2 * fps], [25, 0]);
  const l3 = ci(frame, [2.2 * fps, 3 * fps], [0, 1]);
  const fadeOut = ci(frame, [4 * fps, 4.8 * fps], [1, 0]);

  return (
    <AbsoluteFill style={{ background: "#080c0a", display: "flex", alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      <EmeraldOrbs opacity={0.45} />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 80px" }}>
        <div style={{ opacity: l1, transform: `translateY(${l1y}px)` }}>
          <div style={{ fontSize: 26, fontFamily: dmSans, color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
            In 2023, Nigeria Earned:
          </div>
          <div style={{ fontSize: 72, fontFamily: ibmPlexMono, fontWeight: 700, color: "#fbbf24", textShadow: "0 0 40px rgba(251,191,36,0.4)", lineHeight: 1 }}>
            ₦14.7T
          </div>
          <div style={{ fontSize: 20, fontFamily: dmSans, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
            from oil & gas revenue
          </div>
        </div>

        <div style={{ opacity: l2, transform: `translateY(${l2y}px)`, marginTop: 32 }}>
          <div style={{ fontSize: 58, fontFamily: instrumentSerif, fontWeight: 400, color: "#fff", lineHeight: 1.15 }}>
            So Why Does
          </div>
          <div style={{ fontSize: 58, fontFamily: instrumentSerif, fontWeight: 400, lineHeight: 1.15, background: "linear-gradient(135deg, #ef4444, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Nothing Work?
          </div>
        </div>

        <div style={{ opacity: l3, marginTop: 20 }}>
          <div style={{ fontSize: 18, maxWidth: 420, margin: "0 auto", fontFamily: dmSans, color: "rgba(255,255,255,0.4)" }}>
            Here's where the money really goes.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
