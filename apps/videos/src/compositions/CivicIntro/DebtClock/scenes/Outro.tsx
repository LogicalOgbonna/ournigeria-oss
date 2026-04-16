import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, instrumentSerif, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const DebtClockOutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = ci(frame, [0, 15], [0, 1]);
  const headingY = ci(frame, [0, 15], [30, 0]);

  const bulletsProg = (index: number) =>
    spring({
      frame: Math.max(0, frame - 20 - index * 10),
      fps,
      config: { damping: 18, stiffness: 90 },
    });

  const urlOpacity = ci(frame, [70, 85], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.6} />

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
          <div
            style={{
              fontSize: 44,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            Hold Them Accountable
          </div>
          <div
            style={{
              fontSize: 22,
              fontFamily: dmSans,
              fontWeight: 500,
              color: "rgba(255,255,255,0.55)",
              marginTop: 8,
            }}
          >
            Track how Nigeria's debt grows — and demand answers.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          {[
            { icon: "📊", text: "Track debt trends by state" },
            { icon: "🔍", text: "See who benefits from loans" },
            { icon: "📣", text: "Share with your community" },
          ].map((item, i) => {
            const prog = bulletsProg(i);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px",
                  borderRadius: 12,
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  opacity: prog,
                  transform: `translateY(${(1 - prog) * 12}px)`,
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: 15,
                    fontFamily: dmSans,
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
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
          <span
            style={{
              fontSize: 28,
              fontFamily: ibmPlexMono,
              color: "#34d399",
              fontWeight: 600,
            }}
          >
            ournigeria.ng
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
