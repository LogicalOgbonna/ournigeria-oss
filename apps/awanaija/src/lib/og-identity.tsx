/**
 * Identity ("who holds this seat?") link-preview card.
 *
 * Implements the Figma design (Our-Nigeria, node 520-190): near-black green
 * ground, italic serif ask with the place name in cyan, the country map on the
 * right with the ward's state lit white, and a hand-drawn-style arrow from the
 * unknown-person tile to that state. The map is our own generated state
 * boundaries (og-map.generated), so the highlight is dynamic per stateCode.
 *
 * Fonts differ from the base OG card on purpose — the design speaks Instrument
 * Serif *Italic* + Instrument Sans, both already vendored in public/fonts for
 * the site itself, so no new binaries.
 */
import type { ReactElement } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OG_MAP_SIZE, OG_MAP_STATES } from "./og-map.generated";

export const OG_IDENTITY_BG = "#061510";
const ACCENT = "#5bfff0";
const INK = "#ffffff";
const MAP_FILL = "#34d399";
const MAP_STROKE = "rgba(6,21,16,0.35)";

/* ------------------------------------------------------------------ */
/* on-disk assets (fonts, logo, waves) — read once per process         */
/* ------------------------------------------------------------------ */

// Nx may invoke the build from the workspace root or from the app directory.
const APP_DIRS = [process.cwd(), join(process.cwd(), "apps/awanaija")];

function readAsset(rel: string): Buffer {
  for (const dir of APP_DIRS) {
    try {
      return readFileSync(join(dir, rel));
    } catch {
      // try the next candidate
    }
  }
  throw new Error(`[og-identity] asset not found: ${rel}`);
}

type LoadedFont = {
  name: string;
  data: Buffer;
  weight: 400;
  style: "normal" | "italic";
};

let fonts: LoadedFont[] | null = null;

/** The identity card's faces, read from the fonts the site already serves. */
export function ogIdentityFonts(): LoadedFont[] {
  fonts ??= [
    {
      name: "Instrument Serif",
      data: readAsset("public/fonts/InstrumentSerif-Italic.ttf"),
      weight: 400,
      style: "italic",
    },
    {
      name: "Instrument Sans",
      data: readAsset("public/fonts/InstrumentSans-Regular.ttf"),
      weight: 400,
      style: "normal",
    },
  ];
  return fonts;
}

const svgDataUri = (rel: string) =>
  `data:image/svg+xml;base64,${readAsset(rel).toString("base64")}`;

let logoUri: string | null = null;
let wavesUri: string | null = null;

/* ------------------------------------------------------------------ */
/* map geometry                                                        */
/* ------------------------------------------------------------------ */

type StateBox = { x: number; y: number; hw: number; hh: number };

/** Bounding box (center + half extents) of a state in map viewBox coords. */
function stateBox(d: string): StateBox {
  const nums = d.match(/-?\d+(?:\.\d+)?/g) ?? [];
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = Number(nums[i]);
    const y = Number(nums[i + 1]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    hw: (maxX - minX) / 2,
    hh: (maxY - minY) / 2,
  };
}

/* Layout constants (1200x630 card). The map SVG is a square viewBox; Nigeria
 * fills its width, so the square is placed for the *content* to sit where the
 * design puts the map. The avatar tile's center is expressed in card space and
 * converted into viewBox space so the arrow can start at its edge. */
const MAP_LEFT = 742;
const MAP_TOP = 74;
const MAP_RENDER = 344;
const VB_SCALE = OG_MAP_SIZE.width / MAP_RENDER;
const AVATAR = { cx: 990, cy: 380, size: 118 };

/**
 * Curved white arrow from the avatar tile to the highlighted state, as raw
 * path data. Rendered as direct <path> children of the map svg — satori
 * silently drops the entire svg if a fragment/component appears inside it.
 */
function arrowPaths(target: StateBox): { curve: string; head: string } {
  const s0 = {
    x: (AVATAR.cx - MAP_LEFT) * VB_SCALE,
    y: (AVATAR.cy - MAP_TOP) * VB_SCALE,
  };
  const dx0 = target.x - s0.x;
  const dy0 = target.y - s0.y;
  const reach = Math.hypot(dx0, dy0) || 1;
  const dir = { x: dx0 / reach, y: dy0 / reach };

  // Stop at the state's bounding-box edge, not its centroid — the head is
  // white and would vanish inside the white highlighted state.
  const edge = Math.min(
    target.hw / Math.max(Math.abs(dir.x), 0.01),
    target.hh / Math.max(Math.abs(dir.y), 0.01)
  );
  // +20 not +4: the head triangle extends 16 units forward from the stop point.
  const endOff = Math.min(edge + 20, reach * 0.7);
  // Leave the tile's corner; for states right next to the tile, start at the
  // tile's center (hidden under it) so the arrow keeps ~35 units of body.
  const startOff = Math.max(0, Math.min(105, reach * 0.45, reach - endOff - 35));
  const start = { x: s0.x + dir.x * startOff, y: s0.y + dir.y * startOff };
  const end = { x: target.x - dir.x * endOff, y: target.y - dir.y * endOff };

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy) || 1;
  // Bow the curve upward, like the design's hand-drawn stroke.
  let perp = { x: dy / dist, y: -dx / dist };
  if (perp.y > 0) perp = { x: -perp.x, y: -perp.y };
  const ctrl = {
    x: (start.x + end.x) / 2 + perp.x * dist * 0.28,
    y: (start.y + end.y) / 2 + perp.y * dist * 0.28,
  };

  // Arrowhead along the curve's end tangent.
  const tx = end.x - ctrl.x;
  const ty = end.y - ctrl.y;
  const tl = Math.hypot(tx, ty) || 1;
  const t = { x: tx / tl, y: ty / tl };
  const n = { x: t.y, y: -t.x };
  const tip = { x: end.x + t.x * 16, y: end.y + t.y * 16 };
  const w1 = { x: end.x + n.x * 9, y: end.y + n.y * 9 };
  const w2 = { x: end.x - n.x * 9, y: end.y - n.y * 9 };

  return {
    curve: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
    head: `M ${tip.x} ${tip.y} L ${w1.x} ${w1.y} L ${w2.x} ${w2.y} Z`,
  };
}

