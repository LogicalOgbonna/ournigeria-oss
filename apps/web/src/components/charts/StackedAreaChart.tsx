"use client";

import type { ChartBlock } from "@/types/charts";
import AreaChartV2 from "./AreaChartV2";

export default function StackedAreaChart({ block }: { block: ChartBlock }) {
  return (
    <AreaChartV2
      block={{
        ...block,
        type: "stacked-area",
        config: { ...block.config, stacked: true },
      }}
    />
  );
}
