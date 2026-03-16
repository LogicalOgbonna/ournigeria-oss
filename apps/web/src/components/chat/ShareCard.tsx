"use client";

/**
 * Generate a branded share card image from a TL;DR summary.
 * Uses Canvas API directly — no html-to-image dependency, 100% reliable.
 */
export async function generateShareCard(
  summary: string,
): Promise<Blob | null> {
  const W = 1200;
  const H = 630;
  const PAD = 60;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background gradient (emerald)
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#064e3b");
  grad.addColorStop(0.5, "#065f46");
  grad.addColorStop(1, "#047857");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Nigerian flag accent (top-right)
  const flagX = W - PAD - 52;
  const flagY = 40;
  const barW = 16;
  const barH = 48;
  ctx.fillStyle = "#008751";
  ctx.fillRect(flagX, flagY, barW, barH);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(flagX + barW + 4, flagY, barW, barH);
  ctx.fillStyle = "#008751";
  ctx.fillRect(flagX + (barW + 4) * 2, flagY, barW, barH);

  // Logo text
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("OurNigeria", PAD, PAD + 28);

  // Parse a prominent naira figure if present
  const figureMatch = summary.match(
    /₦[\d,.]+\s*(trillion|billion|million|T|B|M)?/i,
  );
  const prominentFigure = figureMatch ? figureMatch[0] : null;

  // Strip citation markers and clean up
  const cleanSummary = summary
    .replace(/\[\d+\]/g, "")
    .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  // Word-wrap summary text
  ctx.font = "500 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const maxTextWidth = W - PAD * 2 - 40;
  const lines = wrapText(ctx, `\u201C${cleanSummary}\u201D`, maxTextWidth, 280);

  // Calculate vertical centering for the content block
  const lineHeight = 45;
  const figureHeight = prominentFigure ? 80 : 0;
  const contentHeight = lines.length * lineHeight + figureHeight;
  const contentStartY = Math.max(
    PAD + 80,
    (H - contentHeight) / 2,
  );

  // Draw summary lines
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.font = "500 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], PAD, contentStartY + i * lineHeight);
  }

  // Draw prominent figure
  if (prominentFigure) {
    ctx.fillStyle = "#6ee7b7";
    ctx.font = "800 56px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(
      prominentFigure,
      PAD,
      contentStartY + lines.length * lineHeight + 56,
    );
  }

  // Footer
  const verifyUrl = "app.ournigeria.ng";

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`Verify at ${verifyUrl}`, PAD, H - PAD);

  ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const poweredText = "Powered by OurNigeria";
  const poweredWidth = ctx.measureText(poweredText).width;
  ctx.fillText(poweredText, W - PAD - poweredWidth, H - PAD);

  // Convert canvas to blob (with fallback via toDataURL if toBlob fails)
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => resolve(blob ?? dataUrlToBlob(canvas.toDataURL("image/png"))),
        "image/png",
      );
    } catch {
      resolve(dataUrlToBlob(canvas.toDataURL("image/png")));
    }
  });
}

/** Convert a data URL to a Blob. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Word-wrap text to fit within maxWidth, with a character limit. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxChars: number,
): string[] {
  // Truncate to maxChars
  let displayText = text;
  if (text.length > maxChars + 2) {
    // +2 for quotes
    displayText =
      text.slice(0, maxChars).replace(/\s+\S*$/, "") + '...\u201D';
  }

  const words = displayText.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  const maxLines = 6;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) {
        // Add ellipsis to last line
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

/** Detect the topic from summary text for context-aware share messages. */
function detectShareContext(summary: string): { title: string; text: string } {
  const lower = summary.toLowerCase();
  if (/\b(corrupt|efcc|embezzle|loot|stolen|allege|convict|fraud|launder)\b/.test(lower)) {
    return {
      title: "OurNigeria — Corruption Tracker",
      text: "See what Nigerian officials are being investigated for on OurNigeria",
    };
  }
  if (/\b(faac|federation account|allocation.*committee|disburs)\b/.test(lower)) {
    return {
      title: "OurNigeria — FAAC Allocations",
      text: "See how federal revenue is shared across Nigerian states on OurNigeria",
    };
  }
  if (/\b(payment|contractor|beneficiar|mda|disburs|govspend)\b/.test(lower)) {
    return {
      title: "OurNigeria — Government Spending",
      text: "See how government money is being spent on OurNigeria",
    };
  }
  return {
    title: "OurNigeria — Budget Analysis",
    text: "Check out this budget insight from OurNigeria",
  };
}

/**
 * Share or download a blob image.
 * Tries Web Share API first, falls back to creating a download link.
 */
export async function shareOrDownload(
  blob: Blob,
  summary = "",
  filename = "ournigeria-summary.png",
): Promise<void> {
  const { title, text } = detectShareContext(summary);

  // Detect mobile — only use Web Share API on touch devices
  // macOS supports navigator.share but the UX is poor (share sheet behind window)
  const isMobile = typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        return;
      }
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
  }

  // Desktop fallback: download the image
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
