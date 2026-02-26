"use client";

import type { ChartBlock } from "@/types/charts";
import DonutChartV2 from "./DonutChartV2";

export default function PieChartV2({ block }: { block: ChartBlock }) {
  return <DonutChartV2 block={{ ...block, type: "pie" }} />;
}
