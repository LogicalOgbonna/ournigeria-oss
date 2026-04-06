import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, countUp, formatNumber } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";

/* ─── Official Card (mock of the real civic OfficialCard) ─── */
export const OfficialCard: React.FC<{
  name?: string;
  role: string;
  state?: string;
  known: boolean;
  animationStart?: number;
  index?: number;
  highlight?: boolean;
}> = ({
  name,
  role,
  state,
  known,
  animationStart = 0,
  index = 0,
  highlight = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart - index * 5),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const glowPulse = highlight ? 0.5 + 0.5 * Math.sin((frame / fps) * 3) : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderRadius: 16,
        background: known
          ? "rgba(52, 211, 153, 0.06)"
          : "rgba(255,255,255,0.03)",
        border: highlight
          ? `1px solid rgba(52, 211, 153, ${0.3 + glowPulse * 0.2})`
          : known
            ? "1px solid rgba(52, 211, 153, 0.15)"
            : "1px solid rgba(255,255,255,0.06)",
        opacity: prog,
        transform: `translateY(${(1 - prog) * 16}px)`,
        boxShadow: highlight
          ? `0 0 ${12 + glowPulse * 8}px rgba(52, 211, 153, ${0.1 + glowPulse * 0.08})`
          : "none",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: known
            ? "linear-gradient(135deg, #059669, #34d399)"
            : "rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {known ? "👤" : "?"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: known ? "#fff" : "rgba(255,255,255,0.3)",
            fontFamily: dmSans,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {known ? name : "Unknown — Help identify"}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            fontFamily: dmSans,
            marginTop: 2,
          }}
        >
          {role}
          {state ? ` · ${state}` : ""}
        </div>
      </div>
      {!known && (
        <div
          style={{
            padding: "6px 12px",
            borderRadius: 100,
            background: "rgba(52, 211, 153, 0.1)",
            border: "1px solid rgba(52, 211, 153, 0.2)",
            fontSize: 11,
            color: "#34d399",
            fontFamily: dmSans,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          Propose
        </div>
      )}
    </div>
  );
};

/* ─── Vote Buttons (upvote/downvote mock) ─── */
export const VoteButtons: React.FC<{
  upvotes: number;
  downvotes: number;
  animationStart?: number;
  showAction?: "up" | "down" | null;
}> = ({ upvotes, downvotes, animationStart = 0, showAction = null }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart),
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const actionFrame = animationStart + 20;
  const actionProg = spring({
    frame: Math.max(0, frame - actionFrame),
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const upActive = showAction === "up" && frame >= actionFrame;
  const downActive = showAction === "down" && frame >= actionFrame;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        opacity: prog,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 100,
          background: upActive
            ? "rgba(52, 211, 153, 0.15)"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${upActive ? "rgba(52, 211, 153, 0.3)" : "rgba(255,255,255,0.08)"}`,
          transform: upActive ? `scale(${1 + (actionProg - 1) * 0.05})` : "none",
        }}
      >
        <span style={{ fontSize: 18 }}>👍</span>
        <span
          style={{
            fontSize: 14,
            fontFamily: ibmPlexMono,
            fontWeight: 600,
            color: upActive ? "#34d399" : "rgba(255,255,255,0.5)",
          }}
        >
          {upActive ? upvotes + 1 : upvotes}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 100,
          background: downActive
            ? "rgba(239, 68, 68, 0.15)"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${downActive ? "rgba(239, 68, 68, 0.3)" : "rgba(255,255,255,0.08)"}`,
          transform: downActive
            ? `scale(${1 + (actionProg - 1) * 0.05})`
            : "none",
        }}
      >
        <span style={{ fontSize: 18 }}>👎</span>
        <span
          style={{
            fontSize: 14,
            fontFamily: ibmPlexMono,
            fontWeight: 600,
            color: downActive ? "#ef4444" : "rgba(255,255,255,0.5)",
          }}
        >
          {downActive ? downvotes + 1 : downvotes}
        </span>
      </div>
    </div>
  );
};

