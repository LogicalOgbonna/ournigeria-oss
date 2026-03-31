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

import { createCanvas } from "@napi-rs/canvas";
import { C, FONT, drawFlag, roundRect, wrapText } from "./helpers.js";

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
