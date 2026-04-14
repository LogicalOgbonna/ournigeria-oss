import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const COUNTRIES = [
  { country: "Norway", amount: "₦2.1M", usd: "$1,287", color: "#34d399", pct: 100, dashed: false },
  { country: "South Africa", amount: "₦152K", usd: "$93", color: "#059669", pct: 36, dashed: false },
  { country: "Ghana", amount: "₦28K", usd: "$17", color: "#0891b2", pct: 13, dashed: false },
  { country: "Nigeria", amount: "₦8.2K", usd: "$5", color: "#ef4444", pct: 4, dashed: false },
  { country: "WHO Minimum", amount: "₦114K", usd: "$70", color: "#fbbf24", pct: 27, dashed: true },
];

export const ComparisonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [30, 0]);

  const calloutOpacity = ci(frame, [100, 115], [0, 1]);
  const calloutY = ci(frame, [100, 115], [20, 0]);

  const rowSpring = (i: number) =>
    spring({
      frame: Math.max(0, frame - 20 - i * 10),
      fps,
      config: { damping: 18, stiffness: 90 },
    });

  const barWidth = (i: number, maxPct: number) =>
    ci(frame, [25 + i * 10, 65 + i * 10], [0, maxPct]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px 80px",
      }}
    >
      <EmeraldOrbs opacity={0.25} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 900,
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
              fontSize: 38,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            Health Spend Per Capita: Nigeria vs World
          </div>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {COUNTRIES.map((row, i) => {
            const prog = rowSpring(i);
            return (
              <div
                key={row.country}
                style={{
                  opacity: prog,
                  transform: `translateX(${(1 - prog) * -30}px)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      width: 160,
                      fontSize: 16,
                      fontFamily: dmSans,
                      fontWeight: row.country === "Nigeria" ? 700 : 500,
                      color: row.country === "Nigeria" ? "#ef4444" : row.country === "WHO Minimum" ? "#fbbf24" : "rgba(255,255,255,0.85)",
                      flexShrink: 0,
                    }}
                  >
                    {row.country === "WHO Minimum" ? (
                      <span>
                        {row.country}{" "}
                        <span
                          style={{
                            fontSize: 11,
                            color: "rgba(251,191,36,0.6)",
                            fontFamily: ibmPlexMono,
                          }}
                        >
                          (target)
                        </span>
                      </span>
                    ) : row.country}
                  </div>

                  {/* Bar */}
                  <div
                    style={{
                      flex: 1,
                      height: 28,
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.04)",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidth(i, row.pct)}%`,
                        height: "100%",
                        background: row.color,
                        borderRadius: 6,
                        opacity: 0.85,
                        borderRight: row.dashed ? `3px dashed ${row.color}` : "none",
                      }}
                    />
                  </div>

                  {/* Amount */}
                  <div
                    style={{
                      width: 160,
                      textAlign: "right",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 2,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontFamily: ibmPlexMono,
                        fontWeight: 600,
                        color: row.color,
                      }}
                    >
                      {row.amount}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: ibmPlexMono,
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      {row.usd}/yr
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Callout */}
        <div
          style={{
            opacity: calloutOpacity,
            transform: `translateY(${calloutY}px)`,
            padding: "16px 24px",
            borderRadius: 12,
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
          }}
        >
          <p
            style={{
              fontSize: 17,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            Nigeria is{" "}
            <span style={{ color: "#ef4444" }}>13x below WHO minimum</span>.{" "}
            <span style={{ color: "#fbbf24" }}>86% of Nigerians</span> pay out
            of pocket.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
