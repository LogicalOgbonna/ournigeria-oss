"use client";

import { useRef, lazy, Suspense } from "react";
import type { ChartBlock } from "@/types/charts";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import { formatChartValue } from "./chart-theme";

const renderers: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<{ block: ChartBlock }>>
> = {
  bar: lazy(() => import("./BarChartV2")),
  column: lazy(() => import("./ColumnChart")),
  line: lazy(() => import("./LineChartV2")),
  area: lazy(() => import("./AreaChartV2")),
  pie: lazy(() => import("./PieChartV2")),
  donut: lazy(() => import("./DonutChartV2")),
  "stacked-bar": lazy(() => import("./StackedBarChart")),
  "stacked-area": lazy(() => import("./StackedAreaChart")),
  scatter: lazy(() => import("./ScatterChartV2")),
  bubble: lazy(() => import("./BubbleChart")),
  radar: lazy(() => import("./RadarChartV2")),
  treemap: lazy(() => import("./TreemapChart")),
  waterfall: lazy(() => import("./WaterfallChart")),
  funnel: lazy(() => import("./FunnelChartV2")),
  histogram: lazy(() => import("./HistogramChart")),
  heatmap: lazy(() => import("./HeatmapChart")),
  gauge: lazy(() => import("./GaugeChart")),
  polar: lazy(() => import("./PolarChart")),
};

function FallbackTable({ block }: { block: ChartBlock }) {
  const fmt = block.config?.formatValue ?? "number";
  if (!block.data.length) return null;

  const keys = Object.keys(block.data[0]).filter(
    (k) => !k.startsWith("_"),
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {keys.map((key) => (
              <th
                key={key}
                className="text-left p-2 border-b border-border font-medium text-muted-foreground capitalize"
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.data.map((row, i) => (
            <tr key={i}>
              {keys.map((key) => {
                const val = row[key];
                return (
                  <td
                    key={key}
                    className="p-2 border-b border-border text-foreground"
                  >
                    {typeof val === "number"
                      ? formatChartValue(val, fmt)
                      : String(val ?? "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartRenderer({ block }: { block: ChartBlock }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const Renderer = renderers[block.type];

  const downloadChart = async () => {
    if (!chartRef.current) return;
    const { toPng } = await import("html-to-image");
    const isDark = document.documentElement.classList.contains("dark");
    const dataUrl = await toPng(chartRef.current, {
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      pixelRatio: 2,
    });
    const link = document.createElement("a");
    link.download = `${block.title.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <Card className="animate-scale-in overflow-hidden border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-0">
      <div
        ref={chartRef}
        className="relative group bg-white dark:bg-slate-800"
      >
        <div className="border-b border-slate-100 dark:border-slate-700 px-5 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {block.title}
            </h3>
            {block.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {block.description}
              </p>
            )}
          </div>
          <button
            onClick={downloadChart}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Download chart"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
        <div className="px-2 py-4">
          <Suspense
            fallback={
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Loading chart...
              </div>
            }
          >
            {Renderer ? (
              <Renderer block={block} />
            ) : (
              <FallbackTable block={block} />
            )}
          </Suspense>
        </div>
      </div>
    </Card>
  );
}
