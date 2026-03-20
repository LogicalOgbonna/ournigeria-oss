import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, formatNaira } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

export const CaseDetails: React.FC<{
  officialName: string;
  agency: string;
  amountAlleged: number;
  status: string;
  state: string;
  details: string;
}> = ({ officialName, agency, amountAlleged, status, state, details }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0, 15], [0, 1]);

  const detailItems = [
    { label: "Official", value: officialName, icon: "👤" },
    { label: "Agency", value: agency || "N/A", icon: "🏛" },
    { label: "State", value: state || "Federal", icon: "📍" },
    { label: "Amount", value: formatNaira(amountAlleged), icon: "💰" },
    { label: "Status", value: status, icon: "⚖️" },
  ];

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.25} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: "80px 50px",
          gap: 28,
          zIndex: 10,
        }}
      >
        {/* Title */}
        <div style={{ opacity: titleOpacity }}>
          <div
            style={{
              fontSize: 32,
              fontFamily: instrumentSerif,
              color: "#fff",
            }}
          >
            Case Details
          </div>
        </div>

        {/* Detail cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" }}>
          {detailItems.map((item, i) => {
            const prog = spring({
              frame: Math.max(0, frame - 15 - i * 8),
              fps,
              config: { damping: 20, stiffness: 80 },
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "20px 24px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  opacity: prog,
                  transform: `translateX(${(1 - prog) * 30}px)`,
                }}
              >
                <div style={{ fontSize: 28 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 16,
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: dmSans,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      color: "#fff",
                      fontFamily: item.label === "Amount" ? ibmPlexMono : dmSans,
                      fontWeight: 600,
                      textTransform: item.label === "Status" ? "capitalize" : "none",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Details text */}
        {details && (
          <div
            style={{
              opacity: ci(frame, [180, 210], [0, 1]),
              fontSize: 20,
              color: "rgba(255,255,255,0.6)",
              fontFamily: dmSans,
              lineHeight: 1.5,
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              borderLeft: "3px solid rgba(239, 68, 68, 0.4)",
            }}
          >
            {details.slice(0, 200)}{details.length > 200 ? "..." : ""}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
