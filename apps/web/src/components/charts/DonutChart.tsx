"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartDataPoint } from "@/types";
import { formatNaira } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { useChartTheme } from "@/hooks/useChartTheme";

interface DonutChartProps {
  title: string;
  data: ChartDataPoint[];
}

export function DonutChart({ title, data }: DonutChartProps) {
  const chart = useChartTheme();
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="animate-scale-in overflow-hidden border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-0">
      <div className="border-b border-slate-100 dark:border-slate-700 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      </div>
      <div className="flex flex-col items-center gap-4 p-5 sm:flex-row">
        <div className="h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color || "#059669"} />
                ))}
              </Pie>
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [formatNaira(Number(value)), ""]}
                contentStyle={chart.tooltipStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {item.name}{" "}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  ({((item.value / total) * 100).toFixed(0)}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
