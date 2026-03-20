import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, formatNaira } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const Hook: React.FC<{
  officialName: string;
  amountAlleged: number;
  status: string;
}> = ({ officialName, amountAlleged, status }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeOpacity = ci(frame, [0, 12], [0, 1]);
  const nameOpacity = ci(frame, [10, 25], [0, 1]);
  const nameY = ci(frame, [10, 25], [40, 0]);
  const amountOpacity = ci(frame, [40, 55], [0, 1]);
  const amountScale = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const statusColor = status === "convicted" ? "#ef4444" : status === "ongoing" ? "#f59e0b" : "#94a3b8";

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
          padding: "80px 60px",
          gap: 40,
          zIndex: 10,
        }}
      >
        {/* Corruption badge */}
        <div
          style={{
            opacity: badgeOpacity,
            padding: "8px 24px",
            borderRadius: 100,
            border: "1px solid rgba(239, 68, 68, 0.3)",
            background: "rgba(239, 68, 68, 0.08)",
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontFamily: dmSans,
              color: "#ef4444",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 3,
            }}
          >
            🔍 Corruption Case
          </span>
        </div>

        {/* Official name */}
        <div
          style={{
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
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
            {officialName}
          </div>
        </div>

        {/* Amount */}
        <div
          style={{
            opacity: amountOpacity,
            transform: `scale(${amountScale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              fontFamily: ibmPlexMono,
              color: "#ef4444",
              textShadow: "0 0 40px rgba(239, 68, 68, 0.3)",
            }}
          >
            {formatNaira(amountAlleged)}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.5)",
              fontFamily: dmSans,
              marginTop: 8,
            }}
          >
            Alleged Amount
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            opacity: amountOpacity,
            padding: "8px 20px",
            borderRadius: 8,
            background: `${statusColor}15`,
            border: `1px solid ${statusColor}30`,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontFamily: dmSans,
              color: statusColor,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            Status: {status}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
