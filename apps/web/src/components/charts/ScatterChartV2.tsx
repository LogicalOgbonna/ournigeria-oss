"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import type { ChartBlock } from "@/types/charts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatChartValue, CHART_PALETTE } from "./chart-theme";

export default function ScatterChartV2({ block }: { block: ChartBlock }) {
  const chart = useChartTheme();
  const fmt = block.config?.formatValue ?? "number";
  const isBubble = block.type === "bubble";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chart.gridStroke} />
        <XAxis
          dataKey="x"
          type="number"
          name={block.config?.xAxisLabel ?? "X"}
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
          dataKey="y"
          type="number"
          name={block.config?.yAxisLabel ?? "Y"}
          tickFormatter={(v: number) => formatChartValue(v, fmt)}
          tick={{ fontSize: 11, fill: chart.tickFill }}
          axisLine={false}
          tickLine={false}
          width={65}
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
        {isBubble && (
          <ZAxis dataKey="z" range={[40, 400]} name="Size" />
        )}
        <Tooltip
          contentStyle={chart.tooltipStyle}
            itemStyle={chart.tooltipItemStyle}
            labelStyle={chart.tooltipLabelStyle}
          formatter={((value: number) => formatChartValue(value, fmt)) as any} // eslint-disable-line @typescript-eslint/no-explicit-any -- Recharts formatter type
          labelFormatter={((label: string) => {
            const point = block.data.find(
              (d) => String(d.x) === String(label),
            );
            return point?.name ?? point?.label ?? label;
          }) as any} // eslint-disable-line @typescript-eslint/no-explicit-any -- Recharts formatter type
        />
        <Scatter
          data={block.data}
          fill={CHART_PALETTE[0]}
          fillOpacity={0.7}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
