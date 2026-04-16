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

interface ContractEntry {
  ministry: string;
  contract: string;
  amount: string;
  year_awarded: number;
  status: string;
  statusColor: string;
}

const CONTRACTS: ContractEntry[] = [
  {
    ministry: "Federal Ministry of Works",
    contract: "East-West Road Rehabilitation",
    amount: "₦187B",
    year_awarded: 2016,
    status: "Ongoing (8yrs)",
    statusColor: "#ef4444",
  },
  {
    ministry: "Ministry of Health",
    contract: "900 Primary Health Centres",
    amount: "₦48B",
    year_awarded: 2018,
    status: "Incomplete (6yrs)",
    statusColor: "#ef4444",
  },
  {
    ministry: "UBEC",
    contract: "Classroom Construction (36 states)",
    amount: "₦24B",
    year_awarded: 2019,
    status: "62% done",
    statusColor: "#f97316",
  },
  {
    ministry: "Ministry of Power",
    contract: "Rural Electrification Phase 3",
    amount: "₦31B",
    year_awarded: 2020,
    status: "Suspended",
    statusColor: "#ef4444",
  },
  {
    ministry: "Ministry of Water",
    contract: "National Water Supply",
    amount: "₦16B",
    year_awarded: 2021,
    status: "32% done",
    statusColor: "#f97316",
  },
];

export const ContractListScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [30, 0]);

  const calloutOpacity = ci(frame, [4 * fps, 4.5 * fps], [0, 1]);
  const calloutY = ci(frame, [4 * fps, 4.5 * fps], [20, 0]);

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
      <EmeraldOrbs opacity={0.3} />

      <div
        style={{
          width: "100%",
          maxWidth: 520,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            Notable Undelivered Contracts — 2023
          </div>
        </div>

        {/* Contract cards */}
        {CONTRACTS.map((c, i) => (
          <ContractCard key={i} entry={c} index={i} frame={frame} fps={fps} />
        ))}

        {/* Bottom callout */}
        <div
          style={{
            opacity: calloutOpacity,
            transform: `translateY(${calloutY}px)`,
            marginTop: 4,
            padding: "14px 24px",
            borderRadius: 12,
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Total:{" "}
            <span
              style={{
                fontFamily: ibmPlexMono,
                color: "#ef4444",
                fontWeight: 700,
              }}
            >
              ₦306B
            </span>{" "}
            in these 5 contracts alone. Paid. Not delivered.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ContractCard: React.FC<{
  entry: ContractEntry;
  index: number;
  frame: number;
  fps: number;
}> = ({ entry, index, frame, fps }) => {
  const delay = 15 + index * 14;
  const prog = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  return (
    <div
      style={{
        opacity: prog,
        transform: `translateY(${(1 - prog) * 20}px)`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 20px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Year badge */}
      <div
        style={{
          flexShrink: 0,
          width: 52,
          height: 52,
          borderRadius: 10,
          background: "rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontFamily: ibmPlexMono,
            color: "rgba(255,255,255,0.35)",
            fontWeight: 600,
          }}
        >
          {entry.year_awarded}
        </span>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontFamily: dmSans,
            fontWeight: 600,
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 3,
          }}
        >
          {entry.ministry}
        </div>
        <div
          style={{
            fontSize: 14,
            fontFamily: dmSans,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.3,
          }}
        >
          {entry.contract}
        </div>
      </div>

      {/* Amount */}
      <div
        style={{
          flexShrink: 0,
          fontSize: 16,
          fontFamily: ibmPlexMono,
          fontWeight: 700,
          color: "#fbbf24",
        }}
      >
        {entry.amount}
      </div>

      {/* Status badge */}
      <div
        style={{
          flexShrink: 0,
          padding: "5px 12px",
          borderRadius: 100,
          background: `${entry.statusColor}18`,
          border: `1px solid ${entry.statusColor}55`,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontFamily: dmSans,
            fontWeight: 700,
            color: entry.statusColor,
          }}
        >
          {entry.status}
        </span>
      </div>
    </div>
  );
};
