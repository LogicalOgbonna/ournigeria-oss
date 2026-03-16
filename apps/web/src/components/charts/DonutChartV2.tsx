"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ChartBlock } from "@/types/charts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatChartValue, getChartColors } from "./chart-theme";

export default function DonutChartV2({ block }: { block: ChartBlock }) {
  const chart = useChartTheme();
  const fmt = block.config?.formatValue ?? "naira";
  const colors = getChartColors(block.data.length, block.config?.colors);
  const total = block.data.reduce(
    (sum, d) => sum + (Number(d.value) || 0),
    0,
  );
  const innerRadius = block.type === "pie" ? 0 : (block.config?.innerRadius ?? 0.6) * 80;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={block.data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {block.data.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Pie>
            <Tooltip
              formatter={((value: number) => [
                formatChartValue(value, fmt),
                "",
              ]) as any} // eslint-disable-line @typescript-eslint/no-explicit-any -- Recharts formatter type
              contentStyle={chart.tooltipStyle}
            itemStyle={chart.tooltipItemStyle}
            labelStyle={chart.tooltipLabelStyle}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {block.data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: colors[i] }}
            />
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {item.name}{" "}
              <span className="font-medium text-slate-800 dark:text-slate-100">
                ({total > 0 ? ((Number(item.value) / total) * 100).toFixed(0) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
