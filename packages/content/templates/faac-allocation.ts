/**
 * FAAC Allocation Template — SVG Template-based rendering → 1080x1920 PNG
 *
 * Reads the Figma-exported SVG template, replaces dynamic content by element ID,
 * recomputes pie chart slice paths from data, then renders to PNG via resvg.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Resvg } from "@resvg/resvg-js";
import { formatNairaShort } from "./helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface FaacAllocationInput {
  type: "faac-allocation";
  lgaName: string;
  stateName: string;
  month: string;
  year: number;
  totalAllocation: number;
  breakdown?: {
    grossStatutory: number;
    deduction: number;
    vat: number;
    emtl: number;
    [key: string]: number;
  };
}

// ── Pie chart geometry (extracted from template) ──
const PIE_CX = 632;
const PIE_CY = 961;
const PIE_OUTER_R = 402;
const PIE_INNER_R = 103;

// Segment colors — high contrast, distinguishable at small sizes
const SLOT_COLORS = [
  "#F7FF8F", // slot 1 — yellow (Gross Statutory)
  "#39F7B7", // slot 2 — green (Deduction)
  "#7B9BFF", // slot 3 — blue (VAT)
  "#FF7B7B", // slot 4 — red/coral (EMTL)
  "white",   // slot 5 — white (Other)
];

// Default category-to-slot mapping
const CATEGORY_ORDER = ["grossStatutory", "deduction", "vat", "emtl"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  grossStatutory: "Gross statutory",
  deduction: "Deduction",
  vat: "VAT",
  emtl: "EMTL",
};

// ── Template and font loading (cached at module level) ──

const TEMPLATE_PATH = join(__dirname, "faac-allocation-template.svg");
const FONTS_DIR = join(__dirname, "..", "fonts");

let cachedTemplate: string | null = null;
let cachedFontFiles: string[] | null = null;

function getTemplate(): string {
  if (!cachedTemplate) {
    cachedTemplate = readFileSync(TEMPLATE_PATH, "utf-8");
  }
  return cachedTemplate;
}

function getFontFiles(): string[] {
  if (!cachedFontFiles) {
    cachedFontFiles = [
      join(FONTS_DIR, "Inter-Regular.ttf"),
      join(FONTS_DIR, "Inter-SemiBold.ttf"),
      join(FONTS_DIR, "Inter-Bold.ttf"),
      join(FONTS_DIR, "Inter-ExtraBold.ttf"),
    ];
    // Add Noto Sans for ₦ (Naira sign U+20A6) glyph fallback if available
    const notoPath = join(FONTS_DIR, "NotoSans-Regular.ttf");
    try {
      readFileSync(notoPath);
      cachedFontFiles.push(notoPath);
    } catch {
      // Not available — resvg will fall back to system fonts
    }
  }
  return cachedFontFiles;
}

// ── SVG manipulation utilities ──

export function replaceTextById(svg: string, id: string, newText: string): string {
  // Matches <text id="..." ...>old content</text>
  const pattern = new RegExp(
    `(<text\\s+id="${escapeRegex(id)}"[^>]*>)[^<]*(</text>)`
  );
  return svg.replace(pattern, `$1${escapeXml(newText)}$2`);
}

export function replacePathD(svg: string, id: string, newD: string): string {
  // Matches <path id="..." d="old path" .../> and replaces the d attribute
  const pattern = new RegExp(
    `(<path\\s+id="${escapeRegex(id)}"\\s+)d="[^"]*"`,
  );
  return svg.replace(pattern, `$1d="${newD}"`);
}

export function replaceTextAttr(svg: string, id: string, attr: string, value: string): string {
  // Try to replace existing attribute
  const replacePattern = new RegExp(
    `(<text\\s+id="${escapeRegex(id)}"[^>]*?)${escapeRegex(attr)}="[^"]*"`,
  );
  if (replacePattern.test(svg)) {
    return svg.replace(replacePattern, `$1${attr}="${value}"`);
  }
  // Attribute doesn't exist — add it before the closing >
  const addPattern = new RegExp(
    `(<text\\s+id="${escapeRegex(id)}"[^>]*?)(>)`,
  );
  return svg.replace(addPattern, `$1 ${attr}="${value}"$2`);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Pie chart path computation ──

export function computeSlicePath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  // Clamp to full circle
  const sweep = Math.min(endAngle - startAngle, Math.PI * 2 - 0.0001);
  const clampedEnd = startAngle + sweep;
  const largeArc = sweep > Math.PI ? 1 : 0;

  const outerStartX = cx + outerR * Math.cos(startAngle);
  const outerStartY = cy + outerR * Math.sin(startAngle);
  const outerEndX = cx + outerR * Math.cos(clampedEnd);
  const outerEndY = cy + outerR * Math.sin(clampedEnd);
  const innerEndX = cx + innerR * Math.cos(clampedEnd);
  const innerEndY = cy + innerR * Math.sin(clampedEnd);
  const innerStartX = cx + innerR * Math.cos(startAngle);
  const innerStartY = cy + innerR * Math.sin(startAngle);

  return [
    `M ${outerStartX.toFixed(2)} ${outerStartY.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEndX.toFixed(2)} ${outerEndY.toFixed(2)}`,
    `L ${innerEndX.toFixed(2)} ${innerEndY.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStartX.toFixed(2)} ${innerStartY.toFixed(2)}`,
    "Z",
  ].join(" ");
}

// ── Segment building ──

interface Segment {
  label: string;
  value: number;
  color: string;
}

export function buildSegments(
  breakdown: FaacAllocationInput["breakdown"],
): Segment[] {
  if (!breakdown) return [];

  const raw: Segment[] = [];
  for (let i = 0; i < CATEGORY_ORDER.length; i++) {
    const key = CATEGORY_ORDER[i];
    const value = breakdown[key];
    if (value > 0) {
      raw.push({
        label: CATEGORY_LABELS[key] ?? key,
        value,
        color: SLOT_COLORS[i],
      });
    }
  }

  // Also handle any extra keys beyond the standard 4
  for (const [key, value] of Object.entries(breakdown)) {
    if (CATEGORY_ORDER.includes(key as any) || value <= 0) continue;
    raw.push({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      color: SLOT_COLORS[Math.min(raw.length, SLOT_COLORS.length - 1)],
    });
  }

  const total = raw.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return [];

  // Cap at 5 slots (template limit)
  return raw.slice(0, 5);
}

// ── Main render function ──

export async function renderFaacAllocation(input: FaacAllocationInput): Promise<Buffer> {
  let svg = getTemplate();

  // ── Replace dynamic text ──
  svg = replaceTextById(svg, "local_government_name", input.lgaName);
  svg = replaceTextById(svg, "allocation_total_amount", formatNairaShort(input.totalAllocation));
  svg = replaceTextById(svg, "allocation_period", `${input.month} ${input.year}`);
  svg = replaceTextById(svg, "chart_region_label", `${input.stateName} State`);

  // ── Build pie chart segments ──
  const segments = buildSegments(input.breakdown);

  if (segments.length > 0) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    let startAngle = -Math.PI / 2; // 12 o'clock

    for (let i = 0; i < 5; i++) {
      const sliceId = `chart_slice_${i + 1}`;
      const labelId = `legend_label_${i + 1}`;
      const amountId = `legend_amount_${i + 1}`;

      if (i < segments.length) {
        const seg = segments[i];
        const sliceAngle = (seg.value / total) * Math.PI * 2;
        const endAngle = startAngle + sliceAngle;

        // Compute and set slice path
        const d = computeSlicePath(PIE_CX, PIE_CY, PIE_OUTER_R, PIE_INNER_R, startAngle, endAngle);
        svg = replacePathD(svg, sliceId, d);

        // Update fill color to match segment
        svg = svg.replace(
          new RegExp(`(id="${sliceId}"[^>]*?)fill="[^"]*"`),
          `$1fill="${seg.color}"`
        );

        // Position legend label + amount at slice midpoint
        const midAngle = startAngle + sliceAngle / 2;
        const midRadius = (PIE_OUTER_R + PIE_INNER_R) / 2;
        const lx = PIE_CX + Math.cos(midAngle) * midRadius;
        const ly = PIE_CY + Math.sin(midAngle) * midRadius - 10;
        const ax = PIE_CX + Math.cos(midAngle) * midRadius;
        const ay = PIE_CY + Math.sin(midAngle) * midRadius + 30;
        const anchor = "middle";

        // For very small slices, push labels outside to avoid cramping
        if (sliceAngle < Math.PI / 6) { // < 30 degrees
          const outerLabelR = PIE_OUTER_R + 20;
          const isRight = Math.cos(midAngle) >= 0;
          const olx = Math.min(Math.max(PIE_CX + Math.cos(midAngle) * outerLabelR, 50), 1030);
          const oly = PIE_CY + Math.sin(midAngle) * outerLabelR;
          const oax = olx;
          const oay = oly + 35;
          const oAnchor = isRight ? "start" : "end";
          svg = replaceTextById(svg, labelId, seg.label);
          svg = replaceTextAttr(svg, labelId, "x", olx.toFixed(0));
          svg = replaceTextAttr(svg, labelId, "y", oly.toFixed(0));
          svg = replaceTextAttr(svg, labelId, "text-anchor", oAnchor);
          svg = replaceTextById(svg, amountId, formatNairaShort(seg.value));
          svg = replaceTextAttr(svg, amountId, "x", oax.toFixed(0));
          svg = replaceTextAttr(svg, amountId, "y", oay.toFixed(0));
          svg = replaceTextAttr(svg, amountId, "text-anchor", oAnchor);
          startAngle = endAngle;
          continue;
        }

        svg = replaceTextById(svg, labelId, seg.label);
        svg = replaceTextAttr(svg, labelId, "x", lx.toFixed(0));
        svg = replaceTextAttr(svg, labelId, "y", ly.toFixed(0));
        svg = replaceTextAttr(svg, labelId, "text-anchor", anchor);

        svg = replaceTextById(svg, amountId, formatNairaShort(seg.value));
        svg = replaceTextAttr(svg, amountId, "x", ax.toFixed(0));
        svg = replaceTextAttr(svg, amountId, "y", ay.toFixed(0));
        svg = replaceTextAttr(svg, amountId, "text-anchor", anchor);

        startAngle = endAngle;
      } else {
        // Hide unused slots
        svg = replacePathD(svg, sliceId, "");
        svg = replaceTextById(svg, labelId, "");
        svg = replaceTextById(svg, amountId, "");
      }
    }
  } else {
    // Total-only fallback: single full circle in slot 1, hide rest
    const fullCircle = computeSlicePath(
      PIE_CX, PIE_CY, PIE_OUTER_R, PIE_INNER_R,
      -Math.PI / 2, -Math.PI / 2 + Math.PI * 2,
    );
    svg = replacePathD(svg, "chart_slice_1", fullCircle);
    svg = svg.replace(
      /id="chart_slice_1"([^>]*?)fill="[^"]*"/,
      `id="chart_slice_1"$1fill="${SLOT_COLORS[0]}"`,
    );

    for (let i = 2; i <= 5; i++) {
      svg = replacePathD(svg, `chart_slice_${i}`, "");
    }
    for (let i = 1; i <= 5; i++) {
      svg = replaceTextById(svg, `legend_label_${i}`, "");
      svg = replaceTextById(svg, `legend_amount_${i}`, "");
    }
  }

  // ── Render SVG → PNG via resvg ──
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: getFontFiles(),
      loadSystemFonts: true,
      defaultFontFamily: "Inter",
    },
    fitTo: {
      mode: "original",
    },
  });

  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}
