import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0.3 * fps, 1.0 * fps], [0, 1]);
  const titleY = ci(frame, [0.3 * fps, 1.0 * fps], [50, 0]);

  const statOpacity = ci(frame, [1.5 * fps, 2.1 * fps], [0, 1]);
  const statScale = ci(frame, [1.5 * fps, 2.2 * fps], [0.7, 1]);

  const statSubOpacity = ci(frame, [2.0 * fps, 2.5 * fps], [0, 1]);

  const questionOpacity = ci(frame, [2.8 * fps, 3.4 * fps], [0, 1]);
  const questionY = ci(frame, [2.8 * fps, 3.4 * fps], [20, 0]);

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
        {/* Title lines */}
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
            You&apos;ve Paid VAT on Everything
          </div>
          <div
            style={{
              fontSize: 58,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            You Bought This Year.
          </div>
        </div>

        {/* Big stat */}
        <div
          style={{
            opacity: statOpacity,
            transform: `scale(${statScale})`,
            marginTop: 32,
          }}
        >
          <div
            style={{
              fontSize: 70,
              fontFamily: ibmPlexMono,
              fontWeight: 700,
              color: "#fbbf24",
              lineHeight: 1,
            }}
          >
            ₦3.7T
          </div>
          <div
            style={{
              opacity: statSubOpacity,
              fontSize: 18,
              fontFamily: dmSans,
              fontWeight: 500,
              color: "rgba(255,255,255,0.45)",
              marginTop: 10,
            }}
          >
            Total VAT collected from Nigerians in 2023
          </div>
        </div>

        {/* Question line */}
        <div
          style={{
            opacity: questionOpacity,
            transform: `translateY(${questionY}px)`,
            marginTop: 28,
          }}
        >
          <p
            style={{
              fontSize: 24,
              maxWidth: 420,
              margin: "0 auto",
              fontFamily: dmSans,
              fontWeight: 500,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.5,
            }}
          >
            So where are your roads? Your hospitals? Your schools?
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