/* ─── Completeness Bar (state leaderboard) ─── */
export const CompletenessBar: React.FC<{
  stateName: string;
  percentage: number;
  rank: number;
  animationStart?: number;
  highlight?: boolean;
}> = ({ stateName, percentage, rank, animationStart = 0, highlight = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart - rank * 3),
    fps,
    config: { damping: 18, stiffness: 80 },
  });

  const barWidth = ci(
    frame,
    [animationStart + rank * 3 + 5, animationStart + rank * 3 + 25],
    [0, percentage],
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: prog,
        transform: `translateX(${(1 - prog) * 20}px)`,
      }}
    >
      <span
        style={{
          width: 28,
          textAlign: "right",
          fontSize: 14,
          fontFamily: ibmPlexMono,
          color: "rgba(255,255,255,0.3)",
        }}
      >
        {rank}
      </span>
      <span
        style={{
          width: 100,
          fontSize: 14,
          fontFamily: dmSans,
          fontWeight: highlight ? 700 : 500,
          color: highlight ? "#34d399" : "rgba(255,255,255,0.7)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {stateName}
      </span>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 100,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: "100%",
            borderRadius: 100,
            background: highlight
              ? "linear-gradient(90deg, #059669, #34d399)"
              : "rgba(52, 211, 153, 0.5)",
          }}
        />
      </div>
      <span
        style={{
          width: 40,
          textAlign: "right",
          fontSize: 13,
          fontFamily: ibmPlexMono,
          fontWeight: 600,
          color: highlight ? "#34d399" : "rgba(255,255,255,0.5)",
        }}
      >
        {Math.round(barWidth)}%
      </span>
    </div>
  );
};

/* ─── Activity Item ─── */
export const ActivityItem: React.FC<{
  emoji: string;
  text: string;
  time: string;
  animationStart?: number;
  index?: number;
}> = ({ emoji, text, time, animationStart = 0, index = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart - index * 6),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        opacity: prog,
        transform: `translateX(${(1 - prog) * 24}px)`,
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</span>
      <span
        style={{
          flex: 1,
          fontSize: 13,
          color: "rgba(255,255,255,0.7)",
          fontFamily: dmSans,
          lineHeight: 1.4,
        }}
      >
        {text}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.3)",
          fontFamily: ibmPlexMono,
          flexShrink: 0,
        }}
      >
        {time}
      </span>
    </div>
  );
};

