import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const BREAKDOWN = [
  { label: "Salaries & Overheads", pct: 62, color: "#94a3b8" },
  { label: "Constituency Projects", pct: 21, color: "#059669" },
  { label: "Councillor Allowances", pct: 11, color: "#f97316" },
  { label: "Unaccounted", pct: 6, color: "#ef4444" },
];

export const WhereItGoesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [30, 0]);

  const subOpacity = ci(frame, [15, 28], [0, 1]);
  const subY = ci(frame, [15, 28], [20, 0]);

  const barSpring = (i: number) =>
    spring({
      frame: Math.max(0, frame - 30 - i * 10),
      fps,
      config: { damping: 18, stiffness: 90 },
    });

  const barWidth = (i: number, pct: number) =>
    ci(frame, [35 + i * 10, 80 + i * 10], [0, pct]);

  const calloutOpacity = ci(frame, [100, 115], [0, 1]);
  const calloutY = ci(frame, [100, 115], [20, 0]);

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
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 30,
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
              fontSize: 42,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            ₦XXX Unspent. No Explanation.
          </div>
        </div>

        {/* Sub header */}
        <div
          style={{
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontFamily: dmSans,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            In most LGAs, FAAC money is split as:
          </div>
        </div>

        {/* Breakdown bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {BREAKDOWN.map((item, i) => {
            const prog = barSpring(i);
            return (
              <div
                key={item.label}
                style={{
                  opacity: prog,
                  transform: `translateY(${(1 - prog) * -20}px)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontFamily: dmSans,
                      fontWeight: 600,
                      color: item.color === "#94a3b8" ? "rgba(255,255,255,0.7)" : item.color,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontFamily: ibmPlexMono,
                      fontWeight: 700,
                      color: item.color,
                    }}
                  >
                    {item.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 20,
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.04)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${barWidth(i, item.pct)}%`,
                      height: "100%",
                      background: item.color,
                      borderRadius: 6,
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Big callout */}
        <div
          style={{
            opacity: calloutOpacity,
            transform: `translateY(${calloutY}px)`,
            padding: "18px 28px",
            borderRadius: 14,
            background: "rgba(52, 211, 153, 0.06)",
            border: "1px solid rgba(52, 211, 153, 0.2)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            You have the{" "}
            <span style={{ color: "#34d399" }}>RIGHT to see these accounts</span>.{" "}
            <span style={{ color: "#fbbf24" }}>
              Most LGAs don't publish them.
            </span>
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
