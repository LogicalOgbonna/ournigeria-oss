"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ChartBlock } from "@/types/charts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatChartValue, getChartColors } from "./chart-theme";

export default function BarChartV2({ block }: { block: ChartBlock }) {
  const chart = useChartTheme();
  const fmt = block.config?.formatValue ?? "naira";
  const isVertical =
    block.config?.orientation === "vertical" || block.type === "column";
  const colors = getChartColors(block.data.length, block.config?.colors);

  if (isVertical) {
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
            formatter={((value: number) => [formatChartValue(value, fmt), ""]) as any}
            contentStyle={chart.tooltipStyle}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
            {block.data.map((_, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer
      width="100%"
      height={block.data.length * 52 + 20}
    >
      <BarChart
        data={block.data}
        layout="vertical"
        margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
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
          formatter={((value: number) => [formatChartValue(value, fmt), ""]) as any}
          contentStyle={chart.tooltipStyle}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
          {block.data.map((_, i) => (
            <Cell key={i} fill={colors[i]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
