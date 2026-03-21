import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { BigStat } from "@/components/VerticalCharts";

export const Hook: React.FC<{
  stateName: string;
  fiscalYear: number;
  amount: number;
  context: string;
}> = ({ stateName, fiscalYear, amount, context }) => {
  const frame = useCurrentFrame();

  const contextOpacity = ci(frame, [0, 15], [0, 1]);
  const contextY = ci(frame, [0, 15], [30, 0]);

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.6} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 60px",
          gap: 40,
          zIndex: 10,
        }}
      >
        {/* Amount */}
        <BigStat
          value={amount}
          label={`${stateName} ${fiscalYear} ${context}`}
          animationStart={10}
        />

        {/* Context label */}
        <div
          style={{
            opacity: contextOpacity,
            transform: `translateY(${contextY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontFamily: dmSans,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 500,
            }}
          >
            What could this money buy?
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
