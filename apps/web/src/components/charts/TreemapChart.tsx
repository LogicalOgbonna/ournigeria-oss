"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import type { ChartBlock } from "@/types/charts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatChartValue, getChartColors } from "./chart-theme";

export default function TreemapChart({ block }: { block: ChartBlock }) {
  const chart = useChartTheme();
  const fmt = block.config?.formatValue ?? "naira";
  const colors = getChartColors(block.data.length, block.config?.colors);

  const treemapData = block.data.map((d, i) => ({
    name: d.name ?? d.label ?? `Item ${i + 1}`,
    size: Number(d.value) || 0,
    fill: colors[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <Treemap
        data={treemapData}
        dataKey="size"
        aspectRatio={4 / 3}
        stroke="var(--card)"
        content={(({ x, y, width, height, name, fill }: {
          x: number;
          y: number;
          width: number;
          height: number;
          name: string;
          fill: string;
        }) => {
          if (width < 30 || height < 20) return null;
          return (
            <g>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fill}
                rx={4}
                opacity={0.85}
              />
              {width > 50 && height > 30 && (
                <text
                  x={x + width / 2}
                  y={y + height / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={Math.min(12, width / 8)}
                  fontWeight={500}
                >
                  {name}
                </text>
              )}
            </g>
          );
        }) as any}
      >
        <Tooltip
          contentStyle={chart.tooltipStyle}
          formatter={((value: number) => [
            formatChartValue(value, fmt),
            "",
          ]) as any}
        />
      </Treemap>
    </ResponsiveContainer>
  );
}
