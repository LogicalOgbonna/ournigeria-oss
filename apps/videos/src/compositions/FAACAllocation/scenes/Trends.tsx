import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, formatNaira } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { PidginCaption } from "@/components/PidginCaption";

export const Trends: React.FC<{
  stateName: string;
  monthlyData: { month: string; amount: number }[];
  pidginCaption: string;
}> = ({ stateName, monthlyData, pidginCaption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0, 15], [0, 1]);
  const titleY = ci(frame, [0, 15], [30, 0]);

  // Find highest and lowest months
  const sorted = [...monthlyData].sort((a, b) => b.amount - a.amount);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  const highScale = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const lowScale = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.4} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 50px",
          gap: 48,
          zIndex: 10,
        }}
      >
        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontFamily: instrumentSerif,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            Key Insights
          </div>
          <div
            style={{
              fontSize: 22,
              fontFamily: dmSans,
              color: "rgba(255,255,255,0.5)",
              marginTop: 8,
            }}
          >
            {stateName} FAAC Allocation
          </div>
        </div>

        {/* Highest month */}
        <div
          style={{
            opacity: highScale,
            transform: `scale(${highScale})`,
            padding: "28px 40px",
            borderRadius: 24,
            background: "rgba(52, 211, 153, 0.08)",
            border: "2px solid rgba(52, 211, 153, 0.3)",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontFamily: dmSans,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 8,
            }}
          >
            Highest Month
          </div>
          <div
            style={{
              fontSize: 32,
              fontFamily: instrumentSerif,
              color: "#fff",
              marginBottom: 8,
            }}
          >
            {highest.month}
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              fontFamily: ibmPlexMono,
              color: "#34d399",
              textShadow: "0 0 40px rgba(52, 211, 153, 0.3)",
            }}
          >
            {formatNaira(highest.amount)}
          </div>
        </div>

        {/* Lowest month */}
        <div
          style={{
            opacity: lowScale,
            transform: `scale(${lowScale})`,
            padding: "28px 40px",
            borderRadius: 24,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontFamily: dmSans,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 8,
            }}
          >
            Lowest Month
          </div>
          <div
            style={{
              fontSize: 32,
              fontFamily: instrumentSerif,
              color: "#fff",
              marginBottom: 8,
            }}
          >
            {lowest.month}
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              fontFamily: ibmPlexMono,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {formatNaira(lowest.amount)}
          </div>
        </div>
      </div>

      {/* Pidgin caption */}
      <PidginCaption text={pidginCaption} animationStart={100} />
    </AbsoluteFill>
  );
};
