import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci, countUp, formatNumber } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, inter, instrumentSerif } from "@/lib/fonts";

/* ─── Stat Card Grid ─── */
export const StatGrid: React.FC<{
  stats: {
    label: string;
    value: string;
    trend: "up" | "down" | "neutral";
    trendText: string;
  }[];
  animationStart?: number;
}> = ({ stats, animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(stats.length, 2)}, 1fr)`,
        gap: 10,
      }}
    >
      {stats.map((s, i) => {
        const prog = spring({
          frame: Math.max(0, frame - animationStart - i * 5),
          fps,
          config: { damping: 20, stiffness: 100 },
        });
        const y = (1 - prog) * 24;

        return (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "10px 12px",
              opacity: prog,
              transform: `translateY(${y}px)`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                fontFamily: dmSans,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#fff",
                fontFamily: ibmPlexMono,
              }}
            >
              {s.value}
            </div>
            {s.trendText && (
              <div
                style={{
                  fontSize: 11,
                  fontFamily: ibmPlexMono,
                  color:
                    s.trend === "up"
                      ? "#34d399"
                      : s.trend === "down"
                        ? "#f87171"
                        : "rgba(255,255,255,0.3)",
                  marginTop: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {s.trend === "up" ? "↑" : s.trend === "down" ? "↓" : "–"}{" "}
                {s.trendText}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── Follow-up Pills ─── */
export const FollowUpPills: React.FC<{
  items: string[];
  animationStart?: number;
  highlightIndex?: number;
}> = ({ items, animationStart = 0, highlightIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((item, i) => {
        const prog = spring({
          frame: Math.max(0, frame - animationStart - i * 4),
          fps,
          config: { damping: 18, stiffness: 100 },
        });
        const isHighlighted = highlightIndex === i;
        const glowPulse = isHighlighted
          ? 0.5 + 0.5 * Math.sin((frame / fps) * 4)
          : 0;

        return (
          <div
            key={i}
            style={{
              padding: "6px 12px",
              borderRadius: 100,
              fontSize: 12,
              fontFamily: inter,
              color: "#34d399",
              background: "rgba(52, 211, 153, 0.08)",
              border: `1px solid rgba(52, 211, 153, ${isHighlighted ? 0.4 + glowPulse * 0.3 : 0.2})`,
              opacity: prog,
              transform: `translateX(${(1 - prog) * 20}px)`,
              boxShadow: isHighlighted
                ? `0 0 ${8 + glowPulse * 8}px rgba(52, 211, 153, ${0.15 + glowPulse * 0.1})`
                : "none",
            }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
};

/* ─── AI Message Bubble ─── */
export const AIBubble: React.FC<{
  children: React.ReactNode;
  animationStart?: number;
}> = ({ children, animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart),
    fps,
    config: { damping: 25, stiffness: 60 },
  });

  return (
    <div style={{ display: "flex", gap: 10, opacity: prog }}>
      {/* AI Avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #059669, #34d399)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        ✦
      </div>
      <div
        style={{
          maxWidth: "85%",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ─── User Message Bubble ─── */
export const UserBubble: React.FC<{
  text: string;
  animationStart?: number;
}> = ({ text, animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart),
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const y = (1 - prog) * 16;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        opacity: prog,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          padding: "10px 14px",
          borderRadius: "20px 20px 6px 20px",
          background: "linear-gradient(135deg, #059669, #047857)",
          color: "white",
          fontSize: 13,
          fontFamily: inter,
          lineHeight: 1.5,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ─── Typing Indicator ─── */
export const TypingIndicator: React.FC<{
  status?: string;
}> = ({ status }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #059669, #34d399)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        ✦
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            display: "flex",
            gap: 5,
            padding: "12px 18px",
            borderRadius: "20px 20px 20px 6px",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#34d399",
                opacity: 0.4 + 0.6 * Math.sin((frame / fps) * 6 + i * 1.2),
                transform: `translateY(${Math.sin((frame / fps) * 6 + i * 1.2) * -3}px)`,
              }}
            />
          ))}
        </div>
        {status && (
          <div
            style={{
              fontSize: 11,
              color: "rgba(52, 211, 153, 0.6)",
              fontFamily: ibmPlexMono,
              paddingLeft: 4,
            }}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── State Comparison Card ─── */
export const StateComparisonCard: React.FC<{
  state1: {
    name: string;
    color: string;
    totalBudget: string;
    perCapita: string;
  };
  state2: {
    name: string;
    color: string;
    totalBudget: string;
    perCapita: string;
  };
  animationStart?: number;
}> = ({ state1, state2, animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart),
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const renderSide = (s: typeof state1) => (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div
        style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: 8,
          background: `${s.color}22`,
          color: s.color,
          fontSize: 12,
          fontFamily: dmSans,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {s.name}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#fff",
          fontFamily: ibmPlexMono,
        }}
      >
        {s.totalBudget}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          fontFamily: ibmPlexMono,
          marginTop: 4,
        }}
      >
        {s.perCapita} per capita
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        background: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 16,
        opacity: prog,
        transform: `translateY(${(1 - prog) * 20}px)`,
      }}
    >
      {renderSide(state1)}
      <div
        style={{
          width: 1,
          background: "rgba(255,255,255,0.1)",
          margin: "0 16px",
        }}
      />
      {renderSide(state2)}
    </div>
  );
};

/* ─── Sources Pill ─── */
export const SourcesPill: React.FC<{
  count: number;
  expanded?: boolean;
  animationStart?: number;
}> = ({ count, expanded = false, animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart),
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  return (
    <div style={{ opacity: prog }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          borderRadius: 100,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          fontFamily: inter,
        }}
      >
        📄 {count} sources {expanded ? "▴" : "▾"}
      </div>
      {expanded && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "rgba(52, 211, 153, 0.1)",
                  color: "#34d399",
                  fontSize: 10,
                  fontFamily: ibmPlexMono,
                }}
              >
                PDF
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: inter,
                }}
              >
                Lagos State 2024 Budget Document {i + 1}
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                ⬇
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Money Could Buy Card ─── */
export const MoneyCouldBuyCard: React.FC<{
  title: string;
  items: { icon: string; label: string; count: number; color: string }[];
  animationStart?: number;
}> = ({ title, items, animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.7)",
          fontFamily: dmSans,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        {items.map((item, i) => {
          const tileStart = animationStart + i * 8;
          const prog = spring({
            frame: Math.max(0, frame - tileStart),
            fps,
            config: { damping: 15, stiffness: 100 },
          });

          const countDuration = Math.round(fps * 0.8);
          const currentCount = countUp(
            frame,
            tileStart + 4,
            tileStart + 4 + countDuration,
            item.count,
          );

          return (
            <div
              key={i}
              style={{
                background: `${item.color}10`,
                borderRadius: 12,
                border: `1px solid ${item.color}25`,
                padding: "10px 8px",
                textAlign: "center",
                opacity: prog,
                transform: `scale(${prog})`,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: item.color,
                  fontFamily: ibmPlexMono,
                }}
              >
                {formatNumber(currentCount)}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: dmSans,
                  marginTop: 4,
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Chat Input Bar ─── */
export const ChatInputBar: React.FC<{
  text?: string;
  placeholder?: string;
  toolLabel?: string;
  sendActive?: boolean;
}> = ({
  text = "",
  placeholder = "Ask about any state budget...",
  toolLabel = "Auto",
  sendActive = false,
}) => {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Tool selector row */}
      <div style={{ display: "flex", gap: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: 8,
            background: "rgba(52, 211, 153, 0.08)",
            fontSize: 12,
            color: "#34d399",
            fontFamily: dmSans,
          }}
        >
          ✦ {toolLabel} ▾
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            fontFamily: dmSans,
          }}
        >
          🌐 English ▾
        </div>
      </div>
      {/* Input row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: text
            ? "1px solid rgba(52, 211, 153, 0.3)"
            : "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            flex: 1,
            fontSize: 12,
            fontFamily: inter,
            color: text ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
          }}
        >
          {text || placeholder}
        </div>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 10,
            background: sendActive ? "#059669" : "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: sendActive ? "#fff" : "rgba(255,255,255,0.2)",
          }}
        >
          ↑
        </div>
      </div>
    </div>
  );
};

/* ─── Tool Selector Dropdown ─── */
export const ToolDropdown: React.FC<{
  items: { label: string; icon: string }[];
  selectedIndex: number;
  open: boolean;
  animationStart?: number;
}> = ({ items, selectedIndex, open, animationStart = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!open) return null;

  const prog = spring({
    frame: Math.max(0, frame - animationStart),
    fps,
    config: { damping: 20, stiffness: 120 },
  });

  return (
    <div
      style={{
        background: "rgba(20, 25, 22, 0.98)",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.1)",
        padding: 4,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        opacity: prog,
        transform: `translateY(${(1 - prog) * -8}px)`,
      }}
    >
      {items.map((item, i) => {
        const itemProg = spring({
          frame: Math.max(0, frame - animationStart - i * 2),
          fps,
          config: { damping: 20, stiffness: 120 },
        });
        const isSelected = i === selectedIndex;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 8,
              background: isSelected
                ? "rgba(52, 211, 153, 0.12)"
                : "transparent",
              opacity: itemProg,
              fontSize: 13,
              fontFamily: dmSans,
              color: isSelected ? "#34d399" : "rgba(255,255,255,0.6)",
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Suggestion Card ─── */
export const SuggestionCard: React.FC<{
  icon: string;
  category: string;
  question: string;
  highlighted?: boolean;
  animationStart?: number;
  index?: number;
}> = ({
  icon,
  category,
  question,
  highlighted = false,
  animationStart = 0,
  index = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({
    frame: Math.max(0, frame - animationStart - index * 3),
    fps,
    config: { damping: 20, stiffness: 80 },
  });
  const glowPulse = highlighted ? 0.5 + 0.5 * Math.sin((frame / fps) * 3) : 0;

  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 16,
        background: highlighted
          ? "rgba(52, 211, 153, 0.06)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${highlighted ? `rgba(52, 211, 153, ${0.2 + glowPulse * 0.2})` : "rgba(255,255,255,0.06)"}`,
        opacity: prog,
        transform: `translateY(${(1 - prog) * 16}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: highlighted
              ? "rgba(52, 211, 153, 0.12)"
              : "rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          {icon}
        </div>
        <div
          style={{
            padding: "2px 8px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.04)",
            fontSize: 10,
            color: "rgba(255,255,255,0.4)",
            fontFamily: dmSans,
          }}
        >
          {category}
        </div>
      </div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
          fontFamily: inter,
          lineHeight: 1.4,
        }}
      >
        {question}
      </div>
    </div>
  );
};
