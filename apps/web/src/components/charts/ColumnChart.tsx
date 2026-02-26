"use client";

import type { ChartBlock } from "@/types/charts";
import BarChartV2 from "./BarChartV2";

export default function ColumnChart({ block }: { block: ChartBlock }) {
  return (
    <BarChartV2
      block={{
        ...block,
        config: { ...block.config, orientation: "vertical" },
      }}
    />
  );
}
