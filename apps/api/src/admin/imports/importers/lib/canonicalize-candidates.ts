/**
 * Canonicalize the 2027 primaries candidate JSON (plan 60 §3).
 *
 * The source file was compiled across ~85 scraping passes, so the same person
 * appears under name variants ("Bola Tinubu" / "Bola Ahmed Tinubu") and the
 * same seat under field variants (stateCode null vs "nigeria"; constituency
 * suffix/order differences). This module:
 *   - groups rows by SEAT SEMANTICS (not raw fields),
 *   - merges name-variant rows conservatively (token-subset, within one
 *     party+seat group only — different people who share a surname never merge),
 *   - normalizes result values onto chk_elections_result,
 *   - flags data conflicts (two distinct "winners" of one party's primary for
 *     one seat; the same winner name under two parties for one seat) so they
 *     are SKIPPED + REPORTED instead of silently imported.
 *
 * Pure functions — no DB, fully unit-tested.
 */

export interface RawCandidateRow {
  candidateName?: string;
  electionType?: string;
  stateCode?: string | null;
  year?: number;
  electionDate?: string | null;
  votes?: number | null;
  isPrimary?: boolean;
  result?: string;
  confidence?: string;
  sourceUrl?: string | null;
  notes?: string | null;
  constituency?: string | null;
  priorOffice?: string | null;
  party?: string | null;
}

export interface CanonicalCandidate {
  /** Canonical display name (the longest merged variant). */
  name: string;
  /** Other name spellings merged into this person. */
  aliases: string[];
  party: string;
  electionType: string;
  year: number;
  seatKey: string;
  /** False when the constituency is unrecorded (whole-state pseudo-seat). */
  seatKnown: boolean;
  stateCode: string | null;
  /** Original constituency string (longest variant) — preserved for the notes field. */
  constituency: string | null;
  result: string;
  confidence: "high" | "medium" | "low";
  votes: number | null;
  electionDate: string | null;
  isPrimary: boolean;
  sources: string[];
  notes: string | null;
}

export interface CanonicalizeResult {
  candidates: CanonicalCandidate[];
  /** Rows unusable for import (missing name/type/year, unknown type). */
  skipped: { reason: string; label: string }[];
  /** Data conflicts excluded from import until the source file is corrected. */
  conflicts: { key: string; detail: string }[];
  mergedRowCount: number;
}

const VALID_ELECTION_TYPES = new Set([
  "presidential", "vice_presidential", "gubernatorial", "deputy_gubernatorial", "senatorial", "house_of_reps",
  "state_assembly", "lga_chairman", "councilor", "other",
]);

/** chk_elections_result allowed set. */
const VALID_RESULTS = new Set([
  "won", "lost", "withdrawn", "disqualified", "annulled", "runoff", "pending",
]);

/** Source-file result variants → chk values. Unknown → 'pending', NEVER 'won'. */
const RESULT_MAP: Record<string, string> = {
  won_primary: "won",
  withdrew: "withdrawn",
};

const CONF_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };
/** result precedence when merging variants of the same person. */
const RESULT_RANK: Record<string, number> = {
  won: 7, runoff: 6, pending: 5, annulled: 4, disqualified: 3, withdrawn: 2, lost: 1,
};

/** Leading titles that appear on scraped names ("Sir Emmanuel Ekpenyong Edet"). */
const HONORIFICS = new Set([
  "chief", "alhaji", "alhaja", "hon", "honourable", "honorable", "sen", "senator",
  "dr", "barr", "barrister", "engr", "engineer", "prof", "professor", "arc",
  "mr", "mrs", "ms", "miss", "sir", "dame", "otunba", "hrh", "gen", "general",
  "comrade", "pastor", "rev", "reverend", "elder", "amb", "ambassador", "rt",
]);

