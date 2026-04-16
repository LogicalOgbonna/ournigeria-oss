import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { ci, countUp, formatNumber } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

interface StatCard {
  stat: number;
  label: string;
  unit: string;
  color: string;
}

const STATS: StatCard[] = [
  {
    stat: 12400,
    label: "Questions asked about budgets",
    unit: "this month",
    color: "#34d399",
  },
  {
    stat: 847,
    label: "Officials identified by citizens",
    unit: "this week",
    color: "#0891b2",
  },
  {
    stat: 2300,
    label: "Budget anomalies flagged",
    unit: "all time",
    color: "#fbbf24",
  },
  {
    stat: 94,
    label: "States with active trackers",
    unit: "of 36 + FCT",
    color: "#059669",
  },
];

export const WhatYouCanDoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [30, 0]);

  const subOpacity = ci(frame, [12, 28], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 100px",
      }}
    >
      <EmeraldOrbs opacity={0.4} />

      <div
        style={{
          width: "100%",
          maxWidth: 520,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 44,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            Knowledge Is Power
          </div>
          <div
            style={{
              opacity: subOpacity,
              fontSize: 18,
              fontFamily: dmSans,
              fontWeight: 400,
              color: "rgba(255,255,255,0.45)",
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            Now that you know, here&apos;s what citizens are doing:
          </div>
        </div>

        {/* 2x2 grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {STATS.map((s, i) => (
            <StatCell
              key={i}
              entry={s}
              index={i}
              frame={frame}
              fps={fps}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StatCell: React.FC<{
  entry: StatCard;
  index: number;
  frame: number;
  fps: number;
}> = ({ entry, index, frame, fps }) => {
  const delay = 30 + index * 14;
  const prog = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const animatedStat = countUp(frame, delay, delay + 40, entry.stat);

  return (
    <div
      style={{
        opacity: prog,
        transform: `scale(${0.85 + prog * 0.15})`,
        padding: "24px 28px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${entry.color}28`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Big stat number */}
      <div
        style={{
          fontSize: 52,
          fontFamily: ibmPlexMono,
          fontWeight: 700,
          color: entry.color,
          lineHeight: 1,
        }}
      >
        {formatNumber(animatedStat)}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 14,
          fontFamily: dmSans,
          fontWeight: 600,
          color: "rgba(255,255,255,0.8)",
          lineHeight: 1.4,
        }}
      >
        {entry.label}
      </div>

      {/* Unit */}
      <div
        style={{
          fontSize: 12,
          fontFamily: dmSans,
          fontWeight: 400,
          color: "rgba(255,255,255,0.35)",
        }}
      >
        {entry.unit}
      </div>
    </div>
  );
};
