import { CompletenessBar } from "@/components/CivicUI";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono } from "@/lib/fonts";
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

const STATE_RANKINGS = [
  { name: "Lagos", pct: 78 },
  { name: "Kano", pct: 65 },
  { name: "Rivers", pct: 61 },
  { name: "Oyo", pct: 54 },
  { name: "Kaduna", pct: 49 },  
  { name: "Delta", pct: 42 },
  { name: "Enugu", pct: 38 },
  { name: "Anambra", pct: 35 },
  { name: "Edo", pct: 31 },
  { name: "FCT", pct: 28 },
];

export const RankingsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0, 15], [0, 1]);
  const titleY = ci(frame, [0, 15], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        padding: "60px 50px",
      }}
    >
      <EmeraldOrbs opacity={0.3} />

      {/* Header */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontFamily: dmSans,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          State Completeness Leaderboard
        </div>
        <div
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.4)",
            fontFamily: dmSans,
            marginTop: 6,
          }}
        >
          % of officials identified by citizens
        </div>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 0",
          opacity: ci(frame, [15, 25], [0, 1]),
          zIndex: 10,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            width: 28,
            textAlign: "right",
            fontSize: 11,
            fontFamily: ibmPlexMono,
            color: "rgba(255,255,255,0.25)",
            textTransform: "uppercase",
          }}
        >
          #
        </span>
        <span
          style={{
            width: 100,
            fontSize: 11,
            fontFamily: dmSans,
            color: "rgba(255,255,255,0.25)",
            textTransform: "uppercase",
          }}
        >
          State
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 11,
            fontFamily: dmSans,
            color: "rgba(255,255,255,0.25)",
            textTransform: "uppercase",
          }}
        >
          Completeness
        </span>
      </div>

      {/* Rankings */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 10,
          flex: 1,
        }}
      >
        {STATE_RANKINGS.map((state, i) => (
          <CompletenessBar
            key={state.name}
            stateName={state.name}
            percentage={state.pct}
            rank={i + 1}
            animationStart={25}
            highlight={i === 0}
          />
        ))}
      </div>

      {/* Bottom note */}
      <div
        style={{
          opacity: ci(frame, [180, 200], [0, 1]),
          zIndex: 10,
          textAlign: "center",
          marginTop: 16,
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: "#f59e0b",
            fontFamily: dmSans,
            fontWeight: 600,
          }}
        >
          No state has reached 100% yet. Can yours be the first?
        </div>
      </div>
    </AbsoluteFill>
  );
};
