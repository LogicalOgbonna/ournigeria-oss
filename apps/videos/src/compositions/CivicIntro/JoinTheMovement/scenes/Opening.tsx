import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const quoteOpacity = ci(frame, [0.5 * fps, 1.2 * fps], [0, 1]);
  const quoteY = ci(frame, [0.5 * fps, 1.2 * fps], [40, 0]);

  const authorOpacity = ci(frame, [1.5 * fps, 2.2 * fps], [0, 1]);

  const titleOpacity = ci(frame, [2.8 * fps, 3.5 * fps], [0, 1]);
  const titleY = ci(frame, [2.8 * fps, 3.5 * fps], [30, 0]);

  const fadeOut = ci(frame, [5 * fps, 5.8 * fps], [1, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 60px",
        opacity: fadeOut,
      }}
    >
      <EmeraldOrbs opacity={0.7} />

      {/* Opening quote */}
      <div
        style={{
          opacity: quoteOpacity,
          transform: `translateY(${quoteY}px)`,
          zIndex: 10,
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontFamily: instrumentSerif,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.4,
          }}
        >
          "The price of democracy is eternal vigilance. In Nigeria, that
          vigilance starts with knowing who represents you."
        </div>
      </div>

      <div
        style={{
          opacity: authorOpacity,
          zIndex: 10,
          marginTop: 24,
        }}
      >
        <div
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.35)",
            fontFamily: dmSans,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          — The OurNigeria Community
        </div>
      </div>

      {/* Brand name */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 10,
          marginTop: 60,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontFamily: instrumentSerif,
            fontWeight: 400,
            background: "linear-gradient(135deg, #34d399, #059669, #34d399)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          OurNigeria
        </div>
      </div>
    </AbsoluteFill>
  );
};
