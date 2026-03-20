/**
 * Data Card Template — Dark Premium 1200x630 PNG
 *
 * Design: Dark slate background, emerald accents, large bold typography.
 * Bloomberg Terminal meets Instagram infographic.
 *
 * Layout:
 * ┌────────────────────────────────────────────────┐
 * │                                                │
 * │  OurNigeria                                    │
 * │                                                │
 * │  TITLE TEXT HERE                               │
 * │  ═══════════════════                           │
 * │                                                │
 * │          ₦352.8B                               │
 * │          subtitle                              │
 * │                                                │
 * │  ┌──────────────────────────────────────────┐  │
 * │  │  "Pidgin caption text goes here and it   │  │
 * │  │   wraps nicely across multiple lines"    │  │
 * │  └──────────────────────────────────────────┘  │
 * │                                                │
 * │  ▌ app.ournigeria.ng        Verify the data   │
 * └────────────────────────────────────────────────┘
 */

import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";

export interface DataCardInput {
  type: "data-card";
  title: string;
  bigNumber: string;
  subtitle?: string;
  caption: string;
  footer?: string;
}

const W = 1200;
const H = 630;
const PAD = 48;

const C = {
  bg: "#0f172a",           // slate-900
  bgCard: "#1e293b",       // slate-800
  accent: "#10b981",       // emerald-500
  accentLight: "#6ee7b7",  // emerald-300
  accentGlow: "#34d399",   // emerald-400
  text: "#f8fafc",         // slate-50
  textMuted: "#94a3b8",    // slate-400
  textDim: "#64748b",      // slate-500
  border: "#334155",       // slate-700
  captionBg: "#1a2332",    // slightly lighter than bg
};

const FONT =
  "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export async function renderDataCard(input: DataCardInput): Promise<Buffer> {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ── Background ──
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle top accent line (emerald gradient bar)
  ctx.fillStyle = C.accent;
  ctx.fillRect(0, 0, W, 4);

  // ── Logo ──
  ctx.fillStyle = C.accent;
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText("OurNigeria", PAD, PAD + 20);

  // Small Nigerian flag next to logo
  const logoW = ctx.measureText("OurNigeria").width;
  drawFlag(ctx, PAD + logoW + 16, PAD + 7);

  // ── Title ──
  ctx.fillStyle = C.text;
  ctx.font = `bold 28px ${FONT}`;
  const titleLines = wrapText(ctx, input.title.toUpperCase(), W - PAD * 2, 2);
  let titleY = PAD + 70;
  for (const line of titleLines) {
    ctx.fillText(line, PAD, titleY);
    titleY += 36;
  }

  // Accent underline
  ctx.fillStyle = C.accent;
  ctx.fillRect(PAD, titleY + 4, 80, 3);

  // ── Big Number ──
  ctx.fillStyle = C.accentGlow;
  ctx.font = `800 72px ${FONT}`;
  const bigNumW = ctx.measureText(input.bigNumber).width;
  const bigNumX = (W - bigNumW) / 2;
  const bigNumY = titleY + 90;
  ctx.fillText(input.bigNumber, bigNumX, bigNumY);

  // Glow effect (draw again slightly offset with lower alpha)
  ctx.globalAlpha = 0.15;
  ctx.fillText(input.bigNumber, bigNumX - 1, bigNumY + 1);
  ctx.globalAlpha = 1;

  // ── Subtitle ──
  if (input.subtitle) {
    ctx.fillStyle = C.textMuted;
    ctx.font = `500 20px ${FONT}`;
    const subW = ctx.measureText(input.subtitle).width;
    ctx.fillText(input.subtitle, (W - subW) / 2, bigNumY + 32);
  }

  // ── Caption Card ──
  const captionTop = bigNumY + (input.subtitle ? 60 : 40);
  const captionPadX = 24;
  const captionPadY = 20;

  ctx.fillStyle = C.captionBg;
  roundRect(ctx, PAD, captionTop, W - PAD * 2, 120, 12);

  // Left emerald accent bar on caption card
  ctx.fillStyle = C.accent;
  roundRect(ctx, PAD, captionTop, 4, 120, 2);

  ctx.fillStyle = C.text;
  ctx.font = `400 19px ${FONT}`;
  const captionLines = wrapText(
    ctx,
    `"${input.caption}"`,
    W - PAD * 2 - captionPadX * 2 - 10,
    4,
  );
  for (let i = 0; i < captionLines.length; i++) {
    ctx.fillText(
      captionLines[i],
      PAD + captionPadX + 8,
      captionTop + captionPadY + 18 + i * 26,
    );
  }

  // ── Footer ──
  // Separator line
  ctx.fillStyle = C.border;
  ctx.fillRect(PAD, H - 52, W - PAD * 2, 1);

  // URL with accent bar
  ctx.fillStyle = C.accent;
  ctx.fillRect(PAD, H - 36, 3, 16);
  ctx.fillStyle = C.textMuted;
  ctx.font = `500 16px ${FONT}`;
  ctx.fillText(input.footer ?? "app.ournigeria.ng", PAD + 12, H - 22);

  // Right side text
  ctx.fillStyle = C.textDim;
  ctx.font = `400 14px ${FONT}`;
  const verifyText = "Verify the data";
  const verifyW = ctx.measureText(verifyText).width;
  ctx.fillText(verifyText, W - PAD - verifyW, H - 22);

  return canvas.toBuffer("image/png");
}

// ─── Helpers ─────────────────────────────────────────────────────

function drawFlag(ctx: SKRSContext2D, x: number, y: number): void {
  const bw = 8;
  const bh = 18;
  ctx.fillStyle = "#008751";
  ctx.fillRect(x, y, bw, bh);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + bw + 2, y, bw, bh);
  ctx.fillStyle = "#008751";
  ctx.fillRect(x + (bw + 2) * 2, y, bw, bh);
}

function roundRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
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
