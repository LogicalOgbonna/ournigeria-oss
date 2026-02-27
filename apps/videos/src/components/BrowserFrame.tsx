import React from "react";
import { dmSans } from "@/lib/fonts";

/** macOS-style browser window chrome */
export const BrowserFrame: React.FC<{
  url: string;
  children: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> = ({ url, children, width = 1400, height = 820, style }) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: "hidden",
        background: "rgba(10, 15, 12, 0.92)",
        border: "1px solid rgba(52, 211, 153, 0.12)",
        boxShadow:
          "0 0 80px rgba(5,150,105,0.06), 0 25px 50px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: 44,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 7 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ff5f57" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#febc2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#28c840" }} />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 6,
              padding: "4px 16px",
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              fontFamily: dmSans,
            }}
          >
            {url}
          </div>
        </div>
        <div style={{ width: 52 }} />
      </div>
      {/* Content area */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
    </div>
  );
};
