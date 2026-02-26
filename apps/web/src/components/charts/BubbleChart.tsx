"use client";

import type { ChartBlock } from "@/types/charts";
import ScatterChartV2 from "./ScatterChartV2";

export default function BubbleChart({ block }: { block: ChartBlock }) {
  return <ScatterChartV2 block={{ ...block, type: "bubble" }} />;
}
