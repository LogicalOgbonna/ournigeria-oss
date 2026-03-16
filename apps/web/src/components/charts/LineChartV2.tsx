"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ChartBlock } from "@/types/charts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatChartValue, getChartColors } from "./chart-theme";

export default function LineChartV2({ block }: { block: ChartBlock }) {
  const chart = useChartTheme();
  const fmt = block.config?.formatValue ?? "naira";
  const series = block.config?.series ?? [
    { key: "value", label: "Value" },
  ];
  const xKey =
    block.data[0] && "x" in block.data[0] ? "x" : "name";
  const colors = getChartColors(
    series.length,
    block.config?.colors ?? series.map((s) => s.color).filter(Boolean) as string[],
  );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={block.data}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={chart.gridStroke} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: chart.tickFill }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatChartValue(v, fmt)}
          tick={{ fontSize: 11, fill: chart.tickFill }}
          axisLine={false}
          tickLine={false}
          width={65}
        />
        <Tooltip
          formatter={((value: number, name: string) => {
            const s = series.find((l) => l.key === name);
            return [formatChartValue(value, fmt), s?.label ?? name];
          }) as any} // eslint-disable-line @typescript-eslint/no-explicit-any -- Recharts formatter type
          contentStyle={chart.tooltipStyle}
            itemStyle={chart.tooltipItemStyle}
            labelStyle={chart.tooltipLabelStyle}
        />
        {series.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
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
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color ?? colors[i]}
            strokeWidth={2.5}
            dot={{
              r: 4,
              fill: s.color ?? colors[i],
              stroke: chart.dotBackground,
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              stroke: s.color ?? colors[i],
              strokeWidth: 2,
              fill: chart.dotBackground,
            }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
