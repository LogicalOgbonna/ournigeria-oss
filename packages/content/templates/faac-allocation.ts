/**
 * FAAC Allocation Template — Dark Premium 1080x1350 PNG (4:5 portrait)
 *
 * Renders a FAAC allocation infographic for a Local Government Area,
 * matching the sample at apps/socials/src/samples/faac_allocation_sample.png.
 *
 * Layout:
 * ┌──────────────────────────────────────┐
 * │                            ┌──────┐  │  y=40
 * │  Obio Akpo                 │ FAAC │  │
 * │  Had an allocation  ₦871M  └──────┘  │  y=100
 * │  December 2025                       │  y=160
 * │                                      │
 * │     ┌────────────────────────┐       │  y=260
 * │     │   LABELED PIE CHART    │       │
 * │     │   Gross statutory ₦453M│       │
 * │     │   Deduction ₦253M      │       │
 * │     │   VAT ₦392M            │       │
 * │     │   EMTL ₦136M           │       │
 * │     └────────────────────────┘       │  y=780
 * │                                      │
 * │     Rivers State                     │  y=900
 * │                                      │
 * │  ┌────────────────────────────────┐  │  y=1200
 * │  │ Our Nigeria                    │  │
 * │  │ Let build the Nigeria of our   │  │
 * │  │ dream through data             │  │
 * │  │ www.ournigeria.ng              │  │
 * │  └────────────────────────────────┘  │  y=1310
 * └──────────────────────────────────────┘
 */

import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { C, FONT, PALETTE, formatNairaShort, roundRect, drawFlag } from "./helpers.js";

export interface FaacAllocationInput {
  type: "faac-allocation";
  lgaName: string;        // "Obio Akpo"
  stateName: string;      // "Rivers"
  month: string;          // "December"
  year: number;           // 2025
  totalAllocation: number; // 871_000_000
  breakdown?: {
    grossStatutory: number;
    deduction: number;
    vat: number;
    emtl: number;
  };
}

const W = 1080;
const H = 1350;
const PAD = 56;

// Segment colors matching the sample image
const SEGMENT_COLORS = [
  "#10b981", // Gross Statutory — emerald
  "#fbbf24", // Deduction — amber/gold
  "#a78bfa", // VAT — violet
  "#f8fafc", // EMTL — white/light
];

