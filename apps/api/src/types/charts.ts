export type ChartPoint = {
  name?: string;
  label?: string;
  value?: number;
  x?: number | string;
  y?: number;
  z?: number;
  [key: string]: unknown;
};

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

export type ChartBlock = {
  type: string;
  title: string;
  description?: string;
  data: ChartPoint[];
  config?: ChartConfig;
  meta?: Record<string, unknown>;
};
