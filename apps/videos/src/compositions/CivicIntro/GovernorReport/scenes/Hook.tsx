import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const GovernorReportHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const q1Opacity = ci(frame, [0.3 * fps, 1 * fps], [0, 1]);
  const q1Y = ci(frame, [0.3 * fps, 1 * fps], [40, 0]);
  const q2Opacity = ci(frame, [1.2 * fps, 2 * fps], [0, 1]);
  const q2Y = ci(frame, [1.2 * fps, 2 * fps], [25, 0]);
  const q3Opacity = ci(frame, [2 * fps, 2.8 * fps], [0, 1]);
  const q3Y = ci(frame, [2 * fps, 2.8 * fps], [20, 0]);
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
      <EmeraldOrbs opacity={0.5} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          padding: "0 100px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ opacity: q1Opacity, transform: `translateY(${q1Y}px)` }}>
          <div style={{ fontSize: 26, fontFamily: dmSans, color: "rgba(255,255,255,0.4)", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>
            Your Governor Made 5 Promises in 2023.
          </div>
          <div style={{ fontSize: 64, fontFamily: instrumentSerif, fontWeight: 400, color: "#fff", lineHeight: 1.1 }}>
            How Many Did
          </div>
        </div>

        <div style={{ opacity: q2Opacity, transform: `translateY(${q2Y}px)` }}>
          <div
            style={{
              fontSize: 64,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.1,
              background: "linear-gradient(135deg, #34d399, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            They Keep?
          </div>
        </div>

        <div style={{ opacity: q3Opacity, transform: `translateY(${q3Y}px)`, marginTop: 8 }}>
          <div style={{ fontSize: 24, maxWidth: 420, margin: "0 auto", fontFamily: dmSans, fontWeight: 500, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
            We scored every governor in Nigeria.{"\n"}
            The results will shock you.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
