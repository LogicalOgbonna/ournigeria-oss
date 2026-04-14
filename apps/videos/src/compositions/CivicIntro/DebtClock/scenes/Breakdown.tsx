import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, countUp, formatNumber } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const CREDITORS = [
  { name: "World Bank / IMF", amount: 45.2, color: "#ef4444", pct: 37 },
  { name: "Eurobonds", amount: 28.6, color: "#f97316", pct: 24 },
  { name: "African Dev Bank", amount: 18.4, color: "#fbbf24", pct: 15 },
  { name: "Bilateral (China, etc)", amount: 14.8, color: "#f59e0b", pct: 12 },
  { name: "Others", amount: 14.0, color: "#94a3b8", pct: 12 },
];

export const DebtBreakdownScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [25, 0]);

  const PER_CAPITA = 580_000; // ₦580k per Nigerian
  const animatedPerCapita = countUp(frame, 20, 60, PER_CAPITA);

  const perCapitaProg = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px 60px",
        gap: 24,
      }}
    >
      <EmeraldOrbs opacity={0.25} />

      {/* Header */}
      <div
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 38,
            fontFamily: instrumentSerif,
            color: "#fff",
            lineHeight: 1.2,
            maxWidth: 420,
            margin: "0 auto",
          }}
        >
          ₦121 Trillion Owed To:
        </div>
      </div>

      {/* Creditor bars */}
      <div
        style={{
          width: 520,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 10,
        }}
      >
        {CREDITORS.map((c, i) => {
          const barWidth = ci(frame, [20 + i * 8, 50 + i * 8], [0, c.pct]);
          const rowOpacity = ci(frame, [15 + i * 8, 30 + i * 8], [0, 1]);
          return (
            <div
              key={i}
              style={{ opacity: rowOpacity }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 5,
                  fontSize: 14,
                  fontFamily: dmSans,
                  fontWeight: 600,
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{c.name}</span>
                <span style={{ color: c.color, fontFamily: ibmPlexMono }}>
                  ₦{c.amount}T ({c.pct}%)
                </span>
              </div>
              <div
                style={{
                  height: 10,
                  borderRadius: 100,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: "100%",
                    borderRadius: 100,
                    background: `linear-gradient(90deg, ${c.color}99, ${c.color})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Per capita callout */}
      <div
        style={{
          opacity: perCapitaProg,
          transform: `scale(${0.85 + perCapitaProg * 0.15})`,
          padding: "18px 32px",
          borderRadius: 18,
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontFamily: dmSans,
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 4,
          }}
        >
          Your Personal Share
        </div>
        <div
          style={{
            fontSize: 52,
            fontFamily: ibmPlexMono,
            fontWeight: 700,
            color: "#ef4444",
            lineHeight: 1,
          }}
        >
          ₦{formatNumber(animatedPerCapita)}
        </div>
        <div
          style={{
            fontSize: 15,
            fontFamily: dmSans,
            color: "rgba(255,255,255,0.45)",
            marginTop: 4,
          }}
        >
          per Nigerian — including newborns
        </div>
      </div>
    </AbsoluteFill>
  );
};
