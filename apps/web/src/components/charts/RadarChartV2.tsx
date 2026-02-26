"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { ChartBlock } from "@/types/charts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatChartValue, getChartColors } from "./chart-theme";

export default function RadarChartV2({ block }: { block: ChartBlock }) {
  const chart = useChartTheme();
  const fmt = block.config?.formatValue ?? "number";
  const series = block.config?.series ?? [
    { key: "value", label: "Value" },
  ];
  const colors = getChartColors(
    series.length,
    block.config?.colors ?? series.map((s) => s.color).filter(Boolean) as string[],
  );
  const angleKey =
    block.data[0] && "axis" in block.data[0] ? "axis" : "name";

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={block.data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke={chart.gridStroke} />
        <PolarAngleAxis
          dataKey={angleKey}
          tick={{ fontSize: 11, fill: chart.tickFill }}
        />
        <PolarRadiusAxis
          tick={{ fontSize: 10, fill: chart.tickFill }}
          axisLine={false}
        />
        <Tooltip
          contentStyle={chart.tooltipStyle}
          formatter={((value: number, name: string) => {
            const s = series.find((l) => l.key === name);
            return [formatChartValue(value, fmt), s?.label ?? name];
          }) as any}
        />
        {series.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value: string) => {
              const s = series.find((l) => l.key === value);
              return (
                <span className="text-slate-600 dark:text-slate-300">
                  {s?.label ?? value}
                </span>
              );
            }}
          />
        )}
        {series.map((s, i) => (
          <Radar
            key={s.key}
            name={s.key}
            dataKey={s.key}
            stroke={s.color ?? colors[i]}
            fill={s.color ?? colors[i]}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}
