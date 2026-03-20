/**
 * Chart Card Template — Dark Premium 1200x630 PNG
 *
 * Design: Dark slate background, emerald bars, high contrast,
 * clean axis labels, prominent value callouts.
 *
 * Layout:
 * ┌────────────────────────────────────────────────┐
 * │                                                │
 * │  OurNigeria              TITLE                 │
 * │                                                │
 * │   ₦44B ┌────┐                      ┌────┐     │
 * │        │    │                      │    │     │
 * │   ₦33B │    │           ┌────┐     │    │     │
 * │        │    │           │    │     │    │     │
 * │        │    │    ░░░    │    │     │    │     │
 * │    ₦0  └────┘    ░░░   └────┘     └────┘     │
 * │        Label1   Label2  Label3    Label4      │
 * │                                                │
 * │  ┌ "Pidgin caption text here"                 ┐│
 * │  ▌ app.ournigeria.ng        Verify the data   │
 * └────────────────────────────────────────────────┘
 */

import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";

export interface ChartCardInput {
  type: "chart-card";
  title: string;
  chartType: "bar" | "pie" | "doughnut";
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string[];
    }>;
  };
  caption: string;
  footer?: string;
  formatNaira?: boolean;
}

const W = 1200;
const H = 630;
const PAD = 48;

const C = {
  bg: "#0f172a",
  accent: "#10b981",
  accentLight: "#6ee7b7",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  border: "#334155",
  gridLine: "rgba(148, 163, 184, 0.12)",
  captionBg: "#1a2332",
};

const FONT =
  "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// High-contrast palette for multi-dataset charts
const PALETTE = [
  "#10b981", // emerald-500
  "#6ee7b7", // emerald-300
  "#0ea5e9", // sky-500
  "#a78bfa", // violet-400
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#22d3ee", // cyan-400
  "#34d399", // emerald-400
];

const PALETTE_DIM = [
  "rgba(16,185,129,0.35)",
  "rgba(110,231,183,0.35)",
  "rgba(14,165,233,0.35)",
  "rgba(167,139,250,0.35)",
  "rgba(245,158,11,0.35)",
  "rgba(244,63,94,0.35)",
  "rgba(34,211,238,0.35)",
  "rgba(52,211,153,0.35)",
];

export async function renderChartCard(input: ChartCardInput): Promise<Buffer> {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ── Background ──
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Top accent line
  ctx.fillStyle = C.accent;
  ctx.fillRect(0, 0, W, 4);

  // ── Header ──
  ctx.fillStyle = C.accent;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText("OurNigeria", PAD, PAD + 16);

  const logoW = ctx.measureText("OurNigeria").width;
  drawFlag(ctx, PAD + logoW + 14, PAD + 3);

  ctx.fillStyle = C.text;
  ctx.font = `bold 20px ${FONT}`;
  const titleW = ctx.measureText(input.title.toUpperCase()).width;
  ctx.fillText(input.title.toUpperCase(), W - PAD - titleW, PAD + 16);

  // ── Chart ──
  const chartTop = PAD + 44;
  const chartBottom = H - 170;

  if (input.chartType === "pie" || input.chartType === "doughnut") {
    drawPieChart(ctx, input, chartTop, chartBottom - chartTop);
  } else {
    drawBarChart(ctx, input, chartTop, chartBottom - chartTop);
  }

  // ── Caption ──
  const captionTop = chartBottom + 16;
  ctx.fillStyle = C.captionBg;
  roundRect(ctx, PAD, captionTop, W - PAD * 2, 76, 8);

  ctx.fillStyle = C.accent;
  roundRect(ctx, PAD, captionTop, 4, 76, 2);

  ctx.fillStyle = C.text;
  ctx.font = `400 17px ${FONT}`;
  const captionLines = wrapText(
    ctx,
    `"${input.caption}"`,
    W - PAD * 2 - 48,
    3,
  );
  for (let i = 0; i < captionLines.length; i++) {
    ctx.fillText(captionLines[i], PAD + 20, captionTop + 24 + i * 24);
  }

  // ── Footer ──
  ctx.fillStyle = C.border;
  ctx.fillRect(PAD, H - 44, W - PAD * 2, 1);

  ctx.fillStyle = C.accent;
  ctx.fillRect(PAD, H - 30, 3, 14);
  ctx.fillStyle = C.textMuted;
  ctx.font = `500 14px ${FONT}`;
  ctx.fillText(input.footer ?? "app.ournigeria.ng", PAD + 12, H - 18);

  ctx.fillStyle = C.textDim;
  ctx.font = `400 13px ${FONT}`;
  const vt = "Verify the data";
  const vtW = ctx.measureText(vt).width;
  ctx.fillText(vt, W - PAD - vtW, H - 18);

  return canvas.toBuffer("image/png");
}

// ─── Bar Chart ───────────────────────────────────────────────────

