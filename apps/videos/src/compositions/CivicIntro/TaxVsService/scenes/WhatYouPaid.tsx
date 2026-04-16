import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

interface VATRow {
  item: string;
  monthly: string;
  vat: string;
  icon: string;
}

const VAT_ROWS: VATRow[] = [
  { item: "Groceries (avg family)", monthly: "₦45,000", vat: "₦675", icon: "🛒" },
  { item: "Mobile data & calls", monthly: "₦3,500", vat: "₦525", icon: "📱" },
  { item: "Transport (fuel/buses)", monthly: "₦12,000", vat: "₦1,800", icon: "🚌" },
  { item: "Electricity bill", monthly: "₦8,000", vat: "₦1,200", icon: "💡" },
  { item: "Bank charges", monthly: "₦2,500", vat: "₦375", icon: "🏦" },
  { item: "Restaurant / fast food", monthly: "₦6,000", vat: "₦900", icon: "🍔" },
];

export const WhatYouPaidScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [28, 0]);

  const totalOpacity = ci(frame, [4.2 * fps, 4.7 * fps], [0, 1]);
  const totalY = ci(frame, [4.2 * fps, 4.7 * fps], [18, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "46px 100px",
      }}
    >
      <EmeraldOrbs opacity={0.3} />

      <div
        style={{
          width: "100%",
          maxWidth: 520,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
            }}
          >
            VAT You Paid This Month{" "}
            <span
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.4)",
                fontFamily: dmSans,
                fontWeight: 400,
              }}
            >
              (Estimated)
            </span>
          </div>
        </div>

        {/* Column headers */}
        <div
          style={{
            opacity: headerOpacity,
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingBottom: 8,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ flex: 1 }} />
          <div
            style={{
              width: 110,
              textAlign: "right",
              fontSize: 11,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Monthly
          </div>
          <div
            style={{
              width: 80,
              textAlign: "right",
              fontSize: 11,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            VAT (7.5%)
          </div>
        </div>

        {/* Rows */}
        {VAT_ROWS.map((row, i) => (
          <VATRowItem key={i} entry={row} index={i} frame={frame} fps={fps} />
        ))}

        {/* Running total */}
        <div
          style={{
            opacity: totalOpacity,
            transform: `translateY(${totalY}px)`,
            marginTop: 6,
            padding: "14px 18px",
            borderRadius: 12,
            background: "rgba(251, 191, 36, 0.07)",
            border: "1px solid rgba(251, 191, 36, 0.25)",
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            <span
              style={{
                fontFamily: ibmPlexMono,
                color: "#fbbf24",
                fontWeight: 700,
                fontSize: 17,
              }}
            >
              ₦5,475
            </span>{" "}
            paid in VAT this month —{" "}
            <span
              style={{
                fontFamily: ibmPlexMono,
                color: "#fbbf24",
                fontWeight: 700,
              }}
            >
              ₦65,700/year
            </span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const VATRowItem: React.FC<{
  entry: VATRow;
  index: number;
  frame: number;
  fps: number;
}> = ({ entry, index, frame, fps }) => {
  const delay = 18 + index * 12;
  const prog = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  return (
    <div
      style={{
        opacity: prog,
        transform: `translateY(${(1 - prog) * -20}px)`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.025)",
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 20, flexShrink: 0 }}>{entry.icon}</span>

      {/* Item name */}
      <div
        style={{
          flex: 1,
          fontSize: 14,
          fontFamily: dmSans,
          fontWeight: 500,
          color: "rgba(255,255,255,0.75)",
        }}
      >
        {entry.item}
      </div>

      {/* Monthly */}
      <div
        style={{
          width: 110,
          textAlign: "right",
          fontSize: 13,
          fontFamily: ibmPlexMono,
          fontWeight: 500,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        {entry.monthly}
      </div>

      {/* VAT */}
      <div
        style={{
          width: 80,
          textAlign: "right",
          fontSize: 14,
          fontFamily: ibmPlexMono,
          fontWeight: 700,
          color: "#fbbf24",
        }}
      >
        {entry.vat}
      </div>
    </div>
  );
};
