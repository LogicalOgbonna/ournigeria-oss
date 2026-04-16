import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const LGAS = [
  { lga: "Ikeja", received: "₦892M", spent: "₦210M", execution: 24, color: "#ef4444" },
  { lga: "Surulere", received: "₦764M", spent: "₦580M", execution: 76, color: "#34d399" },
  { lga: "Apapa", received: "₦650M", spent: "₦95M", execution: 15, color: "#ef4444" },
  { lga: "Kosofe", received: "₦720M", spent: "₦540M", execution: 75, color: "#34d399" },
  { lga: "Mushin", received: "₦580M", spent: "₦87M", execution: 15, color: "#f97316" },
  { lga: "Ojo", received: "₦610M", spent: "₦488M", execution: 80, color: "#34d399" },
];

export const LGABreakdownScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [30, 0]);

  const rowSpring = (i: number) =>
    spring({
      frame: Math.max(0, frame - 20 - i * 10),
      fps,
      config: { damping: 18, stiffness: 90 },
    });

  const barWidth = (i: number, pct: number) =>
    ci(frame, [28 + i * 10, 70 + i * 10], [0, pct]);

  const calloutOpacity = ci(frame, [105, 120], [0, 1]);
  const calloutY = ci(frame, [105, 120], [18, 0]);

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
      <EmeraldOrbs opacity={0.28} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 24,
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
              fontSize: 34,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.25,
            }}
          >
            Sample: Lagos LGAs — January 2024 FAAC
          </div>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingBottom: 8,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              width: 120,
              fontSize: 11,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              flexShrink: 0,
            }}
          >
            LGA
          </div>
          <div style={{ flex: 1, fontSize: 11, fontFamily: dmSans, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Budget Execution
          </div>
          <div
            style={{
              width: 100,
              fontSize: 11,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            Received
          </div>
          <div
            style={{
              width: 90,
              fontSize: 11,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            Spent
          </div>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {LGAS.map((row, i) => {
            const prog = rowSpring(i);
            return (
              <div
                key={row.lga}
                style={{
                  opacity: prog,
                  transform: `translateY(${(1 - prog) * -24}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {/* LGA name */}
                <div
                  style={{
                    width: 120,
                    fontSize: 16,
                    fontFamily: dmSans,
                    fontWeight: 600,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {row.lga}
                </div>

                {/* Bar + execution % */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div
                    style={{
                      height: 22,
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.04)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidth(i, row.execution)}%`,
                        height: "100%",
                        background: row.color,
                        borderRadius: 6,
                        opacity: 0.9,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: ibmPlexMono,
                      color: row.color,
                      fontWeight: 600,
                    }}
                  >
                    {row.execution}% executed
                  </div>
                </div>

                {/* Received */}
                <div
                  style={{
                    width: 100,
                    textAlign: "right",
                    fontSize: 14,
                    fontFamily: ibmPlexMono,
                    color: "rgba(255,255,255,0.35)",
                    flexShrink: 0,
                  }}
                >
                  {row.received}
                </div>

                {/* Spent */}
                <div
                  style={{
                    width: 90,
                    textAlign: "right",
                    fontSize: 14,
                    fontFamily: ibmPlexMono,
                    color: row.color,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {row.spent}
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
            padding: "14px 22px",
            borderRadius: 12,
            background: "rgba(239, 68, 68, 0.07)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          <p
            style={{
              fontSize: 16,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            <span style={{ color: "#ef4444" }}>3 of 6 LGAs</span> spent less
            than 25% of received funds.{" "}
            <span style={{ color: "#fbbf24" }}>No public record of why.</span>
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
