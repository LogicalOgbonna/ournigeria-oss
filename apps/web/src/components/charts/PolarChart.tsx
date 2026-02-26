"use client";

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { ChartBlock } from "@/types/charts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatChartValue, getChartColors } from "./chart-theme";

export default function PolarChart({ block }: { block: ChartBlock }) {
  const chart = useChartTheme();
  const fmt = block.config?.formatValue ?? "naira";
  const colors = getChartColors(block.data.length, block.config?.colors);

  const polarData = block.data.map((d, i) => ({
    name: d.name ?? d.label ?? `Item ${i + 1}`,
    value: Number(d.value) || 0,
    fill: colors[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadialBarChart
        innerRadius="20%"
        outerRadius="90%"
        data={polarData}
        startAngle={180}
        endAngle={-180}
      >
        <RadialBar
          dataKey="value"
          background={{ fill: "var(--muted)" }}
          cornerRadius={4}
        />
        <Tooltip
          contentStyle={chart.tooltipStyle}
          formatter={((value: number) => [
            formatChartValue(value, fmt),
            "",
          ]) as any}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px" }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
