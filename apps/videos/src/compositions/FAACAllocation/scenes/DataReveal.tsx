import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ci, formatNaira } from "@/lib/animation-utils";
import { instrumentSerif, dmSans } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { VerticalHBarChart } from "@/components/VerticalCharts";

export const DataReveal: React.FC<{
  stateName: string;
  monthlyData: { month: string; amount: number }[];
}> = ({ stateName, monthlyData }) => {
  const frame = useCurrentFrame();

  const titleOpacity = ci(frame, [0, 15], [0, 1]);
  const chartOpacity = ci(frame, [15, 30], [0, 1]);

  // Convert monthly data to chart format
  const chartData = monthlyData.map((d, i) => ({
    label: d.month,
    value: d.amount,
    color: i % 2 === 0 ? "#34d399" : "#059669",
  }));

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.3} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: "80px 50px",
          gap: 32,
          zIndex: 10,
        }}
      >
        {/* Title */}
        <div style={{ opacity: titleOpacity }}>
          <div
            style={{
              fontSize: 36,
              fontFamily: instrumentSerif,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            Monthly FAAC to {stateName}
          </div>
          <div
            style={{
              fontSize: 22,
              fontFamily: dmSans,
              color: "rgba(255,255,255,0.5)",
              marginTop: 8,
            }}
          >
            Month-by-month allocation breakdown
          </div>
        </div>

        {/* Chart */}
        <div
          style={{
            opacity: chartOpacity,
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <VerticalHBarChart
            data={chartData}
            animationStart={20}
            showValues={true}
            formatValue={(v) => formatNaira(v)}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
