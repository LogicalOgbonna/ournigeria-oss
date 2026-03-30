/**
 * Shared Canvas Helpers
 *
 * Common drawing functions, color constants, and formatting utilities
 * used across all card templates (data-card, chart-card, faac-allocation).
 */

import type { SKRSContext2D } from "@napi-rs/canvas";

// ─── Color Constants ────────────────────────────────────────────

export const C = {
  bg: "#0f172a",          // slate-900
  bgCard: "#1e293b",      // slate-800
  accent: "#10b981",      // emerald-500
  accentLight: "#6ee7b7", // emerald-300
  accentGlow: "#34d399",  // emerald-400
  text: "#f8fafc",        // slate-50
  textMuted: "#94a3b8",   // slate-400
  textDim: "#64748b",     // slate-500
  border: "#334155",      // slate-700
  captionBg: "#1a2332",
  gridLine: "rgba(148, 163, 184, 0.12)",
};

export const FONT =
  "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// High-contrast palette for charts
export const PALETTE = [
  "#10b981", // emerald-500
  "#6ee7b7", // emerald-300
  "#0ea5e9", // sky-500
  "#a78bfa", // violet-400
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#22d3ee", // cyan-400
  "#34d399", // emerald-400
];

export const PALETTE_DIM = [
  "rgba(16,185,129,0.35)",
  "rgba(110,231,183,0.35)",
  "rgba(14,165,233,0.35)",
  "rgba(167,139,250,0.35)",
  "rgba(245,158,11,0.35)",
  "rgba(244,63,94,0.35)",
  "rgba(34,211,238,0.35)",
  "rgba(52,211,153,0.35)",
];

// ─── Formatting ─────────────────────────────────────────────────

export function formatNairaShort(value: number): string {
  if (value >= 1_000_000_000_000) return `₦${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value}`;
}

// ─── Drawing Helpers ────────────────────────────────────────────

export function drawFlag(ctx: SKRSContext2D, x: number, y: number, scale = 1): void {
  const bw = Math.round(8 * scale);
  const bh = Math.round(18 * scale);
  ctx.fillStyle = "#008751";
  ctx.fillRect(x, y, bw, bh);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + bw + 2, y, bw, bh);
  ctx.fillStyle = "#008751";
  ctx.fillRect(x + (bw + 2) * 2, y, bw, bh);
}

export function roundRect(
  ctx: SKRSContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

export function roundRectTop(
  ctx: SKRSContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

export function wrapText(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) {
        lines[lines.length - 1] += "...";
        return lines;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}
