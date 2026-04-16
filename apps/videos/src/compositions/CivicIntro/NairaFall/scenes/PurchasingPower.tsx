import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const ITEMS = [
  { item: "Rice (1kg)", price2015: "₦220", price2024: "₦1,100", change: "+400%", icon: "🍚" },
  { item: "Petrol (1 litre)", price2015: "₦87", price2024: "₦650", change: "+647%", icon: "⛽" },
  { item: "Bread (standard loaf)", price2015: "₦150", price2024: "₦800", change: "+433%", icon: "🍞" },
  { item: "Bus fare (Lagos)", price2015: "₦50", price2024: "₦400", change: "+700%", icon: "🚌" },
  { item: "Mobile data (1GB)", price2015: "₦350", price2024: "₦1,200", change: "+243%", icon: "📱" },
];

export const PurchasingPowerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [30, 0]);

  const rowSpring = (i: number) =>
    spring({
      frame: Math.max(0, frame - 20 - i * 12),
      fps,
      config: { damping: 18, stiffness: 90 },
    });

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px 80px",
      }}
    >
      <EmeraldOrbs opacity={0.25} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.25,
            }}
          >
            What ₦1,000 Could Buy: 2015 vs 2024
          </div>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingBottom: 8,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ width: 40, flexShrink: 0 }} />
          <div
            style={{
              flex: 1,
              fontSize: 11,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Item
          </div>
          <div
            style={{
              width: 110,
              textAlign: "right",
              fontSize: 11,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "#34d399",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              flexShrink: 0,
            }}
          >
            2015
          </div>
          <div
            style={{
              width: 110,
              textAlign: "right",
              fontSize: 11,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "#ef4444",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              flexShrink: 0,
            }}
          >
            2024
          </div>
          <div
            style={{
              width: 90,
              textAlign: "right",
              fontSize: 11,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              flexShrink: 0,
            }}
          >
            Change
          </div>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ITEMS.map((row, i) => {
            const prog = rowSpring(i);
            return (
              <div
                key={row.item}
                style={{
                  opacity: prog,
                  transform: `translateY(${(1 - prog) * -28}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {/* Icon */}
                <div style={{ width: 40, fontSize: 28, textAlign: "center", flexShrink: 0 }}>
                  {row.icon}
                </div>

                {/* Item name */}
                <div
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontFamily: dmSans,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {row.item}
                </div>

                {/* 2015 price */}
                <div
                  style={{
                    width: 110,
                    textAlign: "right",
                    fontSize: 16,
                    fontFamily: ibmPlexMono,
                    fontWeight: 600,
                    color: "#34d399",
                    flexShrink: 0,
                  }}
                >
                  {row.price2015}
                </div>

                {/* 2024 price */}
                <div
                  style={{
                    width: 110,
                    textAlign: "right",
                    fontSize: 16,
                    fontFamily: ibmPlexMono,
                    fontWeight: 600,
                    color: "#ef4444",
                    flexShrink: 0,
                  }}
                >
                  {row.price2024}
                </div>

                {/* Change badge */}
                <div
                  style={{
                    width: 90,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 100,
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      fontSize: 13,
                      fontFamily: ibmPlexMono,
                      fontWeight: 700,
                      color: "#ef4444",
                    }}
                  >
                    {row.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
