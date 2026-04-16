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

const BULLETS = [
  { icon: "🧾", text: "See how VAT revenue is allocated" },
  { icon: "📊", text: "Compare service delivery by state" },
  { icon: "🗳️", text: "Hold your reps to account" },
];

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = ci(frame, [0, 15], [0, 1]);
  const headingY = ci(frame, [0, 15], [40, 0]);

  const urlOpacity = ci(frame, [80, 95], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.7} />

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
        {/* Heading */}
        <div
          style={{
            opacity: headingOpacity,
            transform: `translateY(${headingY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            You Funded This Country.
          </div>
          <div
            style={{
              fontSize: 56,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.2,
              background: "linear-gradient(135deg, #34d399, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Now Track Where It Went.
          </div>
        </div>

        {/* Bullets */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
          }}
        >
          {BULLETS.map((item, i) => {
            const prog = spring({
              frame: Math.max(0, frame - 40 - i * 10),
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
                  padding: "12px 20px",
                  borderRadius: 14,
                  background: "rgba(52, 211, 153, 0.06)",
                  border: "1px solid rgba(52, 211, 153, 0.18)",
                  opacity: prog,
                  transform: `translateY(${(1 - prog) * 14}px)`,
                }}
              >
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: 16,
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

        {/* URL pill */}
        <div
          style={{
            opacity: urlOpacity,
            padding: "12px 32px",
            borderRadius: 100,
            border: "2px solid rgba(52, 211, 153, 0.4)",
            background: "rgba(52, 211, 153, 0.08)",
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
