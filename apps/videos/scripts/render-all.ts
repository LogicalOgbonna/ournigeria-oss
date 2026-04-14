#!/usr/bin/env npx tsx
/**
 * OurNigeria Video Render Pipeline
 *
 * Renders Remotion compositions and generates platform-optimized variants:
 *   - YouTube (16:9, 1920×1080, H.264, CRF 18, AAC 256k)
 *   - Vertical / TikTok / Instagram / Shorts (9:16, 1080×1920, center-crop, CRF 20, AAC 192k)
 *
 * Usage:
 *   npx tsx scripts/render-all.ts --all                    # Render every composition
 *   npx tsx scripts/render-all.ts --comp KnowYourReps      # Single composition
 *   npx tsx scripts/render-all.ts --comp KnowYourReps --youtube-only
 *   npx tsx scripts/render-all.ts --comp KnowYourReps --vertical-only
 *   npx tsx scripts/render-all.ts --civic                   # All CivicIntro compositions
 *   npx tsx scripts/render-all.ts --list                    # List available compositions
 *   npx tsx scripts/render-all.ts --vertical-from out/youtube/KnowYourReps.mp4  # Convert existing file
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "out");
const YOUTUBE_DIR = path.join(OUT_DIR, "youtube");
const VERTICAL_DIR = path.join(OUT_DIR, "vertical");

// ─── Composition Registry ────────────────────────────────────
// Compositions that render without props (static/demo data)
// Data-driven compositions (StateBudget, CorruptionCase, etc.) require
// the generate.ts script with --recipe and database connection.

interface CompositionDef {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  /** Whether this comp needs runtime props from the database */
  requiresProps: boolean;
  group: "standalone" | "civic" | "data-driven";
}

const COMPOSITIONS: CompositionDef[] = [
  // Standalone 16:9
  { id: "ProductDemo", width: 1920, height: 1080, fps: 30, durationInFrames: 750, requiresProps: false, group: "standalone" },
  { id: "BudgetOverview", width: 1920, height: 1080, fps: 30, durationInFrames: 150, requiresProps: false, group: "standalone" },

  // Civic Intro 16:9
  { id: "KnowYourReps", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "CommunityPower", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "ProposeAndVerify", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "LeaderboardChallenge", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "JoinTheMovement", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "HealthCareDivide", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "LGAMoney", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "NairaFall", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "ContractTracker", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "FiveFacts", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "TaxVsService", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "DebtClock", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "GovernorReport", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "RepAbsenteeism", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },
  { id: "OilMoneyGone", width: 1920, height: 1080, fps: 30, durationInFrames: 690, requiresProps: false, group: "civic" },

  // Data-driven (require props via generate.ts)
  { id: "StateBudget", width: 1080, height: 1920, fps: 30, durationInFrames: 900, requiresProps: true, group: "data-driven" },
  { id: "CorruptionCase", width: 1080, height: 1920, fps: 30, durationInFrames: 900, requiresProps: true, group: "data-driven" },
  { id: "StateComparison", width: 1080, height: 1920, fps: 30, durationInFrames: 1050, requiresProps: true, group: "data-driven" },
  { id: "FAACAllocation", width: 1080, height: 1920, fps: 30, durationInFrames: 900, requiresProps: true, group: "data-driven" },
  { id: "MoneyCouldBuy", width: 1080, height: 1920, fps: 30, durationInFrames: 750, requiresProps: true, group: "data-driven" },
];

// ─── CLI Parsing ──────────────────────────────────────────────

const args = process.argv.slice(2);
const hasFlag = (f: string) => args.includes(`--${f}`);
const getArg = (f: string): string | undefined => {
  const idx = args.indexOf(`--${f}`);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
};

// ─── FFmpeg Vertical Conversion ───────────────────────────────

function convertToVertical(inputPath: string, outputPath: string): void {
  /**
   * Height-fill center-crop: scale 16:9 to fill 1920px height,
   * then crop center 1080px width.
   *
   * Input:  1920×1080 (16:9)
   * Step 1: scale to ?×1920 → 3413×1920
   * Step 2: crop center 1080×1920
   * Result: 1080×1920 (9:16) with content ~3.2× larger
   */
  const cmd = [
    "ffmpeg -y",
    `-i "${inputPath}"`,
    `-vf "scale=-2:1920,crop=1080:1920"`,
    "-c:v libx264 -preset slow -crf 20",
    `-c:a aac -b:a 192k`,
    `-r 30`,
    `-movflags +faststart`,
    `"${outputPath}"`,
  ].join(" ");

  execSync(cmd, { cwd: ROOT, stdio: "pipe" });
}

// ─── Render Functions ─────────────────────────────────────────

function renderComposition(comp: CompositionDef, outputPath: string): void {
  const cmd = [
    "npx remotion render",
    comp.id,
    `"${outputPath}"`,
    "--codec h264",
    "--crf 18",
    "--audio-bitrate 256K",
  ].join(" ");

  execSync(cmd, { cwd: ROOT, stdio: "inherit", timeout: 600_000 });
}

function renderYouTube(comp: CompositionDef): string {
  const outPath = path.join(YOUTUBE_DIR, `${comp.id}.mp4`);
  console.log(`\n🎬 Rendering YouTube: ${comp.id} (${comp.durationInFrames} frames, ${(comp.durationInFrames / comp.fps).toFixed(1)}s)`);

  const start = Date.now();
  renderComposition(comp, outPath);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`   Done: ${outPath} (${elapsed}s)`);
  return outPath;
}

