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

  const histData = block.data.map((d) => {
    // Try common numeric fields, then fall back to first numeric value found
    let count = d.value ?? d.count ?? d.frequency ?? d.y ?? d.amount ?? d.total;
    if (count == null || isNaN(Number(count))) {
      // Search for any numeric field (skip name/label/bin)
      const skip = new Set(["name", "label", "bin", "category", "x"]);
      for (const [k, v] of Object.entries(d)) {
        if (!skip.has(k) && typeof v === "number" && !isNaN(v)) {
          count = v;
          break;
        }
      }
    }
    return {
      bin: String(d.name ?? d.label ?? d.bin ?? ""),
      count: Number(count) || 0,
    };
  });

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
          itemStyle={chart.tooltipItemStyle}
          labelStyle={chart.tooltipLabelStyle}
          formatter={
            ((value: number) => [formatChartValue(value, fmt), "Count"]) as any // eslint-disable-line @typescript-eslint/no-explicit-any -- Recharts formatter type
          }
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
