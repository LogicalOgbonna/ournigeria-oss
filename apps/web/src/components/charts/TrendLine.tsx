"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendDataPoint } from "@/types";
import { formatNaira } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { useChartTheme } from "@/hooks/useChartTheme";

interface TrendLineProps {
  title: string;
  data: TrendDataPoint[];
  lines: { key: string; color: string; label: string }[];
}

export function TrendLine({ title, data, lines }: TrendLineProps) {
  const chart = useChartTheme();

  return (
    <Card className="animate-scale-in overflow-hidden border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-0">
      <div className="border-b border-slate-100 dark:border-slate-700 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      </div>
      <div className="px-2 py-4">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chart.gridStroke} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: chart.tickFill }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => formatNaira(v)}
              tick={{ fontSize: 11, fill: chart.tickFill }}
              axisLine={false}
              tickLine={false}
              width={65}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                const line = lines.find((l) => l.key === name);
                return [formatNaira(Number(value)), line?.label || name];
              }}
              contentStyle={chart.tooltipStyle}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              formatter={(value: string) => {
                const line = lines.find((l) => l.key === value);
                return (
                  <span className="text-slate-600 dark:text-slate-300">{line?.label || value}</span>
                );
              }}
            />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: line.color, stroke: chart.dotBackground, strokeWidth: 2 }}
                activeDot={{
                  r: 6,
                  stroke: line.color,
                  strokeWidth: 2,
                  fill: chart.dotBackground,
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
