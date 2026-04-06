import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const emojiScale = ci(frame, [0.2 * fps, 0.6 * fps], [0, 1]);
  const emojiOpacity = ci(frame, [0.2 * fps, 0.6 * fps], [0, 1]);

  const titleOpacity = ci(frame, [0.6 * fps, 1.3 * fps], [0, 1]);
  const titleY = ci(frame, [0.6 * fps, 1.3 * fps], [40, 0]);

  const subOpacity = ci(frame, [1.5 * fps, 2.2 * fps], [0, 1]);

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
      <EmeraldOrbs opacity={0.6} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "0 60px",
          textAlign: "center",
        }}
      >
        {/* Eye emoji */}
        <div
          style={{
            fontSize: 80,
            transform: `scale(${emojiScale})`,
            opacity: emojiOpacity,
            marginBottom: 24,
          }}
        >
          👁️
        </div>

        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            See Something?
          </div>
          <div
            style={{
              fontSize: 56,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.15,
              background: "linear-gradient(135deg, #34d399, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Say Something.
          </div>
        </div>

        <div style={{ opacity: subOpacity, marginTop: 28 }}>
          <p
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.45)",
              fontFamily: dmSans,
              fontWeight: 500,
            }}
          >
            Every citizen can propose, verify, and correct official data
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