export async function renderFaacAllocation(input: FaacAllocationInput): Promise<Buffer> {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ── Background ──
  ctx.fillStyle = "#0a1628"; // slightly darker than C.bg for portrait
  ctx.fillRect(0, 0, W, H);

  // Subtle gradient overlay at top
  const grad = ctx.createLinearGradient(0, 0, 0, 300);
  grad.addColorStop(0, "rgba(16,185,129,0.06)");
  grad.addColorStop(1, "rgba(16,185,129,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 300);

  // ── FAAC Badge (top right) ──
  drawFaacBadge(ctx, W - PAD - 120, 44);

  // ── LGA Name ──
  ctx.fillStyle = C.text;
  ctx.font = `bold 56px ${FONT}`;
  // Truncate long names
  let lgaDisplay = input.lgaName;
  if (ctx.measureText(lgaDisplay).width > W - PAD * 2 - 160) {
    ctx.font = `bold 44px ${FONT}`;
    if (ctx.measureText(lgaDisplay).width > W - PAD * 2 - 160) {
      ctx.font = `bold 36px ${FONT}`;
    }
  }
  ctx.fillText(lgaDisplay, PAD, 100);

  // ── "Had an allocation" + Total ──
  const allocY = 160;

  // Badge: "Had an allocation"
  ctx.fillStyle = C.accent;
  const badgeText = "Had an allocation";
  ctx.font = `600 22px ${FONT}`;
  const badgeW = ctx.measureText(badgeText).width + 24;
  roundRect(ctx, PAD, allocY - 24, badgeW, 36, 6);
  ctx.fillStyle = "#0a1628";
  ctx.fillText(badgeText, PAD + 12, allocY);

  // Total amount (big, bold, right of badge)
  ctx.fillStyle = C.text;
  ctx.font = `800 52px ${FONT}`;
  const totalText = formatNairaShort(input.totalAllocation);
  ctx.fillText(totalText, PAD + badgeW + 20, allocY + 6);

  // ── Month + Year ──
  ctx.fillStyle = C.textMuted;
  ctx.font = `400 24px ${FONT}`;
  ctx.fillText(`${input.month} ${input.year}`, PAD, allocY + 52);

  // ── Pie Chart or Total-Only ──
  if (input.breakdown) {
    drawLabeledPieChart(ctx, input.breakdown, input.totalAllocation);
  } else {
    // Total-only fallback — large centered amount
    drawTotalOnly(ctx, input.totalAllocation);
  }

  // ── State Name (placeholder for future map) ──
  ctx.fillStyle = C.textMuted;
  ctx.font = `italic 22px ${FONT}`;
  const stateText = `${input.stateName} State`;
  const stateW = ctx.measureText(stateText).width;
  ctx.fillText(stateText, (W - stateW) / 2, 960);

  // ── Footer Branding ──
  drawFooter(ctx);

  return canvas.toBuffer("image/png");
}

// ─── FAAC Badge ─────────────────────────────────────────────────

function drawFaacBadge(ctx: SKRSContext2D, x: number, y: number): void {
  ctx.fillStyle = C.accent;
  roundRect(ctx, x, y, 120, 42, 10);
  ctx.fillStyle = "#0a1628";
  ctx.font = `bold 24px ${FONT}`;
  const tw = ctx.measureText("FAAC").width;
  ctx.fillText("FAAC", x + (120 - tw) / 2, y + 29);
}

// ─── Labeled Pie Chart ──────────────────────────────────────────

interface Breakdown {
  grossStatutory: number;
  deduction: number;
  vat: number;
  emtl: number;
}

function drawLabeledPieChart(
  ctx: SKRSContext2D,
  breakdown: Breakdown,
  totalAllocation: number,
): void {
  const segments = [
    { label: "Gross statutory", value: breakdown.grossStatutory, color: SEGMENT_COLORS[0] },
    { label: "Deduction", value: breakdown.deduction, color: SEGMENT_COLORS[1] },
    { label: "VAT", value: breakdown.vat, color: SEGMENT_COLORS[2] },
    { label: "EMTL", value: breakdown.emtl, color: SEGMENT_COLORS[3] },
  ].filter(s => s.value > 0);

  // Group small segments (<8%) into "Other"
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const significant: typeof segments = [];
  let otherValue = 0;
  for (const seg of segments) {
    if (seg.value / total < 0.08) {
      otherValue += seg.value;
    } else {
      significant.push(seg);
    }
  }
  if (otherValue > 0) {
    significant.push({ label: "Other", value: otherValue, color: C.textDim });
  }

  const cx = W / 2;
  const cy = 560;
  const radius = 200;

  let startAngle = -Math.PI / 2;

  // Draw segments
  for (let i = 0; i < significant.length; i++) {
    const seg = significant[i];
    const sliceAngle = (seg.value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    // Segment fill
    ctx.fillStyle = seg.color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    // Segment border
    ctx.strokeStyle = "#0a1628";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.stroke();

    // Label positioned outside the segment
    const midAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius + 40;
    const lx = cx + Math.cos(midAngle) * labelRadius;
    const ly = cy + Math.sin(midAngle) * labelRadius;

    // Determine text alignment based on position
    const isRight = Math.cos(midAngle) > 0;
    ctx.textAlign = isRight ? "left" : "right";

    // Label name
    ctx.fillStyle = C.text;
    ctx.font = `600 20px ${FONT}`;
    ctx.fillText(seg.label, lx, ly - 6);

    // Label value
    ctx.fillStyle = seg.color;
    ctx.font = `bold 26px ${FONT}`;
    ctx.fillText(formatNairaShort(seg.value), lx, ly + 24);

    ctx.textAlign = "left"; // reset
    startAngle = endAngle;
  }
}

// ─── Total-Only Fallback ────────────────────────────────────────

function drawTotalOnly(ctx: SKRSContext2D, totalAllocation: number): void {
  const cy = 560;

  // Large circle background
  ctx.fillStyle = C.accent;
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.arc(W / 2, cy, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Total amount centered
  ctx.fillStyle = C.accentGlow;
  ctx.font = `800 64px ${FONT}`;
  const text = formatNairaShort(totalAllocation);
  const tw = ctx.measureText(text).width;
  ctx.fillText(text, (W - tw) / 2, cy + 10);

  // "Total Allocation" subtitle
  ctx.fillStyle = C.textMuted;
  ctx.font = `500 22px ${FONT}`;
  const sub = "Total Allocation";
  const sw = ctx.measureText(sub).width;
  ctx.fillText(sub, (W - sw) / 2, cy + 44);
}

// ─── Footer ─────────────────────────────────────────────────────

function drawFooter(ctx: SKRSContext2D): void {
  const footerY = H - 130;

  // Separator
  ctx.fillStyle = C.border;
  ctx.fillRect(PAD, footerY, W - PAD * 2, 1);

  // Logo + flag
  ctx.fillStyle = C.accent;
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillText("Our Nigeria", PAD, footerY + 44);
  const logoW = ctx.measureText("Our Nigeria").width;
  drawFlag(ctx, PAD + logoW + 14, footerY + 28);

  // Tagline
  ctx.fillStyle = C.textMuted;
  ctx.font = `400 16px ${FONT}`;
  ctx.fillText("Let build the Nigeria of our dream through data", PAD, footerY + 74);

  // URL
  ctx.fillStyle = C.textDim;
  ctx.font = `400 15px ${FONT}`;
  ctx.fillText("www.ournigeria.ng", PAD, footerY + 100);
}
