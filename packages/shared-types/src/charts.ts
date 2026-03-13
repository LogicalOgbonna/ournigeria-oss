/**
 * Universal chart data point — all chart types use subsets of this.
 */
export type ChartPoint = {
  name?: string;
  label?: string;
  value?: number;
  x?: number | string;
  y?: number;
  z?: number;
  [key: string]: unknown;
};

/**
 * Chart configuration — controls rendering behavior.
 */
export type ChartConfig = {
  unit?: string;
  orientation?: "horizontal" | "vertical";
  stacked?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  formatValue?: "naira" | "percent" | "number" | "compact";
  xAxisLabel?: string;
  yAxisLabel?: string;
  innerRadius?: number;
  series?: {
    key: string;
    label: string;
    color?: string;
  }[];
};

/**
 * The chart block that the AI outputs and the frontend renders.
 */
export type ChartBlock = {
  type: ChartType;
  title: string;
  description?: string;
  data: ChartPoint[];
  config?: ChartConfig;
  meta?: Record<string, unknown>;
};

export type ChartType =
  // Tier 1
  | "bar"
  | "column"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "stacked-bar"
  | "stacked-area"
  // Tier 2
  | "scatter"
  | "bubble"
  | "radar"
  | "treemap"
  | "waterfall"
  | "funnel"
  | "histogram"
  | "heatmap"
  | "gauge"
  | "polar"
  // Tier 3
  | "candlestick"
  | "box"
  | "violin"
  | "sunburst"
  | "choropleth"
  | "gantt"
  | "density"
  | "correlation"
  | "hexbin"
  | "frequency";
