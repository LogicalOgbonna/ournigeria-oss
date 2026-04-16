import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

/**
 * Hook: Pulsing debt counter — ₦1M borrowed every 30 seconds
 */
export const DebtClockHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0.3 * fps, 1 * fps], [0, 1]);
  const titleY = ci(frame, [0.3 * fps, 1 * fps], [40, 0]);

  const subOpacity = ci(frame, [1.2 * fps, 2 * fps], [0, 1]);
  const subY = ci(frame, [1.2 * fps, 2 * fps], [20, 0]);

  // Pulse on the ticker
  const pulse = 0.85 + 0.15 * Math.sin((frame / fps) * Math.PI * 3);
  const redGlow = 0.3 + 0.2 * Math.sin((frame / fps) * Math.PI * 3);

  const fadeOut = ci(frame, [4 * fps, 4.8 * fps], [1, 0]);

  // Simulated debt counter — increases every frame
  const DEBT_BASE = 121_000_000_000_000; // ₦121 trillion
  const BORROW_PER_SECOND = 1_000_000; // ₦1M per second
  const elapsed = frame / fps;
  const liveDebt = DEBT_BASE + Math.floor(elapsed * BORROW_PER_SECOND);
  const formatted = `₦${(liveDebt / 1_000_000_000_000).toFixed(3)}T`;

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut,
      }}
    >
      <EmeraldOrbs opacity={0.4} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontFamily: dmSans,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Nigeria's National Debt — Live
          </div>

          {/* Live counter */}
          <div
            style={{
              fontSize: 72,
              fontFamily: ibmPlexMono,
              fontWeight: 700,
              color: "#ef4444",
              textShadow: `0 0 40px rgba(239,68,68,${redGlow})`,
              transform: `scale(${pulse})`,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {formatted}
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 18,
              fontFamily: ibmPlexMono,
              color: "rgba(239,68,68,0.7)",
            }}
          >
            +₦1,000,000 every 30 seconds
          </div>
        </div>

        <div
          style={{
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            marginTop: 36,
          }}
        >
          <div style={{ maxWidth: 420, margin: "0 auto" }}>
            <div
              style={{
                fontSize: 48,
                fontFamily: instrumentSerif,
                fontWeight: 400,
                color: "#fff",
                lineHeight: 1.2,
              }}
            >
              Do You Know
            </div>
            <div
              style={{
                fontSize: 48,
                fontFamily: instrumentSerif,
                fontWeight: 400,
                lineHeight: 1.2,
                background: "linear-gradient(135deg, #ef4444, #f97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Your Share of This Debt?
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
