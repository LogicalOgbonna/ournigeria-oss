"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartDataPoint } from "@/types";
import { formatNaira } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { useChartTheme } from "@/hooks/useChartTheme";

interface BarChartProps {
  title: string;
  data: ChartDataPoint[];
}

const MAX_LABEL = 14;

function truncate(str: string): string {
  if (str.length <= MAX_LABEL) return str;
  return str.slice(0, MAX_LABEL - 1) + "…";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LabelTick(props: any) {
  const { x, y, payload } = props;
  const full = String(payload?.value ?? "");
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill={props.fill}
        fontSize={11}
        fontWeight={500}
        style={{ cursor: "default" }}
      >
        {truncate(full)}
      </text>
    </g>
  );
}

export function BudgetBarChart({ title, data }: BarChartProps) {
  const chart = useChartTheme();

  return (
    <Card className="animate-scale-in overflow-hidden border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-0">
      <div className="border-b border-slate-100 dark:border-slate-700 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {title}
        </h3>
      </div>
      <div className="px-2 py-4">
        <ResponsiveContainer width="100%" height={data.length * 52 + 20}>
          <RechartsBarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke={chart.gridStroke}
            />
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatNaira(v)}
              tick={{ fontSize: 11, fill: chart.tickFill }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={LabelTick}
              width={100}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [formatNaira(Number(value)), "Budget"]}
              contentStyle={chart.tooltipStyle}
              itemStyle={chart.tooltipItemStyle}
              labelStyle={chart.tooltipLabelStyle}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color || "#059669"} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
