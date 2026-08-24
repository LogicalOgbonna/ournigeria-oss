/**
 * Shared Open Graph card rendering for link previews (WhatsApp, X/Twitter, Telegram, Slack).
 *
 * Every card is 1200x630 on a single high-contrast emerald ground — the site's pages
 * render dark or light, but link previews always land in someone else's feed, so they
 * commit to one look.
 *
 * NOTE: this gradient is DARKER than the ShareCard row in DESIGN.md
 * (#064e3b -> #065f46 -> #047857). The deeper ground was chosen so white Instrument
 * Serif holds contrast at WhatsApp thumbnail size. Reconcile with DESIGN.md before
 * reusing these values elsewhere.
 *
 * The map is drawn from our own state boundaries (see scripts/gen-og-map.mjs) rather than
 * stock art, so the claim the card makes is "this country, actually mapped".
 */
import type { ReactElement } from "react";
import { COVERAGE } from "./constants";
import { OG_MAP_SIZE, OG_MAP_STATES } from "./og-map.generated";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#ffffff";
const EMERALD = "#34d399";
const GRADIENT = "linear-gradient(135deg, #052e26 0%, #064e3b 46%, #066f4d 100%)";

/* ------------------------------------------------------------------ */
/* fonts                                                               */
/* ------------------------------------------------------------------ */

/**
 * Brand faces are vendored into the repo rather than fetched from Google at build.
 *
 * They used to be fetched, which was wrong in two ways. `ImageResponse` does
 * `options.fonts || defaultFonts`, and an empty array is truthy — so if every fetch
 * failed, satori got zero fonts and threw "No fonts are loaded", failing the whole
 * build. One 429 on a shared CI egress IP was enough to do that to all three at once.
 * And a *partial* failure was worse than a loud one: satori silently falls back to
 * whichever face did load, so the serif headline would render in DM Sans and get
 * baked into a static PNG that ships to every share until someone noticed.
 *
 * Three static font binaries have no business being a build-time network dependency.
 * Reading them off disk makes the build hermetic and the output deterministic.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

type LoadedFont = {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600;
  style: "normal";
};

const FONT_FILES: { file: string; name: string; weight: 400 | 500 | 600 }[] = [
  { file: "instrument-serif-400.woff", name: "Instrument Serif", weight: 400 },
  { file: "dm-sans-600.woff", name: "DM Sans", weight: 600 },
  { file: "ibm-plex-mono-500.woff", name: "IBM Plex Mono", weight: 500 },
];

// Nx may invoke the build from the workspace root or from the app directory.
const FONT_DIRS = [
  join(process.cwd(), "src/assets/fonts"),
  join(process.cwd(), "apps/awanaija/src/assets/fonts"),
];

function readFont(file: string): Buffer {
  for (const dir of FONT_DIRS) {
    try {
      return readFileSync(join(dir, file));
    } catch {
      // try the next candidate
    }
  }
  // Fail loudly: a card rendered without its brand face is a silent visual regression
  // baked into a static asset, which is worse than a build that stops here.
  throw new Error(
    `[og] font not found: ${file}. Looked in: ${FONT_DIRS.join(", ")}`
  );
}

let fonts: LoadedFont[] | null = null;

/** Brand fonts for the card. Read once per process, from disk. */
export function ogFonts(): LoadedFont[] {
  fonts ??= FONT_FILES.map(({ file, name, weight }) => ({
    name,
    data: readFont(file),
    weight,
    style: "normal" as const,
  }));
  return fonts;
}

const SERIF = "Instrument Serif, serif";
const SANS = "DM Sans, sans-serif";
const MONO = "IBM Plex Mono, monospace";

/* ------------------------------------------------------------------ */
/* pieces                                                              */
/* ------------------------------------------------------------------ */

export type OgStat = { value: string; label: string };

/**
 * Coverage figures for the cards.
 *
 * Deliberately structural rather than live counts: ward, LGA and seat totals are
 * fixed by Nigeria's own delimitation, so a card baked at build time cannot drift.
 * A figure like "officials tracked" would go stale between deploys.
 */
export const OG_COVERAGE: OgStat[] = [
  { value: COVERAGE.wards, label: "Wards mapped" },
  { value: COVERAGE.lgas, label: "Local govts" },
  { value: COVERAGE.seats, label: "Seats mapped" },
];

/**
 * Card copy, exported so the real opengraph-image routes and the dev preview route
 * all render from one source — otherwise the preview silently shows stale text,
 * which is the one failure mode a preview tool must not have.
 */
export const OG_CARD_SITE: OgCardProps = {
  eyebrow: "Our Nigeria",
  headline: "Know who governs you, all the way down to your ward.",
  subline:
    "Your leaders, your budget, and where the money goes — for every ward in Nigeria.",
  stats: OG_COVERAGE,
};

export const OG_CARD_ROADMAP: OgCardProps = {
  eyebrow: "Roadmap",
  headline: "What we are building next, ward by ward.",
  subline:
    "Elections, the police chain, your clinics and schools — and the part that needs you.",
  stats: OG_COVERAGE,
};

const MAP_FILL = "rgba(52,211,153,0.14)";
const MAP_STROKE = "rgba(52,211,153,0.55)";
const MAP_STROKE_WIDTH = 0.9;

function NigeriaMap({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${OG_MAP_SIZE.width} ${OG_MAP_SIZE.height}`}
      style={{ display: "flex" }}
    >
      {OG_MAP_STATES.map((s) => (
        <path
          key={s.code}
          d={s.d}
          fill={MAP_FILL}
          stroke={MAP_STROKE}
          strokeWidth={MAP_STROKE_WIDTH}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: MONO,
        fontSize: 19,
        letterSpacing: 4,
        textTransform: "uppercase",
        color: EMERALD,
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: 6, background: EMERALD }} />
      {children}
    </div>
  );
}

function StatRow({ stats }: { stats: OgStat[] }) {
  return (
    <div style={{ display: "flex", gap: 42 }}>
      {stats.map((s) => (
        <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: SERIF, fontSize: 44, color: INK, lineHeight: 1 }}>
            {s.value}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 15,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              marginTop: 9,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Domain() {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 17,
        letterSpacing: 2.5,
        color: "rgba(255,255,255,0.45)",
      }}
    >
      ournigeria.ng
    </div>
  );
}

const shell = (children: ReactElement) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      background: GRADIENT,
      position: "relative",
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* card                                                                */
/* ------------------------------------------------------------------ */

export type OgCardProps = {
  eyebrow: string;
  headline: string;
  subline?: string;
  stats?: OgStat[];
};

/** Type on the left, the country mapped on the right. */
export function OgCardMap({ eyebrow, headline, subline, stats }: OgCardProps): ReactElement {
  return shell(
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "62px 0 58px 68px",
          width: 700,
        }}
      >
        <Eyebrow>{eyebrow}</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 66,
              lineHeight: 1.06,
              color: INK,
              letterSpacing: -1,
            }}
          >
            {headline}
          </div>
          {subline ? (
            <div
              style={{
                fontFamily: SANS,
                fontSize: 25,
                lineHeight: 1.42,
                color: "rgba(255,255,255,0.72)",
                marginTop: 20,
                maxWidth: 590,
              }}
            >
              {subline}
            </div>
          ) : null}
        </div>
        {stats?.length ? <StatRow stats={stats} /> : <Domain />}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          position: "relative",
        }}
      >
        <NigeriaMap size={498} />
      </div>

      {stats?.length ? (
        <div style={{ position: "absolute", right: 60, bottom: 58, display: "flex" }}>
          <Domain />
        </div>
      ) : null}
    </div>
  );
}
