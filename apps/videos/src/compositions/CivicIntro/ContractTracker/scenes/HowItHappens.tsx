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

interface StepEntry {
  step: string;
  label: string;
  detail: string;
  color: string;
}

const STEPS: StepEntry[] = [
  {
    step: "01",
    label: "Contract Awarded",
    detail: "Often without competitive tender",
    color: "#34d399",
  },
  {
    step: "02",
    label: "Advance Payment",
    detail: "30-50% paid upfront — common practice",
    color: "#fbbf24",
  },
  {
    step: "03",
    label: "Work Stops",
    detail: "After mobilization fee is collected",
    color: "#f97316",
  },
  {
    step: "04",
    label: "Abandoned Site",
    detail: "Re-awarded to same contractor or forgotten",
    color: "#ef4444",
  },
];

export const HowItHappensScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 60px",
      }}
    >
      <EmeraldOrbs opacity={0.35} />

      <div
        style={{
          width: "100%",
          maxWidth: 480,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            marginBottom: 40,
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
            How Contracts Go Missing
          </div>
        </div>

        {/* Steps */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            position: "relative",
          }}
        >
          {STEPS.map((s, i) => (
            <StepRow
              key={i}
              entry={s}
              index={i}
              frame={frame}
              fps={fps}
              isLast={i === STEPS.length - 1}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StepRow: React.FC<{
  entry: StepEntry;
  index: number;
  frame: number;
  fps: number;
  isLast: boolean;
}> = ({ entry, index, frame, fps, isLast }) => {
  const delay = 20 + index * 18;
  const prog = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const connectorProg = spring({
    frame: Math.max(0, frame - delay - 8),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  return (
    <div
      style={{
        opacity: prog,
        transform: `translateY(${(1 - prog) * -24}px)`,
        display: "flex",
        alignItems: "stretch",
        gap: 0,
      }}
    >
      {/* Left column: dot + connector line */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 48,
          flexShrink: 0,
        }}
      >
        {/* Dot */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: entry.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 0 16px ${entry.color}55`,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: ibmPlexMono,
              fontWeight: 700,
              color: "#080c0a",
            }}
          >
            {entry.step}
          </span>
        </div>

        {/* Connector line */}
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              minHeight: 32,
              background: `linear-gradient(to bottom, ${entry.color}88, transparent)`,
              transform: `scaleY(${connectorProg})`,
              transformOrigin: "top",
              marginTop: 4,
              marginBottom: 4,
            }}
          />
        )}
      </div>

      {/* Right content */}
      <div
        style={{
          paddingLeft: 20,
          paddingTop: 6,
          paddingBottom: isLast ? 0 : 32,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontFamily: dmSans,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.3,
          }}
        >
          {entry.label}
        </div>
        <div
          style={{
            fontSize: 15,
            fontFamily: dmSans,
            fontWeight: 400,
            color: "rgba(255,255,255,0.45)",
            marginTop: 4,
          }}
        >
          {entry.detail}
        </div>
      </div>
    </div>
  );
};
