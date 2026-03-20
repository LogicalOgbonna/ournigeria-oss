import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const Hook: React.FC<{
  state1Name: string;
  state2Name: string;
  fiscalYear: number;
}> = ({ state1Name, state2Name, fiscalYear }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const yearOpacity = ci(frame, [0, 15], [0, 1]);
  const yearY = ci(frame, [0, 15], [40, 0]);

  const state1X = ci(frame, [10, 35], [-400, 0]);
  const state1Opacity = ci(frame, [10, 35], [0, 1]);

  const state2X = ci(frame, [10, 35], [400, 0]);
  const state2Opacity = ci(frame, [10, 35], [0, 1]);

  const vsScale = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

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
          padding: "80px 60px",
          gap: 48,
          zIndex: 10,
        }}
      >
        {/* Year badge */}
        <div
          style={{
            opacity: yearOpacity,
            transform: `translateY(${yearY}px)`,
            padding: "8px 24px",
            borderRadius: 100,
            border: "1px solid rgba(52, 211, 153, 0.3)",
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
            {fiscalYear} Budget
          </span>
        </div>

        {/* State 1 name */}
        <div
          style={{
            opacity: state1Opacity,
            transform: `translateX(${state1X}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.1,
            }}
          >
            {state1Name}
          </div>
        </div>

        {/* VS badge */}
        <div
          style={{
            transform: `scale(${vsScale})`,
            opacity: vsScale,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #059669, #34d399)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(52, 211, 153, 0.4)",
          }}
        >
          <span
            style={{
              fontSize: 40,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
            }}
          >
            VS
          </span>
        </div>

        {/* State 2 name */}
        <div
          style={{
            opacity: state2Opacity,
            transform: `translateX(${state2X}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.1,
            }}
          >
            {state2Name}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
