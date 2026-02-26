import { inter, dmSans } from "@/lib/fonts";

interface ChatWindowProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ children, style }) => {
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        width: 840,
        height: 680,
        borderRadius: 20,
        background: "rgba(10, 15, 12, 0.85)",
        border: "1px solid rgba(52, 211, 153, 0.15)",
        boxShadow:
          "0 0 80px rgba(5, 150, 105, 0.08), 0 25px 50px rgba(0, 0, 0, 0.4)",
        ...style,
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(255, 255, 255, 0.02)",
        }}
      >
        <div className="flex gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "#ff5f57" }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "#febc2e" }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "#28c840" }}
          />
        </div>
        <div
          className="flex-1 text-center"
          style={{
            fontFamily: dmSans,
            fontSize: 15,
            color: "rgba(255, 255, 255, 0.5)",
            letterSpacing: "0.05em",
          }}
        >
          awanaija.ng
        </div>
        <div className="w-14" />
      </div>

      {/* Chat body */}
      <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
        {children}
      </div>

      {/* Input bar */}
      <div
        className="px-6 py-4"
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(255, 255, 255, 0.02)",
        }}
      >
        <div
          className="rounded-xl px-5 py-3"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            fontFamily: inter,
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.3)",
          }}
        >
          Ask about any state budget...
        </div>
      </div>
    </div>
  );
};