function renderVertical(comp: CompositionDef, youtubeFile: string): string {
  const outPath = path.join(VERTICAL_DIR, `${comp.id}-vertical.mp4`);
  console.log(`\n📱 Converting to vertical: ${comp.id}`);

  const start = Date.now();
  convertToVertical(youtubeFile, outPath);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`   Done: ${outPath} (${elapsed}s)`);
  return outPath;
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  // List mode
  if (hasFlag("list")) {
    console.log("\nAvailable compositions:\n");
    console.log("  STANDALONE (no props required):");
    for (const c of COMPOSITIONS.filter((c) => c.group === "standalone")) {
      console.log(`    ${c.id.padEnd(24)} ${c.width}×${c.height}  ${(c.durationInFrames / c.fps).toFixed(1)}s`);
    }
    console.log("\n  CIVIC INTRO (no props required):");
    for (const c of COMPOSITIONS.filter((c) => c.group === "civic")) {
      console.log(`    ${c.id.padEnd(24)} ${c.width}×${c.height}  ${(c.durationInFrames / c.fps).toFixed(1)}s`);
    }
    console.log("\n  DATA-DRIVEN (use generate.ts with --recipe):");
    for (const c of COMPOSITIONS.filter((c) => c.group === "data-driven")) {
      console.log(`    ${c.id.padEnd(24)} ${c.width}×${c.height}  ${(c.durationInFrames / c.fps).toFixed(1)}s`);
    }
    return;
  }

  // Convert an existing file to vertical
  const verticalFrom = getArg("vertical-from");
  if (verticalFrom) {
    const absPath = path.resolve(verticalFrom);
    if (!fs.existsSync(absPath)) {
      console.error(`File not found: ${absPath}`);
      process.exit(1);
    }
    const basename = path.basename(absPath, ".mp4");
    fs.mkdirSync(VERTICAL_DIR, { recursive: true });
    const outPath = path.join(VERTICAL_DIR, `${basename}-vertical.mp4`);
    console.log(`\n📱 Converting to vertical: ${absPath}`);
    convertToVertical(absPath, outPath);
    console.log(`   Done: ${outPath}`);
    return;
  }

  // Determine which compositions to render
  let targets: CompositionDef[];

  if (hasFlag("all")) {
    targets = COMPOSITIONS.filter((c) => !c.requiresProps);
  } else if (hasFlag("civic")) {
    targets = COMPOSITIONS.filter((c) => c.group === "civic");
  } else if (getArg("comp")) {
    const compId = getArg("comp")!;
    const found = COMPOSITIONS.find((c) => c.id === compId);
    if (!found) {
      console.error(`Unknown composition: ${compId}. Use --list to see available.`);
      process.exit(1);
    }
    if (found.requiresProps) {
      console.error(`${compId} requires props. Use scripts/generate.ts instead.`);
      process.exit(1);
    }
    targets = [found];
  } else {
    console.error("Specify --all, --civic, --comp <id>, or --vertical-from <file>. Use --list to see available.");
    process.exit(1);
  }

  const youtubeOnly = hasFlag("youtube-only");
  const verticalOnly = hasFlag("vertical-only");

  // Ensure output directories
  if (!verticalOnly) fs.mkdirSync(YOUTUBE_DIR, { recursive: true });
  if (!youtubeOnly) fs.mkdirSync(VERTICAL_DIR, { recursive: true });

  // Verify FFmpeg is available (needed for vertical conversion)
  if (!youtubeOnly) {
    try {
      execSync("ffmpeg -version", { stdio: "pipe" });
    } catch {
      console.error("FFmpeg not found. Install it to generate vertical variants.");
      process.exit(1);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  OurNigeria Video Render Pipeline`);
  console.log(`  Targets: ${targets.length} composition(s)`);
  console.log(`  Formats: ${youtubeOnly ? "YouTube only" : verticalOnly ? "Vertical only" : "YouTube + Vertical"}`);
  console.log(`${"=".repeat(60)}`);

  const results: { id: string; youtube?: string; vertical?: string; error?: string }[] = [];
  const totalStart = Date.now();

  for (const comp of targets) {
    try {
      let ytFile: string;

      if (verticalOnly) {
        // Check if YouTube version already exists
        ytFile = path.join(YOUTUBE_DIR, `${comp.id}.mp4`);
        if (!fs.existsSync(ytFile)) {
          console.log(`\n   YouTube file not found for ${comp.id}, rendering first...`);
          fs.mkdirSync(YOUTUBE_DIR, { recursive: true });
          ytFile = renderYouTube(comp);
        }
      } else {
        ytFile = renderYouTube(comp);
      }

      let vertFile: string | undefined;
      if (!youtubeOnly && comp.width === 1920 && comp.height === 1080) {
        vertFile = renderVertical(comp, ytFile);
      }

      results.push({ id: comp.id, youtube: youtubeOnly ? undefined : ytFile, vertical: vertFile });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n   FAILED: ${comp.id} — ${msg}`);
      results.push({ id: comp.id, error: msg });
    }
  }

  // Summary
  const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);
  const succeeded = results.filter((r) => !r.error).length;
  const failed = results.filter((r) => r.error).length;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  RENDER COMPLETE`);
  console.log(`  ${succeeded} succeeded, ${failed} failed, ${totalElapsed}s total`);
  console.log(`${"=".repeat(60)}`);

  for (const r of results) {
    if (r.error) {
      console.log(`  [FAIL] ${r.id}: ${r.error.slice(0, 80)}`);
    } else {
      if (r.youtube) console.log(`  [YT]  ${r.youtube}`);
      if (r.vertical) console.log(`  [9:16] ${r.vertical}`);
    }
  }

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
