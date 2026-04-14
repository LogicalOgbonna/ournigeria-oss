import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, instrumentSerif, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const GovernorReportOutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = ci(frame, [0, 15], [0, 1]);
  const headingY = ci(frame, [0, 15], [30, 0]);
  const urlOpacity = ci(frame, [80, 95], [0, 1]);

  const bullets = [
    { icon: "📊", text: "View your governor's full scorecard" },
    { icon: "🔔", text: "Get alerts when budgets are released" },
    { icon: "🗣️", text: "Ask our AI about any state's spending" },
  ];

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.65} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "50px 80px",
          gap: 24,
          zIndex: 10,
        }}
      >
        <div
          style={{
            opacity: headingOpacity,
            transform: `translateY(${headingY}px)`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 44, fontFamily: instrumentSerif, color: "#fff", lineHeight: 1.2 }}>
            Your Vote Has Power.
          </div>
          <div
            style={{
              fontSize: 44,
              fontFamily: instrumentSerif,
              lineHeight: 1.2,
              background: "linear-gradient(135deg, #34d399, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Use the Data.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
          }}
        >
          {bullets.map((item, i) => {
            const prog = spring({
              frame: Math.max(0, frame - 20 - i * 10),
              fps,
              config: { damping: 18, stiffness: 90 },
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px",
                  borderRadius: 12,
                  background: "rgba(52,211,153,0.06)",
                  border: "1px solid rgba(52,211,153,0.15)",
                  opacity: prog,
                  transform: `translateY(${(1 - prog) * 12}px)`,
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 15, fontFamily: dmSans, fontWeight: 600, color: "#fff" }}>
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            opacity: urlOpacity,
            padding: "10px 28px",
            borderRadius: 100,
            border: "2px solid rgba(52,211,153,0.4)",
            background: "rgba(52,211,153,0.08)",
          }}
        >
          <span style={{ fontSize: 28, fontFamily: ibmPlexMono, color: "#34d399", fontWeight: 600 }}>
            ournigeria.ng
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
