"use client";

import type { ChartBlock } from "@/types/charts";
import { formatChartValue } from "./chart-theme";

export default function HeatmapChart({ block }: { block: ChartBlock }) {
  const fmt = block.config?.formatValue ?? "number";

  // Build grid from data: { row, col, value }
  const rows = [...new Set(block.data.map((d) => String(d.row ?? d.name ?? "")))];
  const cols = [...new Set(block.data.map((d) => String(d.col ?? d.label ?? "")))];

  const valueMap = new Map<string, number>();
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (const d of block.data) {
    const key = `${d.row ?? d.name}:${d.col ?? d.label}`;
    const val = Number(d.value) || 0;
    valueMap.set(key, val);
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
  }

  const range = maxVal - minVal || 1;

  function getCellColor(value: number): string {
    const t = (value - minVal) / range;
    // Green scale: light → dark
    const lightness = 90 - t * 50;
    return `oklch(${lightness / 100} 0.15 160)`;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left font-medium text-slate-600 dark:text-slate-400" />
            {cols.map((col) => (
              <th
                key={col}
                className="p-2 text-center font-medium text-slate-600 dark:text-slate-400"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td className="p-2 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {row}
              </td>
              {cols.map((col) => {
                const key = `${row}:${col}`;
                const val = valueMap.get(key) ?? 0;
                return (
                  <td
                    key={col}
                    className="p-2 text-center rounded"
                    style={{
                      backgroundColor: getCellColor(val),
                      color: (val - minVal) / range > 0.5 ? "#fff" : "#1e293b",
                    }}
                    title={`${row} × ${col}: ${formatChartValue(val, fmt)}`}
                  >
                    {formatChartValue(val, fmt)}
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
