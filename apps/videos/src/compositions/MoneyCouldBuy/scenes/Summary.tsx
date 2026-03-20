import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { PidginCaption } from "@/components/PidginCaption";

export const Summary: React.FC<{
  pidginCaption: string;
}> = ({ pidginCaption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const subtextOpacity = ci(frame, [20, 35], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.5} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 60px",
          gap: 32,
          zIndex: 10,
        }}
      >
        {/* Think about it */}
        <div
          style={{
            transform: `scale(${textScale})`,
            opacity: textScale,
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
            Think
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
            About It.
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtextOpacity,
            fontSize: 24,
            fontFamily: dmSans,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            fontWeight: 500,
          }}
        >
          Your money. Your government. Your right to know.
        </div>
      </div>

      {/* Pidgin caption */}
      <PidginCaption text={pidginCaption} animationStart={40} />
    </AbsoluteFill>
  );
};
