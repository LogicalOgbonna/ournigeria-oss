import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SECTOR_COLORS, CHART_COLORS } from "@/lib/constants";

const SECTORS = [
  { name: "Education", value: 0.28 },
  { name: "Health", value: 0.18 },
  { name: "Infrastructure", value: 0.22 },
  { name: "Agriculture", value: 0.12 },
  { name: "Transportation", value: 0.1 },
  { name: "Other", value: 0.1 },
];

export const BudgetOverview = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [0, 0.5 * fps], [30, 0], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(
    frame,
    [0.3 * fps, 0.8 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const chipsOpacity = interpolate(frame, [0.6 * fps, 1.1 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const maxBarHeight = 320;

  return (
    <AbsoluteFill className="bg-background flex flex-col items-center justify-center p-16">
      {/* Title */}
      <div
        style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }}
        className="text-center mb-4"
      >
        <h1
          className="text-7xl font-bold tracking-tight"
          style={{ color: "var(--primary)" }}
        >
          Nigerian State Budgets
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ opacity: subtitleOpacity }} className="text-center mb-12">
        <p className="text-3xl text-muted-foreground">
          Sector Allocation Overview
        </p>
      </div>

      {/* Sector color chips */}
      <div
        style={{ opacity: chipsOpacity }}
        className="flex flex-wrap gap-4 justify-center mb-16"
      >
        {Object.entries(SECTOR_COLORS)
          .slice(0, 8)
          .map(([name, color]) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded-full px-4 py-2 bg-card border border-border"
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-lg text-foreground capitalize">
                {name}
              </span>
            </div>
          ))}
      </div>

      {/* Animated bar chart */}
      <div className="flex items-end gap-6 h-[400px]">
        {SECTORS.map((sector, i) => {
          const barHeight = spring({
            frame,
            fps,
            delay: 1 * fps + i * 5,
            config: { damping: 200 },
          });

          const labelOpacity = interpolate(
            frame,
            [1.2 * fps + i * 5, 1.6 * fps + i * 5],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          return (
            <div key={sector.name} className="flex flex-col items-center gap-3">
              {/* Value label */}
              <span
                className="text-xl font-semibold text-foreground"
                style={{ opacity: labelOpacity }}
              >
                {Math.round(sector.value * 100)}%
              </span>

              {/* Bar */}
              <div
                className="w-24 rounded-t-lg"
                style={{
                  height: barHeight * sector.value * maxBarHeight,
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />

              {/* Sector name */}
              <span
                className="text-lg text-muted-foreground"
                style={{ opacity: labelOpacity }}
              >
                {sector.name}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
