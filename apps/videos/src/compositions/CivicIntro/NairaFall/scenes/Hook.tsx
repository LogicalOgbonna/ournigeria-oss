import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0.3 * fps, 1 * fps], [0, 1]);
  const titleY = ci(frame, [0.3 * fps, 1 * fps], [50, 0]);

  const noteOpacity = ci(frame, [1.2 * fps, 2 * fps], [0, 1]);
  const noteScale = ci(frame, [1.2 * fps, 2 * fps], [0.8, 1]);

  // Fragment pieces appear staggered after the note
  const frag1Opacity = ci(frame, [2.2 * fps, 2.8 * fps], [0, 1]);
  const frag1X = ci(frame, [2.2 * fps, 2.8 * fps], [0, -120]);
  const frag1Y = ci(frame, [2.2 * fps, 2.8 * fps], [0, 60]);

  const frag2Opacity = ci(frame, [2.4 * fps, 3 * fps], [0, 1]);
  const frag2X = ci(frame, [2.4 * fps, 3 * fps], [0, 80]);
  const frag2Y = ci(frame, [2.4 * fps, 3 * fps], [0, 80]);

  const frag3Opacity = ci(frame, [2.5 * fps, 3.1 * fps], [0, 1]);
  const frag3X = ci(frame, [2.5 * fps, 3.1 * fps], [0, -60]);
  const frag3Y = ci(frame, [2.5 * fps, 3.1 * fps], [0, 100]);

  const subOpacity = ci(frame, [3 * fps, 3.7 * fps], [0, 1]);
  const subY = ci(frame, [3 * fps, 3.7 * fps], [20, 0]);

  const fadeOut = ci(frame, [4 * fps, 4.8 * fps], [1, 0]);

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
      <EmeraldOrbs opacity={0.3} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "0 80px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 58,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            ₦1,000 in 2015
          </div>
          <div
            style={{
              fontSize: 58,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.15,
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Buys This Much in 2024
          </div>
        </div>

        {/* Note visual with fragments */}
        <div
          style={{
            position: "relative",
            width: 280,
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Main note */}
          <div
            style={{
              opacity: noteOpacity,
              transform: `scale(${noteScale})`,
              padding: "16px 32px",
              borderRadius: 12,
              background: "rgba(251, 191, 36, 0.1)",
              border: "2px solid rgba(251, 191, 36, 0.35)",
            }}
          >
            <span
              style={{
                fontSize: 52,
                fontFamily: ibmPlexMono,
                fontWeight: 700,
                color: "#fbbf24",
                letterSpacing: "-1px",
              }}
            >
              ₦1,000
            </span>
          </div>

          {/* Fragment 1 */}
          <div
            style={{
              position: "absolute",
              opacity: frag1Opacity,
              transform: `translate(${frag1X}px, ${frag1Y}px)`,
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontFamily: ibmPlexMono,
                fontWeight: 600,
                color: "#ef4444",
              }}
            >
              ₦290
            </span>
          </div>

          {/* Fragment 2 */}
          <div
            style={{
              position: "absolute",
              opacity: frag2Opacity,
              transform: `translate(${frag2X}px, ${frag2Y}px)`,
              padding: "6px 12px",
              borderRadius: 8,
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontFamily: ibmPlexMono,
                fontWeight: 600,
                color: "rgba(239, 68, 68, 0.7)",
              }}
            >
              ₦120
            </span>
          </div>

          {/* Fragment 3 */}
          <div
            style={{
              position: "absolute",
              opacity: frag3Opacity,
              transform: `translate(${frag3X}px, ${frag3Y}px)`,
              padding: "5px 10px",
              borderRadius: 8,
              background: "rgba(239, 68, 68, 0.06)",
              border: "1px solid rgba(239, 68, 68, 0.15)",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontFamily: ibmPlexMono,
                fontWeight: 600,
                color: "rgba(239, 68, 68, 0.5)",
              }}
            >
              ₦80
            </span>
          </div>
        </div>

        {/* Sub */}
        <div
          style={{
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          <p
            style={{
              fontSize: 22,
              maxWidth: 420,
              margin: "0 auto",
              color: "rgba(255,255,255,0.5)",
              fontFamily: dmSans,
              fontWeight: 500,
              lineHeight: 1.55,
            }}
          >
            Nigeria's inflation has cut purchasing power by{" "}
            <span style={{ color: "#ef4444", fontWeight: 700 }}>71%</span> in 9
            years.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
