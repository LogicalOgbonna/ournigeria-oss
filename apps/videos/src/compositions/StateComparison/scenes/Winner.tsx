import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, formatNaira } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { BigStat } from "@/components/VerticalCharts";
import { PidginCaption } from "@/components/PidginCaption";

export const Winner: React.FC<{
  state1Name: string;
  state2Name: string;
  state1TotalBudget: number;
  state2TotalBudget: number;
  pidginCaption: string;
}> = ({ state1Name, state2Name, state1TotalBudget, state2TotalBudget, pidginCaption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0, 15], [0, 1]);
  const titleY = ci(frame, [0, 15], [40, 0]);

  const stat1Opacity = ci(frame, [20, 35], [0, 1]);
  const stat2Opacity = ci(frame, [35, 50], [0, 1]);

  const isState1Bigger = state1TotalBudget >= state2TotalBudget;

  const highlightScale = spring({
    frame: Math.max(0, frame - 60),
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.4} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 50px",
          gap: 48,
          zIndex: 10,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontFamily: dmSans,
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
            }}
          >
            Overall Budget Comparison
          </div>
        </div>

        {/* State 1 stat */}
        <div
          style={{
            opacity: stat1Opacity,
            transform: isState1Bigger
              ? `scale(${0.9 + highlightScale * 0.1})`
              : undefined,
            padding: "32px 40px",
            borderRadius: 24,
            background: isState1Bigger
              ? "rgba(52, 211, 153, 0.08)"
              : "rgba(255,255,255,0.03)",
            border: isState1Bigger
              ? "2px solid rgba(52, 211, 153, 0.3)"
              : "1px solid rgba(255,255,255,0.08)",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontFamily: instrumentSerif,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            {state1Name}
          </div>
          <BigStat
            value={state1TotalBudget}
            label="Total Budget"
            animationStart={25}
            color={isState1Bigger ? "#34d399" : "rgba(255,255,255,0.5)"}
          />
        </div>

        {/* State 2 stat */}
        <div
          style={{
            opacity: stat2Opacity,
            transform: !isState1Bigger
              ? `scale(${0.9 + highlightScale * 0.1})`
              : undefined,
            padding: "32px 40px",
            borderRadius: 24,
            background: !isState1Bigger
              ? "rgba(52, 211, 153, 0.08)"
              : "rgba(255,255,255,0.03)",
            border: !isState1Bigger
              ? "2px solid rgba(52, 211, 153, 0.3)"
              : "1px solid rgba(255,255,255,0.08)",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontFamily: instrumentSerif,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            {state2Name}
          </div>
          <BigStat
            value={state2TotalBudget}
            label="Total Budget"
            animationStart={40}
            color={!isState1Bigger ? "#34d399" : "rgba(255,255,255,0.5)"}
          />
        </div>
      </div>

      {/* Pidgin caption */}
      <PidginCaption text={pidginCaption} animationStart={120} />
    </AbsoluteFill>
  );
};
