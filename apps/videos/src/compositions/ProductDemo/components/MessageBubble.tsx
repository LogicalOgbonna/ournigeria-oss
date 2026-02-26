import { inter, ibmPlexMono } from "@/lib/fonts";

interface MessageBubbleProps {
  type: "user" | "ai";
  children: React.ReactNode;
  opacity?: number;
  style?: React.CSSProperties;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  type,
  children,
  opacity = 1,
  style,
}) => {
  const isUser = type === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
      style={{ opacity, ...style }}
    >
      {!isUser && (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0"
          style={{ background: "rgba(52, 211, 153, 0.15)" }}
        >
          <span style={{ fontSize: 18 }}>✦</span>
        </div>
      )}
      <div
        className={`rounded-2xl px-5 py-3.5 ${isUser ? "max-w-[70%]" : "max-w-[80%]"}`}
        style={{
          fontFamily: isUser ? inter : inter,
          background: isUser
            ? "linear-gradient(135deg, #059669, #34d399)"
            : "rgba(255, 255, 255, 0.06)",
          color: isUser ? "#ffffff" : "rgba(255, 255, 255, 0.9)",
          fontSize: isUser ? 22 : 20,
          lineHeight: 1.5,
          border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const StatHighlight: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <span
    style={{
      color: "#34d399",
      fontWeight: 700,
      fontSize: 26,
      fontFamily: ibmPlexMono,
    }}
  >
    {children}
  </span>
);

export const SourceCitation: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.4)",
      fontFamily: ibmPlexMono,
      marginTop: 12,
    }}
  >
    {children}
  </div>
);