export function nameTokens(s: string): string[] {
  const toks = s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  let start = 0;
  // Strip leading honorifics only while >=2 tokens would remain ("Prince Nnamdi" keeps prince).
  while (start < toks.length && HONORIFICS.has(toks[start]) && toks.length - start - 1 >= 2) start++;
  return toks.slice(start);
}

export function normalizeResult(raw: string | undefined): { result: string; unknown: boolean } {
  const r = String(raw ?? "").trim().toLowerCase();
  if (VALID_RESULTS.has(r)) return { result: r, unknown: false };
  if (RESULT_MAP[r]) return { result: RESULT_MAP[r], unknown: false };
  return { result: "pending", unknown: true };
}

/** Constituency string → order/suffix-insensitive key ("Oruk Anam/Ukanafun" == "Ukanafun/Oruk Anam Federal Constituency"). */
export function normalizeConstituency(raw: string | null | undefined): string {
  if (!raw) return "";
  const noParens = raw.replace(/\([^)]*\)/g, " ");
  const toks = noParens
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !["federal", "constituency", "senatorial", "district", "fc", "state", "zone"].includes(t));
  return toks.sort().join("_");
}

function normState(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (!s || s === "nigeria") return null; // presidential rows carry null or "nigeria"
  return s;
}

/**
 * Seat semantics (plan 60 review F3): the grouping key must survive the file's
 * field inconsistencies, so each office uses only the fields that define its seat.
 */
export function seatKeyOf(electionType: string, stateCode: string | null | undefined, constituency: string | null | undefined): string {
  const st = normState(stateCode);
  switch (electionType) {
    case "presidential":
      return "presidential|ng";
    case "vice_presidential":
      // National ticket slot — one running mate per party, like the presidency.
      return "vice_presidential|ng";
    case "gubernatorial":
    case "deputy_gubernatorial":
      // constituency on gubernatorial rows is noise (null vs state-name variants)
      return `${electionType}|${st ?? normalizeConstituency(constituency) ?? ""}`;
    default:
      return `${electionType}|${st ?? ""}|${normalizeConstituency(constituency)}`;
  }
}

/**
 * Is the seat actually identified? Constituency-scoped offices with an empty
 * constituency string collapse a whole state into one pseudo-seat — many real
 * winners of different (unrecorded) seats share that key, so winner-conflict
 * checks must not fire there, and name-merging must be stricter.
 */
export function seatKnownOf(electionType: string, stateCode: string | null | undefined, constituency: string | null | undefined): boolean {
  switch (electionType) {
    case "presidential":
    case "vice_presidential":
      return true;
    case "gubernatorial":
    case "deputy_gubernatorial":
      return normState(stateCode) !== null || normalizeConstituency(constituency) !== "";
    default:
      return normalizeConstituency(constituency) !== "";
  }
}

interface WorkRow {
  name: string;
  tokens: Set<string>;
  rows: RawCandidateRow[];
}

/**
 * seatKnown derived from a full group key (`party|<seatKey>|year`) — every row
 * in a group shares it, since the seat key is built from the same fields.
 */
function seatKnownFromKey(groupKey: string): boolean {
  const first = groupKey.indexOf("|");
  const last = groupKey.lastIndexOf("|");
  const seat = groupKey.slice(first + 1, last); // e.g. "presidential|ng", "gubernatorial|oyo", "senatorial|imo|imo_west"
  const parts = seat.split("|");
  if (parts[0] === "presidential" || parts[0] === "vice_presidential") return true;
  if (parts[0] === "gubernatorial" || parts[0] === "deputy_gubernatorial") return (parts[1] ?? "") !== "";
  return (parts[2] ?? "") !== "";
}

function isSubset(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false;
  for (const t of a) if (!b.has(t)) return false;
  return true;
}

