import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono } from "@/lib/fonts";

/* ─── Donut Chart ─── */
export const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title: string;
  size?: number;
  animationStart?: number;
}> = ({ data, title, size = 200, animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 10;
  const strokeWidth = 36;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);

  // Animate the total sweep
  const drawProgress = ci(
    frame,
    [animationStart, animationStart + Math.round(fps * 0.8)],
    [0, 1],
  );

  let cumulativeAngle = 0;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          fontFamily: dmSans,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {data.map((d, i) => {
            const fraction = d.value / total;
            const segmentLength = fraction * circumference * drawProgress;
            const offset = cumulativeAngle * circumference * drawProgress;
            cumulativeAngle += fraction;

            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius - strokeWidth / 2}
                fill="none"
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.map((d, i) => {
            const labelOpacity = ci(
              frame,
              [
                animationStart + Math.round(fps * 0.3) + i * 4,
                animationStart + Math.round(fps * 0.5) + i * 4,
              ],
              [0, 1],
            );
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: labelOpacity,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: d.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: ibmPlexMono,
                  }}
                >
                  {d.label} {d.value}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─── Horizontal Bar Chart ─── */
export const HBarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title: string;
  unit?: string;
  animationStart?: number;
}> = ({ data, title, unit = "₦", animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          fontFamily: dmSans,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.map((d, i) => {
          const barProgress = spring({
            frame: Math.max(0, frame - animationStart - i * 5),
            fps,
            config: { damping: 25, stiffness: 80 },
          });
          const barWidth = (d.value / maxVal) * 100 * barProgress;

          return (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 65,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: dmSans,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {d.label}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 24,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: "100%",
                    background: d.color,
                    borderRadius: 6,
                  }}
                />
              </div>
              <div
                style={{
                  width: 55,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: ibmPlexMono,
                  opacity: barProgress,
                }}
              >
                {unit}
                {d.value}B
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Line Chart ─── */
export const LineChart: React.FC<{
  data: { year: string; value: number }[];
  title: string;
  animationStart?: number;
}> = ({ data, title, animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drawProgress = ci(
    frame,
    [animationStart, animationStart + Math.round(fps * 1.2)],
    [0, 1],
  );

  const chartW = 380;
  const chartH = 180;
  const padL = 50;
  const padB = 30;
  const padT = 10;

  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value)) * 0.8;

  const points = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * (chartW - padL - 10),
    y:
      padT +
      (1 - (d.value - minVal) / (maxVal - minVal)) * (chartH - padT - padB),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Calculate total path length for dash animation
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }

  const visibleLength = totalLength * drawProgress;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          fontFamily: dmSans,
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <svg width={chartW} height={chartH}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padT + (1 - frac) * (chartH - padT - padB);
          return (
            <line
              key={frac}
              x1={padL}
              y1={y}
              x2={chartW - 10}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4,4"
            />
          );
        })}
        {/* Line path */}
        <path
          d={pathD}
          fill="none"
          stroke="#059669"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLength}
          strokeDashoffset={totalLength - visibleLength}
        />
        {/* Data points */}
        {points.map((p, i) => {
          const pointProgress = ci(
            frame,
            [
              animationStart + Math.round((i / data.length) * fps * 1.2),
              animationStart + Math.round((i / data.length) * fps * 1.2) + 6,
            ],
            [0, 1],
          );
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5 * pointProgress} fill="#059669" />
              <circle cx={p.x} cy={p.y} r={3 * pointProgress} fill="#34d399" />
              <text
                x={p.x}
                y={chartH - 6}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize={11}
                fontFamily={ibmPlexMono}
              >
                {data[i].year}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
