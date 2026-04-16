import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

interface FactEntry {
  num: string;
  fact: string;
  icon: string;
}

const FACTS: FactEntry[] = [
  {
    num: "01",
    fact: "57% of Nigeria's 2024 budget went to debt repayment — more than education, health, and infrastructure combined.",
    icon: "💸",
  },
  {
    num: "02",
    fact: "Nigeria has never fully executed a capital budget. Average execution rate 2010–2023: 48%.",
    icon: "🏗️",
  },
  {
    num: "03",
    fact: "The National Assembly's own budget is classified. Citizens cannot see how ₦228B is spent.",
    icon: "🙈",
  },
  {
    num: "04",
    fact: "Only 9 of 36 states publish audited accounts online within 12 months of year end.",
    icon: "📋",
  },
  {
    num: "05",
    fact: "Nigeria ranked 150 of 180 on Transparency International's 2023 Corruption Index.",
    icon: "🌍",
  },
];

export const FactsRevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 12], [0, 1]);
  const headerY = ci(frame, [0, 12], [24, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px 100px",
      }}
    >
      <EmeraldOrbs opacity={0.3} />

      <div
        style={{
          width: "100%",
          maxWidth: 520,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            What they don&apos;t tell you:
          </div>
        </div>

        {FACTS.map((fact, i) => (
          <FactCard key={i} entry={fact} index={i} frame={frame} fps={fps} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const FactCard: React.FC<{
  entry: FactEntry;
  index: number;
  frame: number;
  fps: number;
}> = ({ entry, index, frame, fps }) => {
  const delay = 15 + index * 12;
  const prog = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  return (
    <div
      style={{
        opacity: prog,
        transform: `translateY(${(1 - prog) * 40}px)`,
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "14px 18px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Number badge */}
      <div
        style={{
          flexShrink: 0,
          padding: "4px 10px",
          borderRadius: 8,
          background: "rgba(52, 211, 153, 0.1)",
          border: "1px solid rgba(52, 211, 153, 0.25)",
          alignSelf: "flex-start",
          marginTop: 2,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontFamily: ibmPlexMono,
            fontWeight: 700,
            color: "#34d399",
          }}
        >
          {entry.num}
        </span>
      </div>

      {/* Icon */}
      <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>
        {entry.icon}
      </span>

      {/* Fact text */}
      <p
        style={{
          fontSize: 14,
          fontFamily: dmSans,
          fontWeight: 500,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.55,
          margin: 0,
          flex: 1,
        }}
      >
        {entry.fact}
      </p>
    </div>
  );
};
