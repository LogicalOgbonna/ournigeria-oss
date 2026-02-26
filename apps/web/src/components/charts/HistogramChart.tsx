"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartBlock } from "@/types/charts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatChartValue, CHART_PALETTE } from "./chart-theme";

export default function HistogramChart({ block }: { block: ChartBlock }) {
  const chart = useChartTheme();
  const fmt = block.config?.formatValue ?? "number";

  const histData = block.data.map((d) => ({
    bin: d.name ?? d.label ?? d.bin,
    count: Number(d.value ?? d.count) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={histData}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={chart.gridStroke}
        />
        <XAxis
          dataKey="bin"
          tick={{ fontSize: 11, fill: chart.tickFill }}
          axisLine={false}
          tickLine={false}
          label={
            block.config?.xAxisLabel
              ? {
                  value: block.config.xAxisLabel,
                  position: "insideBottom",
                  offset: -5,
                  fontSize: 11,
                  fill: chart.tickFill,
                }
              : undefined
          }
        />
        <YAxis
          tickFormatter={(v: number) => formatChartValue(v, fmt)}
          tick={{ fontSize: 11, fill: chart.tickFill }}
          axisLine={false}
          tickLine={false}
          width={50}
          label={
            block.config?.yAxisLabel
              ? {
                  value: block.config.yAxisLabel,
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                  fill: chart.tickFill,
                }
              : undefined
          }
        />
        <Tooltip
          contentStyle={chart.tooltipStyle}
          formatter={((value: number) => [
            formatChartValue(value, fmt),
            "Count",
          ]) as any}
        />
        <Bar
          dataKey="count"
          fill={CHART_PALETTE[0]}
          radius={[4, 4, 0, 0]}
          barSize={undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
