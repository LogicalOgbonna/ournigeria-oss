"use client";

import { useTheme } from "next-themes";

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    gridStroke: isDark ? "#334155" : "#f1f5f9",
    tickFill: isDark ? "#94a3b8" : "#94a3b8",
    tickFillStrong: isDark ? "#cbd5e1" : "#475569",
    tooltipStyle: {
      borderRadius: "12px",
      border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
      boxShadow: isDark
        ? "0 4px 12px rgba(0,0,0,0.3)"
        : "0 4px 12px rgba(0,0,0,0.08)",
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      color: isDark ? "#e2e8f0" : "#1e293b",
      fontSize: "12px",
    },
    dotBackground: isDark ? "#1e293b" : "#ffffff",
  };
}
