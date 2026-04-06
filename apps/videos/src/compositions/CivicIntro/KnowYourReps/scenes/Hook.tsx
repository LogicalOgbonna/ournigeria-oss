import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const questionOpacity = ci(frame, [0.3 * fps, 1 * fps], [0, 1]);
  const questionY = ci(frame, [0.3 * fps, 1 * fps], [50, 0]);

  const subOpacity = ci(frame, [1.2 * fps, 2 * fps], [0, 1]);
  const subY = ci(frame, [1.2 * fps, 2 * fps], [20, 0]);

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
        <div
          style={{
            opacity: questionOpacity,
            transform: `translateY(${questionY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 62,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            Do You Know
          </div>
          <div
            style={{
              fontSize: 62,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.15,
              background: "linear-gradient(135deg, #34d399, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Who Governs You?
          </div>
        </div>

        <div
          style={{
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            marginTop: 32,
          }}
        >
          <p
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.5)",
              fontFamily: dmSans,
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            From your ward councillor to your governor —{"\n"}
            find them all in one place.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
