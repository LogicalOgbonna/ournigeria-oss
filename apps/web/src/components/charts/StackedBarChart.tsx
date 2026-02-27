"use client";

import {
  BarChart,
  Bar,
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

export default function StackedBarChart({ block }: { block: ChartBlock }) {
  const chart = useChartTheme();
  const fmt = block.config?.formatValue ?? "naira";
  const series =
    block.config?.series && block.config.series.length > 0
      ? block.config.series
      : [{ key: "value", label: "Value" }];
  const colors = getChartColors(
    series.length,
    block.config?.colors ?? series.map((s) => s.color).filter(Boolean) as string[],
  );
  const isHorizontal = block.config?.orientation === "horizontal";

  if (isHorizontal) {
    return (
      <ResponsiveContainer
        width="100%"
        height={block.data.length * 52 + 40}
      >
        <BarChart
          data={block.data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke={chart.gridStroke}
          />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatChartValue(v, fmt)}
            tick={{ fontSize: 11, fill: chart.tickFill }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{
              fontSize: 12,
              fill: chart.tickFillStrong,
              fontWeight: 500,
            }}
            width={90}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={((value: number, name: string) => {
              const s = series.find((l) => l.key === name);
              return [formatChartValue(value, fmt), s?.label ?? name];
            }) as any}
            contentStyle={chart.tooltipStyle}
            itemStyle={chart.tooltipItemStyle}
            labelStyle={chart.tooltipLabelStyle}
          />
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
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="stack"
              fill={s.color ?? colors[i]}
              radius={
                i === series.length - 1 ? [0, 6, 6, 0] : undefined
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={block.data}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={chart.gridStroke}
        />
        <XAxis
          dataKey="name"
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
          }) as any}
          contentStyle={chart.tooltipStyle}
            itemStyle={chart.tooltipItemStyle}
            labelStyle={chart.tooltipLabelStyle}
        />
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
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="stack"
            fill={s.color ?? colors[i]}
            radius={
              i === series.length - 1 ? [6, 6, 0, 0] : undefined
            }
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
