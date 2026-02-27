"use client";

import {
  FunnelChart,
  Funnel,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { ChartBlock } from "@/types/charts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatChartValue, getChartColors } from "./chart-theme";

export default function FunnelChartV2({ block }: { block: ChartBlock }) {
  const chart = useChartTheme();
  const fmt = block.config?.formatValue ?? "naira";
  const colors = getChartColors(block.data.length, block.config?.colors);

  const funnelData = block.data.map((d, i) => ({
    name: d.name ?? d.label ?? `Stage ${i + 1}`,
    value: Number(d.value) || 0,
    fill: colors[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={block.data.length * 60 + 20}>
      <FunnelChart>
        <Tooltip
          contentStyle={chart.tooltipStyle}
            itemStyle={chart.tooltipItemStyle}
            labelStyle={chart.tooltipLabelStyle}
          formatter={((value: number) => [
            formatChartValue(value, fmt),
            "",
          ]) as any}
        />
        <Funnel dataKey="value" data={funnelData} isAnimationActive={false}>
          {funnelData.map((_, i) => (
            <Cell key={i} fill={colors[i]} />
          ))}
          <LabelList
            dataKey="name"
            position="right"
            fill={chart.tickFillStrong}
            fontSize={12}
          />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