function drawBarChart(
  ctx: SKRSContext2D,
  input: ChartCardInput,
  top: number,
  height: number,
): void {
  const labels = input.chartData.labels;
  const datasets = input.chartData.datasets;
  const chartLeft = PAD + 65;
  const chartRight = W - PAD - 10;
  const chartWidth = chartRight - chartLeft;
  const chartBottom = top + height - 28;
  const chartTop = top + (datasets.length > 1 ? 28 : 8);
  const chartHeight = chartBottom - chartTop;

  const allValues = datasets.flatMap((ds) => ds.data);
  const maxVal = Math.max(...allValues, 1);

  // Legend (if multiple datasets)
  if (datasets.length > 1) {
    let legendX = chartLeft;
    ctx.font = `500 13px ${FONT}`;
    for (let d = 0; d < datasets.length; d++) {
      // Color dot
      ctx.fillStyle = PALETTE[d % PALETTE.length];
      ctx.beginPath();
      ctx.arc(legendX + 5, top + 12, 5, 0, Math.PI * 2);
      ctx.fill();
      // Label
      ctx.fillStyle = C.textMuted;
      ctx.fillText(datasets[d].label, legendX + 16, top + 16);
      legendX += ctx.measureText(datasets[d].label).width + 36;
    }
  }

  // Grid lines + Y-axis labels
  for (let i = 0; i <= 4; i++) {
    const y = chartTop + (chartHeight * i) / 4;
    ctx.strokeStyle = C.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();

    const val = maxVal * (1 - i / 4);
    ctx.fillStyle = C.textDim;
    ctx.font = `500 12px ${FONT}`;
    const label = formatNairaShort(val);
    const labelW = ctx.measureText(label).width;
    ctx.fillText(label, chartLeft - labelW - 10, y + 4);
  }

  // Bars
  const numGroups = labels.length;
  const groupWidth = chartWidth / numGroups;
  const numBars = datasets.length;
  const gap = groupWidth * 0.2;
  const barWidth = (groupWidth - gap * 2) / numBars;
  const barRadius = 4;

  for (let g = 0; g < numGroups; g++) {
    for (let d = 0; d < numBars; d++) {
      const value = datasets[d].data[g] ?? 0;
      const barH = Math.max((value / maxVal) * chartHeight, 2);
      const x = chartLeft + g * groupWidth + gap + d * barWidth;
      const y = chartBottom - barH;

      // Bar background (ghost)
      ctx.fillStyle = PALETTE_DIM[d % PALETTE_DIM.length];
      roundRectTop(ctx, x + 1, chartTop, barWidth - 2, chartHeight, barRadius);

      // Actual bar
      ctx.fillStyle = PALETTE[d % PALETTE.length];
      roundRectTop(ctx, x + 1, y, barWidth - 2, barH, barRadius);

      // Value label on top
      ctx.fillStyle = C.text;
      ctx.font = `bold 13px ${FONT}`;
      const valText = formatNairaShort(value);
      const valW = ctx.measureText(valText).width;
      const valX = x + (barWidth - 2 - valW) / 2;
      const valY = y - 8;
      ctx.fillText(valText, valX, valY > chartTop ? valY : chartTop + 14);
    }

    // X-axis label
    ctx.fillStyle = C.textMuted;
    ctx.font = `500 13px ${FONT}`;
    const labelX = chartLeft + g * groupWidth + groupWidth / 2;
    const labelText = labels[g];
    const lW = ctx.measureText(labelText).width;
    ctx.fillText(labelText, labelX - lW / 2, chartBottom + 20);
  }
}

// ─── Pie/Doughnut Chart ──────────────────────────────────────────

function drawPieChart(
  ctx: SKRSContext2D,
  input: ChartCardInput,
  top: number,
  height: number,
): void {
  const ds = input.chartData.datasets[0];
  if (!ds) return;

  const labels = input.chartData.labels;
  const data = ds.data;
  const total = data.reduce((s, v) => s + v, 0);
  if (total === 0) return;

  const cx = W / 2 - 120;
  const cy = top + height / 2;
  const radius = Math.min(height / 2 - 10, 140);
  const innerRadius = input.chartType === "doughnut" ? radius * 0.55 : 0;

  let startAngle = -Math.PI / 2;

  for (let i = 0; i < data.length; i++) {
    const sliceAngle = (data[i] / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.beginPath();
    if (innerRadius > 0) {
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
    } else {
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
    }
    ctx.closePath();
    ctx.fill();

    startAngle = endAngle;
  }

  // Center text for doughnut
  if (input.chartType === "doughnut") {
    ctx.fillStyle = C.text;
    ctx.font = `bold 28px ${FONT}`;
    const totalText = formatNairaShort(total);
    const tw = ctx.measureText(totalText).width;
    ctx.fillText(totalText, cx - tw / 2, cy + 4);

    ctx.fillStyle = C.textDim;
    ctx.font = `400 13px ${FONT}`;
    const subText = "Total";
    const sw = ctx.measureText(subText).width;
    ctx.fillText(subText, cx - sw / 2, cy + 22);
  }

  // Legend (right side)
  const legendX = cx + radius + 60;
  let legendY = top + 20;
  ctx.font = `500 15px ${FONT}`;
  for (let i = 0; i < data.length; i++) {
    // Color dot
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.beginPath();
    ctx.arc(legendX + 6, legendY + 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Label + value
    ctx.fillStyle = C.text;
    ctx.font = `500 15px ${FONT}`;
    ctx.fillText(labels[i], legendX + 20, legendY + 7);

    ctx.fillStyle = C.textMuted;
    ctx.font = `400 13px ${FONT}`;
    const pct = ((data[i] / total) * 100).toFixed(1);
    ctx.fillText(
      `${formatNairaShort(data[i])} (${pct}%)`,
      legendX + 20,
      legendY + 26,
    );

    legendY += 44;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatNairaShort(value: number): string {
  if (value >= 1_000_000_000_000) return `₦${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value}`;
}

function drawFlag(ctx: SKRSContext2D, x: number, y: number): void {
  const bw = 7;
  const bh = 16;
  ctx.fillStyle = "#008751";
  ctx.fillRect(x, y, bw, bh);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + bw + 2, y, bw, bh);
  ctx.fillStyle = "#008751";
  ctx.fillRect(x + (bw + 2) * 2, y, bw, bh);
}

function roundRect(
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

function roundRectTop(
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

function wrapText(
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
