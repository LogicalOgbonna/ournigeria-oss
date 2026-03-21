import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, formatNaira } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const Hook: React.FC<{
  stateName: string;
  fiscalYear: number;
  totalBudget: number;
}> = ({ stateName, fiscalYear, totalBudget }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0, 15], [0, 1]);
  const titleY = ci(frame, [0, 15], [60, 0]);

  const questionOpacity = ci(frame, [20, 35], [0, 1]);
  const questionY = ci(frame, [20, 35], [30, 0]);

  const budgetOpacity = ci(frame, [50, 65], [0, 1]);
  const budgetScale = spring({
    frame: Math.max(0, frame - 50),
    fps,
    config: { damping: 15, stiffness: 80 },
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
          gap: 40,
          zIndex: 10,
        }}
      >
        {/* Year badge */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
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

        {/* State name */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.1,
            }}
          >
            {stateName}
          </div>
          <div
            style={{
              fontSize: 28,
              fontFamily: dmSans,
              color: "rgba(255,255,255,0.5)",
              marginTop: 12,
              textTransform: "uppercase",
              letterSpacing: 4,
            }}
          >
            State
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            opacity: questionOpacity,
            transform: `translateY(${questionY}px)`,
            fontSize: 36,
            fontFamily: dmSans,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            fontWeight: 500,
          }}
        >
          Where does the money go?
        </div>

        {/* Total budget */}
        <div
          style={{
            opacity: budgetOpacity,
            transform: `scale(${budgetScale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              fontFamily: ibmPlexMono,
              color: "#34d399",
              textShadow: "0 0 40px rgba(52, 211, 153, 0.3)",
            }}
          >
            {formatNaira(totalBudget)}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.5)",
              fontFamily: dmSans,
              marginTop: 8,
            }}
          >
            Total Budget
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
