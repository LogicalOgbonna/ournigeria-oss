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
  ReferenceLine,
} from "recharts";
import type { ChartBlock } from "@/types/charts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatChartValue } from "./chart-theme";

export default function WaterfallChart({ block }: { block: ChartBlock }) {
  const chart = useChartTheme();
  const fmt = block.config?.formatValue ?? "naira";

  // Build waterfall data: each bar has an invisible base + visible amount
  let running = 0;
  const waterfallData = block.data.map((d) => {
    const value = Number(d.value) || 0;
    const itemType = (d.type as string) ?? (value >= 0 ? "increase" : "decrease");
    const isTotal = itemType === "total";

    const base = isTotal ? 0 : Math.min(running, running + value);
    const visibleHeight = isTotal ? running : Math.abs(value);

    if (!isTotal) running += value;

    return {
      name: d.name ?? d.label ?? "",
      base,
      amount: visibleHeight,
      rawValue: isTotal ? running : value,
      type: itemType,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={waterfallData}
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
          contentStyle={chart.tooltipStyle}
          formatter={((value: number, name: string) => {
            if (name === "base") return [null, null];
            return [formatChartValue(value, fmt), ""];
          }) as any}
        />
        <ReferenceLine y={0} stroke={chart.gridStroke} />
        {/* Invisible base bar */}
        <Bar dataKey="base" stackId="waterfall" fill="transparent" />
        {/* Visible amount bar */}
        <Bar dataKey="amount" stackId="waterfall" radius={[4, 4, 0, 0]}>
          {waterfallData.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.type === "total"
                  ? "#6366f1"
                  : entry.type === "decrease"
                    ? "#ef4444"
                    : "#059669"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
