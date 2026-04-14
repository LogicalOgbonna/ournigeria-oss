import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, instrumentSerif, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const IMPACT_ITEMS = [
  { icon: "🏥", stat: "2.4M", label: "Primary Health Centres", sub: "we could have built" },
  { icon: "📚", stat: "15M", label: "University scholarships", sub: "fully paid 4-year degrees" },
  { icon: "💡", stat: "100%", label: "Rural electrification", sub: "covering all 36 states" },
];

export const DebtImpactScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = ci(frame, [0, 15], [0, 1]);
  const headingY = ci(frame, [0, 15], [30, 0]);

  const interestProg = spring({
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
      <EmeraldOrbs opacity={0.3} />

      <div
        style={{
          opacity: headingOpacity,
          transform: `translateY(${headingY}px)`,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontFamily: dmSans,
            fontWeight: 500,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 8,
            maxWidth: 420,
            margin: "0 auto",
          }}
        >
          Instead of Debt Repayments, ₦121T Could Have Funded:
        </div>
        <div
          style={{
            fontSize: 40,
            fontFamily: instrumentSerif,
            color: "#fff",
            lineHeight: 1.2,
          }}
        >
          A Different Nigeria
        </div>
      </div>

      {/* Impact cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 10,
          width: "100%",
          maxWidth: 420,
        }}
      >
        {IMPACT_ITEMS.map((item, i) => {
          const prog = spring({
            frame: Math.max(0, frame - 25 - i * 10),
            fps,
            config: { damping: 18, stiffness: 90 },
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                borderRadius: 14,
                background: "rgba(52,211,153,0.04)",
                border: "1px solid rgba(52,211,153,0.12)",
                opacity: prog,
                transform: `translateY(${(1 - prog) * 20}px)`,
              }}
            >
              <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 28,
                      fontFamily: ibmPlexMono,
                      fontWeight: 700,
                      color: "#34d399",
                      lineHeight: 1,
                    }}
                  >
                    {item.stat}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontFamily: dmSans,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: dmSans,
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 2,
                  }}
                >
                  {item.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interest callout */}
      <div
        style={{
          opacity: interestProg,
          zIndex: 10,
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontFamily: dmSans,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.5,
          }}
        >
          Nigeria pays{" "}
          <span style={{ color: "#fbbf24", fontWeight: 700 }}>
            ₦8.25T in interest alone
          </span>{" "}
          this year — more than the entire education budget.
        </div>
      </div>
    </AbsoluteFill>
  );
};
