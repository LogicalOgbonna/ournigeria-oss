"use client";

import type { ChartBlock } from "@/types/charts";
import { formatChartValue } from "./chart-theme";

export default function GaugeChart({ block }: { block: ChartBlock }) {
  const fmt = block.config?.formatValue ?? "percent";
  const d = block.data[0];
  if (!d) return null;

  const value = Number(d.value) || 0;
  const min = Number(d.min ?? block.meta?.min ?? 0);
  const max = Number(d.max ?? block.meta?.max ?? 100);
  const range = max - min || 1;
  const pct = Math.min(1, Math.max(0, (value - min) / range));

  // Arc from -135° to 135° (270° sweep)
  const startAngle = -135;
  const sweepAngle = 270;
  const endAngle = startAngle + sweepAngle * pct;

  const cx = 120;
  const cy = 120;
  const r = 90;

  function polarToCartesian(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function arcPath(startDeg: number, endDeg: number) {
    const start = polarToCartesian(startDeg);
    const end = polarToCartesian(endDeg);
    const sweep = endDeg - startDeg;
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  // Color based on value: red < 33%, yellow < 66%, green >= 66%
  const color =
    pct < 0.33 ? "#ef4444" : pct < 0.66 ? "#f59e0b" : "#059669";

  return (
    <div className="flex flex-col items-center">
      <svg width={240} height={160} viewBox="0 0 240 160">
        {/* Background arc */}
        <path
          d={arcPath(startAngle, startAngle + sweepAngle)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={16}
          strokeLinecap="round"
        />
        {/* Value arc */}
        {pct > 0 && (
          <path
            d={arcPath(startAngle, endAngle)}
            fill="none"
            stroke={color}
            strokeWidth={16}
            strokeLinecap="round"
          />
        )}
        {/* Center value */}
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground"
          fontSize={28}
          fontWeight={700}
        >
          {formatChartValue(value, fmt)}
        </text>
        {/* Label */}
        {d.name && (
          <text
            x={cx}
            y={cy + 36}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={12}
          >
            {d.name}
          </text>
        )}
      </svg>
    </div>
  );
}