/* ─── Big Stat with glow ─── */
export const BigStat: React.FC<{
  value: number;
  suffix?: string;
  label: string;
  animationStart?: number;
  color?: string;
}> = ({ value, suffix = "", label, animationStart = 0, color = "#34d399" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart),
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const current = countUp(
    frame,
    animationStart,
    animationStart + Math.round(fps * 1.2),
    value,
  );

  return (
    <div
      style={{
        textAlign: "center",
        opacity: prog,
        transform: `scale(${0.8 + prog * 0.2})`,
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontFamily: ibmPlexMono,
          fontWeight: 700,
          color,
          textShadow: `0 0 40px ${color}44`,
          lineHeight: 1,
        }}
      >
        {formatNumber(current)}
        {suffix}
      </div>
      <div
        style={{
          fontSize: 20,
          color: "rgba(255,255,255,0.5)",
          fontFamily: dmSans,
          marginTop: 12,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/* ─── Section Title ─── */
export const SectionTitle: React.FC<{
  line1: string;
  line2?: string;
  animationStart?: number;
  fontSize?: number;
}> = ({ line1, line2, animationStart = 0, fontSize = 56 }) => {
  const frame = useCurrentFrame();
  const line1Opacity = ci(frame, [animationStart, animationStart + 15], [0, 1]);
  const line1Y = ci(frame, [animationStart, animationStart + 15], [40, 0]);
  const line2Opacity = ci(
    frame,
    [animationStart + 8, animationStart + 23],
    [0, 1],
  );
  const line2Y = ci(frame, [animationStart + 8, animationStart + 23], [30, 0]);

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize,
          fontFamily: instrumentSerif,
          fontWeight: 400,
          color: "#fff",
          lineHeight: 1.2,
          opacity: line1Opacity,
          transform: `translateY(${line1Y}px)`,
        }}
      >
        {line1}
      </div>
      {line2 && (
        <div
          style={{
            fontSize,
            fontFamily: instrumentSerif,
            fontWeight: 400,
            lineHeight: 1.2,
            background: "linear-gradient(135deg, #34d399, #059669)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
          }}
        >
          {line2}
        </div>
      )}
    </div>
  );
};

/* ─── Desktop Rep Card (matches real OfficialCard desktop layout) ─── */

const PARTY_COLORS: Record<string, string> = {
  APC: "#059669",
  PDP: "#ef4444",
  LP: "#0891b2",
  NNPP: "#d97706",
  APGA: "#65a30d",
  YPP: "#7c3aed",
  SDP: "#e11d48",
  ADC: "#0284c7",
};

export interface RepData {
  name: string;
  role: string;
  roleLabel: string;
  party: string;
  constituency?: string;
  imageUrl?: string;
  completeness: number;
}

export const RepCard: React.FC<{
  rep: RepData;
  animationStart?: number;
  index?: number;
}> = ({ rep, animationStart = 0, index = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart - index * 4),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const partyColor = PARTY_COLORS[rep.party] || "#94a3b8";
  const completenessWidth = ci(
    frame,
    [animationStart + index * 4 + 10, animationStart + index * 4 + 25],
    [0, rep.completeness * 100],
  );

  const circumference = 2 * Math.PI * 7;
  const strokeOffset = circumference - (completenessWidth / 100) * circumference;

  return (
    <div
      style={{
        display: "flex",
        overflow: "hidden",
        borderRadius: 12,
        background: "rgba(15, 23, 42, 0.8)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderLeft: `4px solid ${partyColor}`,
        opacity: prog,
        transform: `translateY(${(1 - prog) * 20}px)`,
      }}
    >
      {/* Photo */}
      <div
        style={{
          width: 80,
          minHeight: 80,
          flexShrink: 0,
          background: rep.imageUrl ? undefined : "rgba(100,116,139,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {rep.imageUrl ? (
          <img
            src={rep.imageUrl}
            alt={rep.name}
            style={{ width: 80, height: "100%", objectFit: "cover" }}
          />
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "12px 16px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              fontFamily: dmSans,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {rep.name}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 100,
              background: partyColor,
              color: "#fff",
              fontFamily: dmSans,
              flexShrink: 0,
            }}
          >
            {rep.party}
          </span>
        </div>

        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            fontFamily: dmSans,
            marginTop: 3,
          }}
        >
          {rep.roleLabel}
          {rep.constituency && (
            <span style={{ color: "rgba(255,255,255,0.35)" }}>
              {" · "}
              {rep.constituency}
            </span>
          )}
        </div>

        {/* Completeness ring */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <svg width="16" height="16" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="7" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            <circle
              cx="9"
              cy="9"
              r="7"
              fill="none"
              stroke="#059669"
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              transform="rotate(-90 9 9)"
            />
          </svg>
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              fontFamily: ibmPlexMono,
            }}
          >
            {Math.round(completenessWidth)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export const UnknownRepCard: React.FC<{
  roleLabel: string;
  location?: string;
  animationStart?: number;
  index?: number;
}> = ({ roleLabel, location, animationStart = 0, index = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart - index * 4),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const glowPulse = 0.5 + 0.5 * Math.sin((frame / fps) * 2.5);

  return (
    <div
      style={{
        display: "flex",
        overflow: "hidden",
        borderRadius: 12,
        border: `2px dashed rgba(52, 211, 153, ${0.25 + glowPulse * 0.15})`,
        background: "rgba(5, 150, 105, 0.04)",
        opacity: prog,
        transform: `translateY(${(1 - prog) * 20}px)`,
      }}
    >
      {/* Photo placeholder */}
      <div
        style={{
          width: 80,
          minHeight: 72,
          flexShrink: 0,
          background: "rgba(100,116,139,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "12px 16px" }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            fontFamily: dmSans,
          }}
        >
          {roleLabel}
        </div>
        {location && (
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              fontFamily: dmSans,
              marginTop: 2,
            }}
          >
            {location}
          </div>
        )}
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            fontFamily: dmSans,
            marginTop: 2,
          }}
        >
          Position unidentified
        </div>
        <span
          style={{
            display: "inline-block",
            marginTop: 6,
            fontSize: 13,
            fontWeight: 600,
            color: "#34d399",
            fontFamily: dmSans,
          }}
        >
          Help identify this person →
        </span>
      </div>
    </div>
  );
};

/* ─── Proposal Card (mock) ─── */
export const ProposalCard: React.FC<{
  officialName: string;
  field: string;
  proposedValue: string;
  proposedBy: string;
  animationStart?: number;
}> = ({ officialName, field, proposedValue, proposedBy, animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart),
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 16,
        background: "rgba(52, 211, 153, 0.04)",
        border: "1px solid rgba(52, 211, 153, 0.15)",
        opacity: prog,
        transform: `translateY(${(1 - prog) * 20}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            padding: "3px 10px",
            borderRadius: 100,
            background: "rgba(52, 211, 153, 0.12)",
            fontSize: 11,
            color: "#34d399",
            fontFamily: ibmPlexMono,
            fontWeight: 600,
          }}
        >
          PROPOSAL
        </div>
        <span
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            fontFamily: dmSans,
          }}
        >
          by {proposedBy}
        </span>
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#fff",
          fontFamily: dmSans,
          marginBottom: 6,
        }}
      >
        {officialName}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.5)",
          fontFamily: dmSans,
        }}
      >
        {field}: <span style={{ color: "#34d399" }}>{proposedValue}</span>
      </div>
    </div>
  );
};