function IdentityMap({ stateCode }: { stateCode?: string | null }) {
  const target = stateCode
    ? OG_MAP_STATES.find((s) => s.code === stateCode)
    : null;
  const arrow = target ? arrowPaths(stateBox(target.d)) : null;
  return (
    <svg
      width={MAP_RENDER}
      height={MAP_RENDER}
      viewBox={`0 0 ${OG_MAP_SIZE.width} ${OG_MAP_SIZE.height}`}
      style={{ display: "flex" }}
    >
      {OG_MAP_STATES.map((s) => (
        <path
          key={s.code}
          d={s.d}
          fill={s.code === stateCode ? INK : MAP_FILL}
          stroke={MAP_STROKE}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      ))}
      {arrow ? (
        <path
          d={arrow.curve}
          fill="none"
          stroke={INK}
          strokeWidth="5"
          strokeLinecap="round"
        />
      ) : null}
      {arrow ? <path d={arrow.head} fill={INK} /> : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* unknown-person tile                                                 */
/* ------------------------------------------------------------------ */

/**
 * The design's tile carries a 3D bust render; its Figma raster export came
 * back empty, so the person is drawn as a flat silhouette in the same teal
 * treatment. Drop the real image in later and swap this block for an <img>.
 */
function AvatarTile() {
  const { cx, cy, size } = AVATAR;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - size / 2,
        top: cy - size / 2,
        width: size,
        height: size,
        borderRadius: 14,
        background: "#0d251d",
        transform: "rotate(15deg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(91,255,240,0.18)",
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 100 100" style={{ display: "flex" }}>
        <circle cx="50" cy="36" r="17" fill="#9fd9d6" />
        <path
          d="M 20 88 C 20 62 33 56 50 56 C 67 56 80 62 80 88 L 80 92 L 20 92 Z"
          fill="#7fc9c4"
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* card                                                                */
/* ------------------------------------------------------------------ */

export type OgIdentitySeg = { text: string; accent?: boolean };

export type OgIdentityProps = {
  headline: OgIdentitySeg[];
  subline: string;
  /** Slug matching og-map.generated codes; lights that state + draws the arrow. */
  stateCode?: string | null;
};

/** Plain-text headline for <title>/og:title alongside the segmented card. */
export const ogIdentityHeadlineText = (segs: OgIdentitySeg[]) =>
  segs.map((s) => s.text).join("");

/**
 * Headline rendered word-by-word in a wrapping row: satori's inline support
 * for mixed-color spans is unreliable, per-word spans wrap like real text.
 */
function Headline({ segs, fontSize }: { segs: OgIdentitySeg[]; fontSize: number }) {
  const words: { w: string; accent?: boolean }[] = [];
  for (const seg of segs) {
    for (const w of seg.text.split(/\s+/).filter(Boolean)) {
      words.push({ w, accent: seg.accent });
    }
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: 566 }}>
      {words.map((word, i) => (
        <div
          key={i}
          style={{
            fontFamily: "Instrument Serif, serif",
            fontStyle: "italic",
            fontSize,
            lineHeight: 0.98,
            color: word.accent ? ACCENT : INK,
            marginRight: fontSize * 0.24,
          }}
        >
          {word.w}
        </div>
      ))}
    </div>
  );
}

export function OgCardIdentity({ headline, subline, stateCode }: OgIdentityProps): ReactElement {
  logoUri ??= svgDataUri("src/assets/og/our-nigeria-logo.svg");
  wavesUri ??= svgDataUri("src/assets/og/waves.svg");
  const chars = ogIdentityHeadlineText(headline).length;
  const fontSize = chars > 58 ? 54 : 64;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: OG_IDENTITY_BG,
        position: "relative",
      }}
    >
      {/* concentric waves, bottom-left, running off-canvas */}
      <img
        src={wavesUri}
        width={700}
        height={575}
        style={{
          position: "absolute",
          left: -262,
          top: 268,
          transform: "rotate(7.4deg)",
        }}
      />

      <img
        src={logoUri}
        width={186}
        height={52}
        style={{ position: "absolute", left: 85, top: 45 }}
      />

      <div
        style={{
          position: "absolute",
          left: 85,
          top: 150,
          display: "flex",
          flexDirection: "column",
          width: 566,
        }}
      >
        <Headline segs={headline} fontSize={fontSize} />
        <div
          style={{
            fontFamily: "Instrument Sans, sans-serif",
            fontSize: 22,
            lineHeight: 1.42,
            color: INK,
            marginTop: 30,
            maxWidth: 500,
          }}
        >
          {subline}
        </div>
      </div>

      <div style={{ position: "absolute", left: MAP_LEFT, top: MAP_TOP, display: "flex" }}>
        <IdentityMap stateCode={stateCode} />
      </div>

      <AvatarTile />
    </div>
  );
}
