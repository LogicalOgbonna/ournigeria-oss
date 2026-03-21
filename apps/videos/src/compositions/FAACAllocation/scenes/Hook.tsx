import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { BigStat } from "@/components/VerticalCharts";

export const Hook: React.FC<{
  stateName: string;
  fiscalYear: number;
  totalAllocation: number;
}> = ({ stateName, fiscalYear, totalAllocation }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeOpacity = ci(frame, [0, 15], [0, 1]);
  const badgeY = ci(frame, [0, 15], [40, 0]);

  const nameOpacity = ci(frame, [15, 30], [0, 1]);
  const nameY = ci(frame, [15, 30], [30, 0]);

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
        {/* FAAC badge */}
        <div
          style={{
            opacity: badgeOpacity,
            transform: `translateY(${badgeY}px)`,
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
            Federal Allocation
          </span>
        </div>

        {/* State name */}
        <div
          style={{
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
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
            {fiscalYear} FAAC
          </div>
        </div>

        {/* Total allocation */}
        <BigStat
          value={totalAllocation}
          label="Total FAAC Allocation"
          animationStart={40}
        />
      </div>
    </AbsoluteFill>
  );
};
