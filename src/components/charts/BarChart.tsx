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

interface BarChartProps {
  title: string;
  data: ChartDataPoint[];
}

export function BudgetBarChart({ title, data }: BarChartProps) {
  return (
    <Card className="animate-scale-in overflow-hidden border-slate-200/80 bg-white p-0">
      <div className="border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
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
              stroke="#f1f5f9"
            />
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatNaira(v)}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
              width={90}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [formatNaira(Number(value)), "Budget"]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: "12px",
              }}
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
