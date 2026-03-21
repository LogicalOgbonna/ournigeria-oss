import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { VerticalHBarChart } from "@/components/VerticalCharts";

export const SideBySide: React.FC<{
  state1Name: string;
  state2Name: string;
  fiscalYear: number;
  state1Sectors: { label: string; value: number; color: string }[];
  state2Sectors: { label: string; value: number; color: string }[];
}> = ({ state1Name, state2Name, fiscalYear, state1Sectors, state2Sectors }) => {
  const frame = useCurrentFrame();

  const titleOpacity = ci(frame, [0, 15], [0, 1]);
  const leftOpacity = ci(frame, [15, 30], [0, 1]);
  const rightOpacity = ci(frame, [30, 45], [0, 1]);

  const top5State1 = state1Sectors.slice(0, 5);
  const top5State2 = state2Sectors.slice(0, 5);

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.3} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: "60px 40px",
          gap: 24,
          zIndex: 10,
        }}
      >
        {/* Title */}
        <div style={{ opacity: titleOpacity, textAlign: "center" }}>
          <div
            style={{
              fontSize: 32,
              fontFamily: instrumentSerif,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            Sector-by-Sector Breakdown
          </div>
          <div
            style={{
              fontSize: 18,
              fontFamily: dmSans,
              color: "rgba(255,255,255,0.5)",
              marginTop: 8,
            }}
          >
            Top 5 sectors — {fiscalYear}
          </div>
        </div>

        {/* Side by side charts */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            justifyContent: "center",
          }}
        >
          {/* State 1 chart */}
          <div style={{ opacity: leftOpacity }}>
            <div
              style={{
                fontSize: 22,
                fontFamily: dmSans,
                color: "#34d399",
                fontWeight: 600,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {state1Name}
            </div>
            <VerticalHBarChart
              data={top5State1}
              animationStart={20}
              showValues={true}
              formatValue={(v) => `${v}%`}
            />
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(52,211,153,0.3), transparent)",
            }}
          />

          {/* State 2 chart */}
          <div style={{ opacity: rightOpacity }}>
            <div
              style={{
                fontSize: 22,
                fontFamily: dmSans,
                color: "#34d399",
                fontWeight: 600,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {state2Name}
            </div>
            <VerticalHBarChart
              data={top5State2}
              animationStart={35}
              showValues={true}
              formatValue={(v) => `${v}%`}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
