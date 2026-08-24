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

// Satori needs TTF/WOFF (never WOFF2), and Google only serves WOFF2 to modern
// user agents — hence the deliberately ancient UA string.
const LEGACY_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.71 Safari/537.36";

// Google serves font binaries from exactly one host. Pinning it means a tampered or
// MITM'd CSS response can't redirect the second fetch somewhere else.
const FONT_BINARY_ORIGIN = "https://fonts.gstatic.com";
const FONT_FETCH_TIMEOUT_MS = 5_000;
const MAX_FONT_BYTES = 2_000_000;

type LoadedFont = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: "normal" };

async function fetchGoogleFont(
  family: string,
  name: string,
  weight: 400 | 500 | 600
): Promise<LoadedFont | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}`, {
      headers: { "User-Agent": LEGACY_UA },
      // Fonts never change; let the platform cache hold them between renders.
      cache: "force-cache",
      signal: AbortSignal.timeout(FONT_FETCH_TIMEOUT_MS),
    }).then((r) => (r.ok ? r.text() : ""));
    const url = css.match(/src:\s*url\((https:[^)]+)\)/)?.[1];
    if (!url) return null;
    if (new URL(url).origin !== FONT_BINARY_ORIGIN) return null;
    const res = await fetch(url, {
      cache: "force-cache",
      signal: AbortSignal.timeout(FONT_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    // Don't buffer an unbounded body into memory — a font this big is a bug upstream.
    if (Number(res.headers.get("content-length")) > MAX_FONT_BYTES) return null;
    return { name, data: await res.arrayBuffer(), weight, style: "normal" };
  } catch {
    return null;
  }
}

let fontsPromise: Promise<LoadedFont[]> | null = null;

/**
 * Brand fonts for the card. Any that fail to load are simply dropped — Satori falls
 * back to its bundled face, so a Google Fonts hiccup degrades the card's typography
 * instead of failing the request and leaving the link with no preview at all.
 */
export function ogFonts(): Promise<LoadedFont[]> {
  fontsPromise ??= Promise.all([
    fetchGoogleFont("Instrument+Serif", "Instrument Serif", 400),
    fetchGoogleFont("DM+Sans:wght@600", "DM Sans", 600),
    fetchGoogleFont("IBM+Plex+Mono:wght@500", "IBM Plex Mono", 500),
  ]).then((f) => f.filter((x): x is LoadedFont => x !== null));
  return fontsPromise;
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