export function canonicalizeCandidates(json: Record<string, unknown>): CanonicalizeResult {
  const skipped: CanonicalizeResult["skipped"] = [];
  const conflicts: CanonicalizeResult["conflicts"] = [];

  // party -> seatKey -> merged people
  const groups = new Map<string, WorkRow[]>();
  let usableRows = 0;

  for (const [party, value] of Object.entries(json)) {
    if (party.startsWith("_") || !Array.isArray(value)) continue;
    for (const raw of value as RawCandidateRow[]) {
      const name = typeof raw.candidateName === "string" ? raw.candidateName.trim() : "";
      const type = raw.electionType;
      const label = `${party} · ${type ?? "?"} · ${name || "(no name)"}`;
      if (!name || !type || typeof raw.year !== "number") {
        skipped.push({ reason: "missing name/electionType/year", label });
        continue;
      }
      if (!VALID_ELECTION_TYPES.has(type)) {
        skipped.push({ reason: `unknown electionType "${type}"`, label });
        continue;
      }
      const toks = nameTokens(name);
      if (toks.length === 0) {
        skipped.push({ reason: "name has no usable tokens", label });
        continue;
      }
      usableRows++;
      const key = `${party}|${seatKeyOf(type, raw.stateCode, raw.constituency)}|${raw.year}`;
      const bucket = groups.get(key) ?? [];
      bucket.push({ name, tokens: new Set(toks), rows: [raw] });
      groups.set(key, bucket);
    }
  }

  // Merge phase — ORDER-INDEPENDENT (review I1): within each group, process
  // names longest-token-count first so short variants always meet the fullest
  // name ("Bola Tinubu" and "Ahmed Tinubu" both fold into "Bola Ahmed Tinubu"
  // regardless of scrape order). When the SEAT is unknown (whole-state
  // pseudo-key), subset merging would collapse different constituencies'
  // candidates — require exact token equality there.
  for (const [key, bucket] of groups) {
    const known = seatKnownFromKey(key);
    bucket.sort((a, b) => b.tokens.size - a.tokens.size || b.name.length - a.name.length);
    const merged: WorkRow[] = [];
    for (const w of bucket) {
      const hit = merged.find((m) =>
        known
          ? isSubset(w.tokens, m.tokens) || isSubset(m.tokens, w.tokens)
          : m.tokens.size === w.tokens.size && isSubset(w.tokens, m.tokens),
      );
      if (hit) {
        hit.rows.push(...w.rows);
        for (const t of w.tokens) hit.tokens.add(t);
      } else {
        merged.push(w);
      }
    }
    groups.set(key, merged);
  }

  const candidates: CanonicalCandidate[] = [];

  for (const [key, people] of groups) {
    const [party] = key.split("|", 1);
    for (const person of people) {
      const aliases = [...new Set(person.rows.map((r) => (r.candidateName ?? "").trim()).filter((n) => n && n !== person.name))];
      const sources = [...new Set(person.rows.map((r) => r.sourceUrl).filter((u): u is string => !!u))];

      let result = "pending";
      let bestResultRank = 0;
      let sawWon = false;
      let sawTerminal: string | null = null; // withdrawn|disqualified|annulled
      let confidence: "high" | "medium" | "low" = "low";
      let bestConfRank = 0;
      let votes: number | null = null;
      let electionDate: string | null = null;
      let notes: string | null = null;
      let isPrimary = false;
      for (const r of person.rows) {
        const nr = normalizeResult(r.result);
        if (nr.unknown) {
          skipped.push({ reason: `unknown result "${r.result}" → pending`, label: `${party} · ${person.name}` });
        }
        if (nr.result === "won") sawWon = true;
        if (["withdrawn", "disqualified", "annulled"].includes(nr.result)) sawTerminal = nr.result;
        if ((RESULT_RANK[nr.result] ?? 0) > bestResultRank) {
          bestResultRank = RESULT_RANK[nr.result] ?? 0;
          result = nr.result;
        }
        const conf = CONF_RANK[r.confidence ?? ""] ? (r.confidence as "high" | "medium" | "low") : "medium";
        if (CONF_RANK[conf] > bestConfRank) {
          bestConfRank = CONF_RANK[conf];
          confidence = conf;
        }
        if (typeof r.votes === "number" && (votes === null || r.votes > votes)) votes = r.votes;
        // Only a strict yyyy-mm-dd survives — scraped rows carry stray formats
        // that would fail the registry's date coercion at apply time.
        if (!electionDate && r.electionDate && /^\d{4}-\d{2}-\d{2}$/.test(r.electionDate)) electionDate = r.electionDate;
        if (!notes && r.notes) notes = r.notes;
        if (r.isPrimary !== false) isPrimary = true; // default true
      }

      // Review I6: a person recorded both as winner AND withdrawn/disqualified/
      // annulled is a data contradiction — silent upward resolution to 'won'
      // could ship a withdrawn candidate as the flagbearer. Flag, don't guess.
      if (sawWon && sawTerminal) {
        conflicts.push({
          key,
          detail: `"${person.name}" recorded both as winner and ${sawTerminal} — resolve in the source data`,
        });
        continue;
      }

      const first = person.rows[0];
      const constituency = person.rows
        .map((r) => r.constituency)
        .filter((c): c is string => !!c)
        .sort((a, b) => b.length - a.length)[0] ?? null;
      const stateCode = person.rows.map((r) => normState(r.stateCode)).find((s) => s !== null) ?? null;

      candidates.push({
        name: person.name,
        aliases,
        party,
        electionType: first.electionType as string,
        year: first.year as number,
        seatKey: key,
        seatKnown: seatKnownOf(first.electionType as string, first.stateCode, first.constituency),
        stateCode,
        constituency,
        result,
        confidence,
        votes,
        electionDate,
        isPrimary,
        sources,
        notes,
      });
    }
  }

  // Conflict F6a: >1 distinct merged person marked 'won' for one party+seat+year.
  const winnersByKey = new Map<string, CanonicalCandidate[]>();
  for (const c of candidates) {
    if (c.result !== "won" || !c.seatKnown) continue; // unknown seats can host many real winners
    const list = winnersByKey.get(c.seatKey) ?? [];
    list.push(c);
    winnersByKey.set(c.seatKey, list);
  }
  const conflicted = new Set<CanonicalCandidate>();
  for (const [key, winners] of winnersByKey) {
    if (winners.length > 1) {
      conflicts.push({
        key,
        detail: `${winners.length} distinct "won" candidates for one party+seat: ${winners.map((w) => w.name).join(" / ")}`,
      });
      for (const w of winners) conflicted.add(w);
    }
  }

  // Conflict (data-level F6b): the same winner name-token-set under 2+ parties for one seat.
  const seatWinners = new Map<string, { tokens: string; c: CanonicalCandidate }[]>();
  for (const c of candidates) {
    if (c.result !== "won" || !c.seatKnown || conflicted.has(c)) continue;
    const seat = c.seatKey.slice(c.party.length + 1); // strip "party|"
    const toks = [...new Set(nameTokens(c.name))].sort().join(" ");
    const list = seatWinners.get(seat) ?? [];
    list.push({ tokens: toks, c });
    seatWinners.set(seat, list);
  }
  for (const [seat, list] of seatWinners) {
    const byToks = new Map<string, CanonicalCandidate[]>();
    for (const { tokens, c } of list) {
      const arr = byToks.get(tokens) ?? [];
      arr.push(c);
      byToks.set(tokens, arr);
    }
    for (const [, same] of byToks) {
      if (same.length > 1) {
        conflicts.push({
          key: seat,
          detail: `"${same[0].name}" recorded as winner for ${same.length} parties (${same.map((s) => s.party).join(", ")}) on one seat`,
        });
        for (const s of same) conflicted.add(s);
      }
    }
  }

  const kept = candidates.filter((c) => !conflicted.has(c));
  return {
    candidates: kept,
    skipped,
    conflicts,
    mergedRowCount: usableRows - candidates.length,
  };
}
