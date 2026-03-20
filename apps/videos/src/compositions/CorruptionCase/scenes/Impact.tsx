import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, formatNaira, countUp, formatNumber } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { PidginCaption } from "@/components/PidginCaption";
import { topImpactItems } from "@/lib/money-equivalents";

export const Impact: React.FC<{
  amountAlleged: number;
  pidginCaption: string;
}> = ({ amountAlleged, pidginCaption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = topImpactItems(amountAlleged, 4);
  const titleOpacity = ci(frame, [0, 15], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.4} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: "80px 50px",
          gap: 32,
          zIndex: 10,
        }}
      >
        <div style={{ opacity: titleOpacity, textAlign: "center" }}>
          <div
            style={{
              fontSize: 28,
              fontFamily: dmSans,
              color: "#ef4444",
              fontWeight: 600,
            }}
          >
            This money could have built:
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            flex: 1,
            alignContent: "center",
          }}
        >
          {items.map((item, i) => {
            const tileStart = 20 + i * 10;
            const prog = spring({
              frame: Math.max(0, frame - tileStart),
              fps,
              config: { damping: 15, stiffness: 100 },
            });
            const currentCount = countUp(
              frame,
              tileStart + 5,
              tileStart + 5 + Math.round(fps * 1),
              item.count,
            );

            return (
              <div
                key={i}
                style={{
                  background: `${item.color}12`,
                  borderRadius: 20,
                  border: `1px solid ${item.color}30`,
                  padding: "28px 20px",
                  textAlign: "center",
                  opacity: prog,
                  transform: `scale(${prog})`,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>{item.icon}</div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: item.color,
                    fontFamily: ibmPlexMono,
                  }}
                >
                  {formatNumber(currentCount)}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: dmSans,
                    marginTop: 8,
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PidginCaption text={pidginCaption} animationStart={120} />
    </AbsoluteFill>
  );
};
