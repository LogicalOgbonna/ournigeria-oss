import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, countUp, formatNaira, formatNumber } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono } from "@/lib/fonts";

/**
 * Vertical-optimized chart components for 9:16 (1080x1920) social media videos.
 * Larger text, full-width bars, stacked layouts for phone readability.
 */

/* ─── Vertical Horizontal Bar Chart ─── */
export const VerticalHBarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title?: string;
  unit?: string;
  showValues?: boolean;
  animationStart?: number;
  formatValue?: (v: number) => string;
}> = ({
  data,
  title,
  unit = "",
  showValues = true,
  animationStart = 0,
  formatValue,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "24px 28px",
        width: "100%",
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.6)",
            fontFamily: dmSans,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          {title}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {data.map((d, i) => {
          const barProgress = spring({
            frame: Math.max(0, frame - animationStart - i * 6),
            fps,
            config: { damping: 25, stiffness: 80 },
          });
          const barWidth = (d.value / maxVal) * 100 * barProgress;
          const displayValue = formatValue
            ? formatValue(Math.round(d.value * barProgress))
            : `${unit}${formatNumber(Math.round(d.value * barProgress))}`;

          return (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: dmSans,
                    fontWeight: 500,
                  }}
                >
                  {d.label}
                </span>
                {showValues && (
                  <span
                    style={{
                      fontSize: 20,
                      color: "rgba(255,255,255,0.6)",
                      fontFamily: ibmPlexMono,
                      opacity: barProgress,
                    }}
                  >
                    {displayValue}
                  </span>
                )}
              </div>
              <div
                style={{
                  width: "100%",
                  height: 36,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${d.color}, ${d.color}cc)`,
                    borderRadius: 10,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Vertical Donut Chart ─── */
export const VerticalDonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title?: string;
  centerLabel?: string;
  centerValue?: string;
  animationStart?: number;
}> = ({ data, title, centerLabel, centerValue, animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const size = 320;
  const radius = size / 2 - 16;
  const strokeWidth = 48;
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2);

  const drawProgress = ci(
    frame,
    [animationStart, animationStart + Math.round(fps * 1)],
    [0, 1],
  );

  let cumulativeAngle = 0;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "24px 28px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.6)",
            fontFamily: dmSans,
            fontWeight: 600,
            marginBottom: 20,
            alignSelf: "flex-start",
          }}
        >
          {title}
        </div>
      )}

      {/* Donut */}
      <div style={{ position: "relative", width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)" }}
        >
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
        {/* Center text */}
        {centerValue && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: drawProgress,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#fff",
                fontFamily: ibmPlexMono,
              }}
            >
              {centerValue}
            </div>
            {centerLabel && (
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: dmSans,
                }}
              >
                {centerLabel}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 20,
          justifyContent: "center",
        }}
      >
        {data.map((d, i) => {
          const labelOpacity = ci(
            frame,
            [
              animationStart + Math.round(fps * 0.5) + i * 4,
              animationStart + Math.round(fps * 0.7) + i * 4,
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
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background: d.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: dmSans,
                }}
              >
                {d.label} {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Big Stat Number ─── */
export const BigStat: React.FC<{
  value: number;
  label: string;
  prefix?: string;
  animationStart?: number;
  color?: string;
  formatFn?: (n: number) => string;
}> = ({
  value,
  label,
  prefix = "₦",
  animationStart = 0,
  color = "#34d399",
  formatFn,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const prog = spring({
    frame: Math.max(0, frame - animationStart),
    fps,
    config: { damping: 25, stiffness: 60 },
  });

  const currentValue = countUp(
    frame,
    animationStart,
    animationStart + Math.round(fps * 1.2),
    value,
  );

  const displayValue = formatFn
    ? formatFn(currentValue)
    : formatNaira(currentValue);

  return (
    <div
      style={{
        textAlign: "center",
        opacity: prog,
        transform: `scale(${0.8 + prog * 0.2})`,
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          fontFamily: ibmPlexMono,
          color,
          lineHeight: 1.1,
          textShadow: `0 0 40px ${color}40`,
        }}
      >
        {displayValue}
      </div>
      <div
        style={{
          fontSize: 24,
          color: "rgba(255,255,255,0.6)",
          fontFamily: dmSans,
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
};
