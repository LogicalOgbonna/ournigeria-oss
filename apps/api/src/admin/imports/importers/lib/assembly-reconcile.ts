/**
 * Pure reconciliation helpers for State Assembly (mha) membership.
 *
 * Turns a constituency code + a curated ground-truth dataset into a per-position
 * verdict. Deterministic, no I/O, no imports beyond TS types.
 */

/** 36 states + FCT, as they appear in constituency_code (snake_case, multi-word joined by _). */
export const STATE_SLUGS = [
  "abia", "adamawa", "akwa_ibom", "anambra", "bauchi", "bayelsa", "benue", "borno", "cross_river",
  "delta", "ebonyi", "edo", "ekiti", "enugu", "fct", "gombe", "imo", "jigawa", "kaduna", "kano",
  "katsina", "kebbi", "kogi", "kwara", "lagos", "nasarawa", "niger", "ogun", "ondo", "osun", "oyo",
  "plateau", "rivers", "sokoto", "taraba", "yobe", "zamfara",
] as const;

const STOP = new Set(["and", "state", "constituency", "seat", "the", "of"]);
const ROMAN: Record<string, string> = {
  i: "1", ii: "2", iii: "3", iv: "4", v: "5", vi: "6", vii: "7", viii: "8", ix: "9", x: "10",
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((t) => ROMAN[t] ?? t)
    .filter((t) => !STOP.has(t));
}

/** Order/separator/stopword/roman-numeral invariant key for a constituency name or code fragment. */
export function canonical(s: string): string {
  return tokenize(s).sort().join("_");
}

/** "state_<state>_<constituency...>" → { state, canonical seat key }; null if malformed/unknown state. */
export function parseConstituency(code: string): { state: string; key: string } | null {
  if (!code || !code.startsWith("state_")) return null;
  const rest = code.slice("state_".length);
  const state = STATE_SLUGS.filter((s) => rest === s || rest.startsWith(`${s}_`))
    .sort((a, b) => b.length - a.length)[0];
  if (!state) return null;
  const seat = rest.slice(state.length).replace(/^_/, "");
  if (!seat) return null;
  return { state, key: canonical(seat) };
}

const TITLES = new Set([
  "hon", "rt", "dr", "alh", "alhaji", "barr", "chief", "engr", "sen", "senator", "prince", "princess",
  "mr", "mrs", "ms", "prof", "comrade", "pst", "pastor", "rev", "arc", "amb", "hajiya", "otunba",
]);

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((t) => !TITLES.has(t) && t.length > 1);
}

/** Classic DP Levenshtein edit distance. Pure, no deps. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Two name tokens count as "the same token modulo transliteration/inflection" when
 * (both already lowercased, length > 1):
 *  - exact equal; OR
 *  - one is a prefix of the other AND the shorter has length ≥ 4 (e.g. yusuf⊂yusufu); OR
 *  - Levenshtein distance ≤ (min(len) ≤ 4 ? 1 : 2)  (e.g. ahmed/ahmad=1, mohammed/muhammad=2).
 */
function tokensSimilar(t1: string, t2: string): boolean {
  if (t1 === t2) return true;
  const shorter = t1.length <= t2.length ? t1 : t2;
  const longer = t1.length <= t2.length ? t2 : t1;
  if (shorter.length >= 4 && longer.startsWith(shorter)) return true;
  const threshold = shorter.length <= 4 ? 1 : 2;
  return levenshtein(t1, t2) <= threshold;
}

/**
 * Fuzzy Jaccard token overlap of two person names (0..1), title- and order-invariant.
 * Tokens match modulo Nigerian transliteration/inflection variants (see tokensSimilar).
 * `inter` = how many of A's tokens have a fuzzy match in B (each B token consumed once).
 */
export function nameMatchScore(a: string, b: string): number {
  const A = nameTokens(a);
  const B = nameTokens(b);
  if (A.length === 0 || B.length === 0) return 0;
  const usedB = new Array<boolean>(B.length).fill(false);
  let inter = 0;
  for (const ta of A) {
    for (let j = 0; j < B.length; j++) {
      if (!usedB[j] && tokensSimilar(ta, B[j])) {
        usedB[j] = true;
        inter++;
        break;
      }
    }
  }
  return inter / (A.length + B.length - inter);
}

/** Reconciliation verdict thresholds. */
export const KEEP_THRESHOLD = 0.6;
export const FLIP_THRESHOLD = 0.34;

export interface GroundTruthMember { name: string; party: string | null; source: string }
export type GroundTruth = Map<string, { coverage: string; byKey: Map<string, GroundTruthMember> }>;

interface RawStateBlock {
  source?: string;
  coverage?: string;
  members?: Array<{ constituency: string; name: string; party?: string | null; source?: string }>;
}

export function buildGroundTruth(json: unknown): GroundTruth {
  const out: GroundTruth = new Map();
  if (json === null || typeof json !== "object") return out;
  for (const [state, blockRaw] of Object.entries(json as Record<string, unknown>)) {
    if (state.startsWith("_")) continue;
    const block = blockRaw as RawStateBlock;
    const byKey = new Map<string, GroundTruthMember>();
    for (const m of block.members ?? []) {
      if (!m.constituency || !m.name) continue;
      byKey.set(canonical(m.constituency), { name: m.name, party: m.party ?? null, source: m.source ?? block.source ?? "" });
    }
    out.set(state, { coverage: block.coverage ?? "full", byKey });
  }
  return out;
}

export type Verdict = "keep" | "flip" | "borderline" | "unknown";

export function reconcilePosition(
  gt: GroundTruth,
  pos: { constituency_code: string; name: string },
): { verdict: Verdict; score: number; member: GroundTruthMember | null } {
  const parsed = parseConstituency(pos.constituency_code);
  if (!parsed) return { verdict: "unknown", score: 0, member: null };
  const stateBlock = gt.get(parsed.state);
  // Skip whole states only when no reliable list exists ("unavailable"). "partial" and
  // "full" both flip PER-SEAT: a seat present in byKey carries its own source, so it is
  // trustworthy even if other seats in the state were not found. (Reliability is per-seat,
  // not per-state — a partial state must still be able to flip the seats it did source.)
  if (!stateBlock || stateBlock.coverage === "unavailable") return { verdict: "unknown", score: 0, member: null };
  const member = stateBlock.byKey.get(parsed.key) ?? null;
  if (!member) return { verdict: "unknown", score: 0, member: null };
  const score = nameMatchScore(pos.name, member.name);
  if (score >= KEEP_THRESHOLD) return { verdict: "keep", score, member };
  if (score <= FLIP_THRESHOLD) return { verdict: "flip", score, member };
  return { verdict: "borderline", score, member };
}
