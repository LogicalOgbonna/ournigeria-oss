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

interface ComparisonPanel {
  label: string;
  expected: string;
  got: string;
  icon: string;
}

const PANELS: ComparisonPanel[] = [
  {
    label: "Roads",
    expected: "Maintained, safe roads",
    got: "67% of federal roads in poor condition",
    icon: "🛣️",
  },
  {
    label: "Healthcare",
    expected: "Free primary care",
    got: "Pay out-of-pocket for 86% of needs",
    icon: "🏥",
  },
  {
    label: "Schools",
    expected: "Equipped public schools",
    got: "42% of public schools lack electricity",
    icon: "🏫",
  },
];

export const ServiceGapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [30, 0]);

  const quoteOpacity = ci(frame, [3.8 * fps, 4.3 * fps], [0, 1]);
  const quoteY = ci(frame, [3.8 * fps, 4.3 * fps], [18, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 80px",
      }}
    >
      <EmeraldOrbs opacity={0.35} />

      <div
        style={{
          width: "100%",
          maxWidth: 520,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 28,
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
            What You Should Get Back
          </div>
        </div>

        {/* 3 panels side by side */}
        <div
          style={{
            display: "flex",
            gap: 20,
          }}
        >
          {PANELS.map((panel, i) => (
            <PanelCard
              key={i}
              entry={panel}
              index={i}
              frame={frame}
              fps={fps}
            />
          ))}
        </div>

        {/* Bottom quote */}
        <div
          style={{
            opacity: quoteOpacity,
            transform: `translateY(${quoteY}px)`,
            padding: "16px 24px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 15,
              fontFamily: dmSans,
              fontWeight: 500,
              color: "rgba(255,255,255,0.55)",
              margin: 0,
              lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            VAT was introduced with a social contract. Nigeria collected its
            end.{" "}
            <span style={{ color: "#ef4444", fontStyle: "normal", fontWeight: 700 }}>
              Government hasn&apos;t.
            </span>
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PanelCard: React.FC<{
  entry: ComparisonPanel;
  index: number;
  frame: number;
  fps: number;
}> = ({ entry, index, frame, fps }) => {
  const delay = 18 + index * 16;
  const prog = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const expectedDelay = delay + 12;
  const gotDelay = delay + 24;

  const expectedProg = spring({
    frame: Math.max(0, frame - expectedDelay),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const gotProg = spring({
    frame: Math.max(0, frame - gotDelay),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  return (
    <div
      style={{
        flex: 1,
        opacity: prog,
        transform: `translateY(${(1 - prog) * 24}px)`,
        padding: "22px 18px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Label badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>{entry.icon}</span>
        <span
          style={{
            padding: "4px 12px",
            borderRadius: 100,
            background: "rgba(52, 211, 153, 0.1)",
            border: "1px solid rgba(52, 211, 153, 0.25)",
            fontSize: 13,
            fontFamily: ibmPlexMono,
            fontWeight: 700,
            color: "#34d399",
          }}
        >
          {entry.label}
        </span>
      </div>

      {/* Expected row */}
      <div
        style={{
          opacity: expectedProg,
          transform: `translateY(${(1 - expectedProg) * -10}px)`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: dmSans,
            fontWeight: 700,
            color: "rgba(52,211,153,0.7)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          ✓ Expected
        </div>
        <div
          style={{
            fontSize: 13,
            fontFamily: dmSans,
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.4,
          }}
        >
          {entry.expected}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.06)",
        }}
      />

      {/* Got row */}
      <div
        style={{
          opacity: gotProg,
          transform: `translateY(${(1 - gotProg) * -10}px)`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: dmSans,
            fontWeight: 700,
            color: "rgba(239,68,68,0.8)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          ✗ Reality
        </div>
        <div
          style={{
            fontSize: 13,
            fontFamily: dmSans,
            fontWeight: 500,
            color: "#ef4444",
            lineHeight: 1.4,
          }}
        >
          {entry.got}
        </div>
      </div>
    </div>
  );
};
