import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const CARDS = [
  {
    icon: "🏥",
    stat: "1 doctor",
    sub: "per 2,500 Nigerians\n(WHO: 1 per 1,000)",
    color: "#ef4444",
    border: "rgba(239, 68, 68, 0.2)",
    bg: "rgba(239, 68, 68, 0.06)",
  },
  {
    icon: "💊",
    stat: "27%",
    sub: "of primary health centres\nlack basic drugs",
    color: "#fbbf24",
    border: "rgba(251, 191, 36, 0.2)",
    bg: "rgba(251, 191, 36, 0.06)",
  },
  {
    icon: "👶",
    stat: "512",
    sub: "maternal deaths\nper 100k births",
    color: "#ef4444",
    border: "rgba(239, 68, 68, 0.2)",
    bg: "rgba(239, 68, 68, 0.06)",
  },
];

export const ImpactScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [30, 0]);

  const cardSpring = (i: number) =>
    spring({
      frame: Math.max(0, frame - 20 - i * 12),
      fps,
      config: { damping: 18, stiffness: 90 },
    });

  const bottomOpacity = ci(frame, [90, 110], [0, 1]);
  const bottomY = ci(frame, [90, 110], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px 80px",
        gap: 40,
      }}
    >
      <EmeraldOrbs opacity={0.3} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
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
              fontSize: 36,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.25,
            }}
          >
            What ₦8.2K/person Means in Practice
          </div>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 24,
            width: "100%",
          }}
        >
          {CARDS.map((card, i) => {
            const prog = cardSpring(i);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  opacity: prog,
                  transform: `translateY(${(1 - prog) * 40}px)`,
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  borderRadius: 16,
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 44 }}>{card.icon}</div>
                <div
                  style={{
                    fontSize: 42,
                    fontFamily: ibmPlexMono,
                    fontWeight: 700,
                    color: card.color,
                    lineHeight: 1,
                  }}
                >
                  {card.stat}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontFamily: dmSans,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.5,
                    whiteSpace: "pre-line",
                  }}
                >
                  {card.sub}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom line */}
        <div
          style={{
            opacity: bottomOpacity,
            transform: `translateY(${bottomY}px)`,
            padding: "14px 28px",
            borderRadius: 12,
            background: "rgba(251, 191, 36, 0.06)",
            border: "1px solid rgba(251, 191, 36, 0.2)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "#fbbf24",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Every ₦1 invested in preventive care saves ₦4 in emergency
            treatment.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
