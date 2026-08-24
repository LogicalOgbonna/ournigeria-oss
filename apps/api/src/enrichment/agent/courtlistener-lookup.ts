import type { ClientBase } from "pg";
import { submitStructuredCreate } from "./submit-structured-create";
import type { ProposalSourceInput } from "./profile.types";

/**
 * Deterministic US-court-records lookup against CourtListener / RECAP
 * (Free Law Project). Plan 59. Queries the v4 search API by official name and,
 * for every hit where the official is a NAMED PARTY with a DISTINCTIVE name,
 * files an `official_legal_cases` create-proposal with a docket backlink, for
 * human review.
 *
 * Scope rules (plan 59 §B.2 — learned the hard way):
 *  - A full-text court match is a LEAD, not a fact.
 *  - Auto-file ONLY party-role matches on distinctive names (the clean,
 *    Odunzeh-shaped hits). Party matches on all-common names ("Mohammed Ahmed"
 *    matching a US bankruptcy) are namesake bait → leads, not proposals.
 *    COMMON_TOKENS is data-validated against the 2027 candidate population
 *    (packages/scripts/court-scan/validate_name_lists.py).
 *  - "named-in" hits (person appears in the record but is not a party — brief
 *    name-drops, forfeiture claimants, missing party lists) → leads. These can
 *    be the most valuable finds (e.g. a bribery case naming an official who
 *    was never charged), so leads are PERSISTED to enrichment_attempts.note
 *    (merged, best-effort) and always returned — never dropped.
 *  - status is NEVER inferred as convicted/acquitted — RECAP metadata carries
 *    no disposition. Every proposal is needsHuman=true.
 *  - role: authoritative party-type from the /parties/ API when reachable,
 *    else caption inference, else null — never asserted beyond the record.
 */

const SEARCH_URL = "https://www.courtlistener.com/api/rest/v4/search/";
const SITE = "https://www.courtlistener.com";
/** Cursor pages to follow per query (20 results/page). */
const MAX_PAGES = 3;
/** Leads stored in the enrichment_attempts note (full list is still returned). */
const NOTE_LEADS_CAP = 20;
/** Authoritative-role (/parties/) fetches per run — filed hits beyond this fall
 *  back to caption inference, keeping one lookup's spend bounded vs the 50/hr cap. */
const PARTIES_FETCH_CAP = 5;
/** Standalone-run re-check cadence (the sweeper overrides with its own policy). */
const RECHECK_DAYS = 90;

export interface CourtListenerDeps {
  /** Injected so tests can mock the network. Default: fetchJsonDefault. */
  fetchJson: (url: string, headers?: Record<string, string>) => Promise<unknown>;
  now: () => Date;
  agentRunId?: string;
  /** CourtListener API token (Authorization: Token <t>) — lifts the rate limit. */
  token?: string;
  /**
   * When true, spend one extra request per lead (first 3) asking `type=rd`
   * WHERE in the docket the name appears (document hint). Off by default —
   * the search API budget is 50/hour.
   */
  deepLeads?: boolean;
}

export interface CourtListenerLead {
  caseName: string;
  court: string;
  docketNumber: string;
  url: string;
  caseType: string;
  reason: string;
  discoveredAt: string;
  /** Reviewer context straight off the docket metadata (when present). */
  judge?: string;
  cause?: string;
  suitNature?: string;
  dateFiled?: string;
  pacerCaseId?: string;
  /** deepLeads: which docket document mentions the name (best-effort). */
  documentHint?: string;
}

export interface CourtListenerResult {
  filed: number;
  skipped: { key: string; reason: string }[];
  /** named-in / non-party / common-name hits — human-triage leads, NOT filed. */
  leads: CourtListenerLead[];
  /** API-reported total result count across all queries (pre-truncation). */
  totalCount: number;
  /** True when more results existed than the pages we fetched. */
  truncated: boolean;
  /** True when the leads/summary were persisted to enrichment_attempts. */
  attemptRecorded: boolean;
  /** Search-API requests actually spent (rate-budget accounting: 50/hour cap). */
  apiRequests: number;
  /** Non-fatal degradations (e.g. dedup unavailable) — surface, don't hide. */
  warnings: string[];
}

interface RawResult {
  caseName?: unknown;
  party?: unknown;
  court?: unknown;
  court_id?: unknown;
  docketNumber?: unknown;
  docket_id?: unknown;
  dateFiled?: unknown;
  dateTerminated?: unknown;
  docket_absolute_url?: unknown;
  assignedTo?: unknown;
  cause?: unknown;
  suitNature?: unknown;
  pacer_case_id?: unknown;
}

/** Caption boilerplate dropped unconditionally before name-matching. */
const CAPTION_STOP = new Set(["united", "states", "america", "usa", "us", "of", "the", "v", "vs", "et", "al"]);

/**
 * Honorifics/titles. Stripped only from the FRONT of a name, and only while
 * >=2 tokens remain — "Prince Nnamdi" keeps "prince" (it may be the given
 * name), while "Chief Hon Dr Uche Ben Odunzeh" strips down to the name proper.
 */
const HONORIFICS = new Set([
  "chief", "alhaji", "alhaja", "hon", "honourable", "honorable", "sen", "senator",
  "dr", "barr", "barrister", "engr", "engineer", "prof", "professor", "arc",
  "mr", "mrs", "ms", "miss", "sir", "dame", "otunba", "oba", "hrh", "hrm",
  "gen", "general", "col", "colonel", "capt", "captain", "major", "air", "cdre",
  "comrade", "pastor", "rev", "reverend", "elder", "deacon", "evang", "evangelist",
  "prince", "princess", "amb", "ambassador", "chf", "rtd", "jp", "mni", "san", "phd",
]);

/**
 * Very common Nigerian + Western name tokens. A party match made ONLY of these
 * is namesake bait (verified: "Mohammed Ahmed" matched 7 unrelated US
 * bankruptcies; "Donald Duke" matched 6; "Adeleke Olanrewaju" matched a CA
 * debarment). Data-validated against the 1,920-name 2027 candidate population
 * (>=8 bearers → listed); re-run validate_name_lists.py when tuning.
 */
const COMMON_TOKENS = new Set([
  // ubiquitous Muslim/Northern given names + variants
  "mohammed", "muhammed", "muhammad", "mohammad", "ahmed", "ahmad", "ali", "ibrahim",
  "musa", "sani", "umar", "usman", "abubakar", "hassan", "hussain", "hussein", "khalid",
  "bello", "abdullahi", "abdullah", "abdulla", "adamu", "bala", "garba", "yakubu",
  "suleiman", "sulaiman", "yusuf", "aliyu", "abdul", "lateef", "ismail", "isah", "isa",
  "idris", "shehu", "salisu", "kabiru", "kabir", "tanko", "danjuma", "aminu", "nasir",
  "mustapha", "yahaya", "lawal", "baba", "abba",
  // ubiquitous Christian/Southern + Western given names
  "emmanuel", "john", "joseph", "james", "peter", "paul", "samuel", "david", "daniel",
  "michael", "anthony", "sunday", "monday", "victor", "victoria", "mary", "grace",
  "blessing", "donald", "philip", "phillip", "francis", "patrick", "christopher",
  "stephen", "steven", "george", "charles", "richard", "robert", "william", "thomas",
  "solomon", "felix", "ifeanyi", "adekunle", "adebayo", "olanrewaju", "adeleke",
  // very common surnames (US-collision-prone)
  "smith", "brown", "johnson", "williams", "jones", "duke", "obi", "eze", "okafor",
  "okeke", "okoro", "edet", "effiong", "okon", "bassey", "etim", "asuquo", "mahmud",
]);

/** lowercase, strip punctuation, collapse whitespace. */
export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Content tokens of a name: caption stop-words removed everywhere; honorifics
 * removed only from the front, keeping at least 2 tokens.
 */
export function nameTokens(s: string): string[] {
  const toks = normalizeName(s).split(" ").filter((t) => t && !CAPTION_STOP.has(t));
  // Strip leading honorifics only while >=2 tokens would remain — "Prince
  // Nnamdi" keeps "prince" (may be the given name), "Chief Uche Odunzeh" strips.
  let start = 0;
  while (start < toks.length && HONORIFICS.has(toks[start]) && toks.length - start - 1 >= 2) start++;
  return toks.slice(start);
}

/** True when every content token of the official's name appears in a party's name. */
export function partyMatchesOfficial(officialName: string, partyName: string): boolean {
  const off = nameTokens(officialName);
  if (off.length === 0) return false;
  const party = new Set(nameTokens(partyName));
  return off.every((t) => party.has(t));
}

/**
 * A name is distinctive enough to auto-file when it has >=2 content tokens and
 * at least one of them is NOT a ubiquitous name token.
 */
export function isDistinctiveName(name: string): boolean {
  const toks = nameTokens(name);
  return toks.length >= 2 && toks.some((t) => !COMMON_TOKENS.has(t));
}

/** Property/in-rem indicators — a `United States v. <property>` forfeiture, not a person. */
const PROPERTY = /(real property|\bm\/?y\b|\$|\bfunds\b|\bassets\b|located|vehicle|premises|parcel|proceeds|vessel|aircraft|one\s+\d|approximately)/i;

/** Criminal caption prefixes — courts vary: "United States v.", "United States of America v.", "USA v.", "U.S. v.". */
const CRIMINAL_PREFIXES = ["united states v", "united states of america v", "usa v", "u s a v", "u s v"];

/**
 * Map a docket to the chk_legal_case_type enum. Only `criminal`|`civil` are
 * emitted (forfeiture and bankruptcy record as `civil`). Never guesses beyond.
 */
export function classifyCaseType(caseName: string, courtId: string): "criminal" | "civil" {
  if (/^[a-z]{2,4}b$/.test(String(courtId || ""))) return "civil"; // bankruptcy court
  const cn = normalizeName(caseName);
  if (CRIMINAL_PREFIXES.some((p) => cn.startsWith(p))) {
    return PROPERTY.test(caseName) ? "civil" : "criminal"; // US v. property = forfeiture
  }
  return "civil";
}

/**
 * Official's role in the matter, derived only from what the caption proves:
 * criminal `US v. X` party-match = defendant; civil `A v. B` = whichever side
 * of the caption carries the matched party's tokens; anything else = null
 * (never assert a role the record doesn't prove).
 */
export function roleFromCaption(
  caseName: string,
  caseType: "criminal" | "civil",
  matchedParty: string,
): "defendant" | "plaintiff" | null {
  const cn = normalizeName(caseName);
  if (caseType === "criminal" && CRIMINAL_PREFIXES.some((p) => cn.startsWith(p))) {
    return "defendant";
  }
  const sides = cn.split(/\bv\b/);
  if (sides.length === 2) {
    const party = nameTokens(matchedParty);
    if (party.length) {
      const pset = new Set(party);
      // Captions abbreviate ("Oyenuga v. Sowore" vs party "Omoyele Sowore"), so
      // a side matches when either name subsumes the other.
      const inSide = (side: string) => {
        const st = nameTokens(side);
        if (!st.length) return false;
        const sset = new Set(st);
        return st.every((t) => pset.has(t)) || party.every((t) => sset.has(t));
      };
      if (inSide(sides[0]) && !inSide(sides[1])) return "plaintiff";
      if (inSide(sides[1]) && !inSide(sides[0])) return "defendant";
    }
  }
  return null;
}

/** Allowed role values on official_legal_cases.role (soften anything else). */
const ROLE_MAP: Record<string, string> = {
  defendant: "defendant", plaintiff: "plaintiff", claimant: "claimant",
  respondent: "respondent", petitioner: "plaintiff", "counter-claimant": "claimant",
};

/**
 * Default network impl: global fetch → JSON. Retries 429/503 up to twice when
 * the server's Retry-After is short (<=20s) — the search API throttles at
 * 50 req/hour, so a long wait means "give up and report".
 */
export async function fetchJsonDefault(url: string, headers?: Record<string, string>): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    // 45s hard timeout — a hung connection must not stall the (serial) sweeper loop.
    const res = await fetch(url, { ...(headers ? { headers } : {}), signal: AbortSignal.timeout(45_000) });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      const after = Number.parseInt(res.headers.get("retry-after") ?? "", 10);
      if (Number.isFinite(after) && after > 0 && after <= 20) {
        await new Promise((r) => setTimeout(r, after * 1000));
        continue;
      }
      throw new Error(`courtlistener throttled (429), retry-after ${after || "unknown"}s`);
    }
    throw new Error(`courtlistener responded ${res.status}`);
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** v4 count may be a bare int or an ES-style {value} object. */
function countOf(body: Record<string, unknown> | null): number {
  const c = body?.count as unknown;
  if (typeof c === "number") return c;
  if (c && typeof c === "object" && typeof (c as { value?: unknown }).value === "number") {
    return (c as { value: number }).value;
  }
  return 0;
}

/**
 * Search queries for an official: exact phrase over the CLEANED name (honorifics
 * stripped — "Chief Uche Ben Odunzeh" must query as "uche ben odunzeh" or real
 * dockets never match); first+last fallback comes later.
 */
function phraseUrl(name: string): string {
  const cleaned = nameTokens(name).join(" ") || normalizeName(name);
  return `${SEARCH_URL}?type=r&q=${encodeURIComponent(`"${cleaned}"`)}`;
}

/** Docket id from `/docket/4211676/united-states-v-odunzeh/`. */
function docketIdOf(docketPath: string): string {
  const m = /\/docket\/(\d+)\//.exec(docketPath);
  return m ? m[1] : "";
}

interface PageFetch {
  results: RawResult[];
  total: number;
  truncated: boolean;
  requests: number;
}

/** Fetch up to MAX_PAGES of results for one query, following the `next` cursor. */
async function fetchPages(
  url: string,
  deps: CourtListenerDeps,
  headers: Record<string, string> | undefined,
): Promise<PageFetch> {
  const results: RawResult[] = [];
  let total = 0;
  let requests = 0;
  let next: string | null = url;
  for (let page = 0; next && page < MAX_PAGES; page++) {
    const body = (await deps.fetchJson(next, headers)) as Record<string, unknown> | null;
    requests++;
    const rows = Array.isArray(body?.results) ? (body!.results as RawResult[]) : [];
    results.push(...rows);
    total = Math.max(total, countOf(body));
    const n = typeof body?.next === "string" ? (body.next as string) : "";
    // SECURITY: follow the cursor ONLY back to CourtListener — the Authorization
    // token must never be replayed to a URL an API response chose for us.
    next = n.startsWith(`${SITE}/`) ? n : null;
  }
  return { results, total, truncated: Boolean(next), requests };
}

export async function lookupCourtRecords(
  client: ClientBase,
  official: { id: string; name: string },
  deps: CourtListenerDeps,
): Promise<CourtListenerResult> {
  const headers = deps.token ? { Authorization: `Token ${deps.token}` } : undefined;

  // Primary query: the full (cleaned) name as an exact phrase.
  const primary = await fetchPages(phraseUrl(official.name), deps, headers);
  let { results, total, truncated } = primary;
  let apiRequests = primary.requests;

  // Recall fallback: names with 3+ tokens often appear without the middle name
  // ("Uche Odunzeh" for "Uche Ben Odunzeh"). Only spent when the full-name
  // query found nothing — the search API budget is 50 req/hour.
  const toks = nameTokens(official.name);
  if (results.length === 0 && toks.length >= 3) {
    const variant = `${toks[0]} ${toks[toks.length - 1]}`;
    try {
      const v = await fetchPages(phraseUrl(variant), deps, headers);
      apiRequests += v.requests;
      results = v.results;
      total = Math.max(total, v.total);
      truncated = truncated || v.truncated;
    } catch {
      apiRequests += 1; // the failed attempt still spent a request
    }
  }

  const out: CourtListenerResult = {
    filed: 0, skipped: [], leads: [], totalCount: total, truncated,
    attemptRecorded: false, apiRequests, warnings: [],
  };
  const warnOnce = (w: string) => {
    if (!out.warnings.includes(w)) out.warnings.push(w);
  };
  const distinctive = isDistinctiveName(official.name);
  /** Within-run dedup — CL returns duplicate dockets (same matter, two docket ids). */
  const seen = new Set<string>();
  let partiesFetches = 0;

  for (const r of results) {
    const caseName = str(r.caseName);
    const docketNumber = str(r.docketNumber);
    const key = docketNumber || caseName || "unknown";
    try {
      if (!caseName) {
        out.skipped.push({ key, reason: "result has no caseName" });
        continue;
      }
      const runKey = `${docketNumber}|${normalizeName(caseName)}`;
      if (seen.has(runKey)) {
        out.skipped.push({ key, reason: "duplicate docket in this result set" });
        continue;
      }
      seen.add(runKey);

      const parties = Array.isArray(r.party) ? (r.party as unknown[]).map(str).filter(Boolean) : [];
      const court = str(r.court);
      const courtId = str(r.court_id);
      const caseType = classifyCaseType(caseName, courtId);
      const docketPath = str(r.docket_absolute_url);
      const backlinkUrl = docketPath ? SITE + docketPath : "";
      // Reviewer context off the docket metadata — cheap and often decisive
      // ("suitNature: 890 RICO" reads very differently from a records dispute).
      const judge = str(r.assignedTo);
      const cause = str(r.cause);
      const suitNature = str(r.suitNature);
      const pacerCaseId = str(r.pacer_case_id);
      const leadExtra = {
        ...(judge ? { judge } : {}),
        ...(cause ? { cause } : {}),
        ...(suitNature ? { suitNature } : {}),
        ...(str(r.dateFiled) ? { dateFiled: str(r.dateFiled) } : {}),
        ...(pacerCaseId ? { pacerCaseId } : {}),
      };
      const discoveredAt = deps.now().toISOString();

      // Name-guard: the official must be a NAMED PARTY, on a DISTINCTIVE name.
      // Everything else is a lead for human triage — never silently dropped.
      const matched = parties.find((p) => partyMatchesOfficial(official.name, p));
      if (!matched || !distinctive) {
        out.leads.push({
          caseName, court, docketNumber, url: backlinkUrl || SITE, caseType, discoveredAt, ...leadExtra,
          reason: !matched
            ? (parties.length ? "named-in only (not a party name-match)" : "full-text hit, no party list")
            : "party match on an all-common name — likely namesake, needs human",
        });
        continue;
      }

      // Backlink is REQUIRED on a filed proposal (plan 58 §3.2) — a hit with no
      // docket URL cannot cite its source, so it degrades to a lead.
      if (!backlinkUrl) {
        out.leads.push({
          caseName, court, docketNumber, url: SITE, caseType, discoveredAt, ...leadExtra,
          reason: "party match but no docket URL — backlink required to file",
        });
        continue;
      }

      // Dedup vs live rows AND still-pending/approved proposals (re-runs must
      // not spam the review queue). BEST-EFFORT: if the agent role lacks a
      // SELECT grant here, degrade to filing with a warning — a duplicate a
      // reviewer can reject beats a silent total no-op.
      try {
        const dupLive = await client.query(
          "SELECT 1 FROM official_legal_cases WHERE official_id = $1 AND case_number = $2",
          [official.id, docketNumber],
        );
        if ((dupLive.rows?.length ?? 0) > 0) {
          out.skipped.push({ key, reason: `case_number already exists: ${docketNumber}` });
          continue;
        }
        const dupPending = await client.query(
          `SELECT 1 FROM change_proposals
            WHERE target_table = 'official_legal_cases'
              AND status IN ('pending','needs_human','approved')
              AND proposed_value->>'officialId' = $1
              AND proposed_value->>'caseNumber' = $2`,
          [official.id, docketNumber],
        );
        if ((dupPending.rows?.length ?? 0) > 0) {
          out.skipped.push({ key, reason: `pending proposal already exists: ${docketNumber}` });
          continue;
        }
      } catch (e) {
        warnOnce(`dedup unavailable (${e instanceof Error ? e.message : String(e)}) — filing without dedup`);
      }

      // Role: authoritative party-type from the /parties/ API (1 extra request,
      // capped per run) — falls back to caption inference on any failure/overflow.
      let role: string | null = null;
      const docketId = docketIdOf(docketPath);
      if (docketId && partiesFetches < PARTIES_FETCH_CAP) {
        partiesFetches++;
        try {
          const pbody = (await deps.fetchJson(
            `${SITE}/api/rest/v4/parties/?docket=${docketId}`,
            headers,
          )) as { results?: Array<{ name?: unknown; party_types?: Array<{ name?: unknown }> }> } | null;
          out.apiRequests += 1;
          const prow = (pbody?.results ?? []).find(
            (p) => typeof p?.name === "string" && partyMatchesOfficial(official.name, p.name as string),
          );
          const ptype = str(prow?.party_types?.[0]?.name).toLowerCase();
          role = ROLE_MAP[ptype] ?? null;
        } catch {
          out.apiRequests += 1;
        }
      }
      if (!role) role = roleFromCaption(caseName, caseType, matched);

      const payload: Record<string, unknown> = {
        officialId: official.id,
        title: caseName,
        caseType,
        // Conservative: RECAP metadata has NO disposition. A criminal defendant
        // is at least "charged"; a civil matter is pending ("on_trial"). Never
        // "convicted". The human reviewer sets the real outcome from the docket.
        status: caseType === "criminal" ? "charged" : "on_trial",
        // A docket party listing is an APPEARANCE (plan 58 §3.8) — not adjudicated.
        recordKind: "appearance",
      };
      if (role) payload.role = role;
      if (court) payload.forum = court;
      if (docketNumber) payload.caseNumber = docketNumber;
      const filedDate = str(r.dateFiled);
      if (filedDate) payload.filedDate = filedDate;
      const resolvedDate = str(r.dateTerminated);
      if (resolvedDate) {
        payload.resolvedDate = resolvedDate;
        // Honesty marker: the docket is CLOSED but RECAP metadata carries no
        // disposition, and chk_legal_status has no "closed, outcome unknown".
        payload.outcome = `Docket terminated ${resolvedDate} — disposition not in RECAP metadata; verify from the docket.`;
      }

      const snippetBits = [caseName, court, judge && `Judge ${judge}`, suitNature, cause]
        .filter(Boolean)
        .join(" — ");
      const backlink: ProposalSourceInput = {
        url: backlinkUrl,
        publisher: "courtlistener.com",
        snippet: snippetBits,
        format: "html",
        locator: docketNumber || undefined,
        retrievedAt: deps.now().toISOString(),
      };

      await submitStructuredCreate(client, {
        domain: "legal_cases",
        payload,
        confidence: "medium",
        needsHuman: true, // always — outcome + relevance need a human to read the docket
        reasoning:
          `Sourced from CourtListener/RECAP (Free Law Project); official matched party "${matched}"` +
          (pacerCaseId ? ` (PACER case id ${pacerCaseId})` : ""),
        agentRunId: deps.agentRunId,
        sources: [backlink],
      });
      out.filed += 1;
    } catch (e) {
      out.skipped.push({ key, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  // deepLeads: locate WHERE the name appears for the first few leads (opt-in —
  // each hint costs a search request).
  if (deps.deepLeads) {
    const cleaned = nameTokens(official.name).join(" ");
    for (const lead of out.leads.slice(0, 3)) {
      const id = docketIdOf(lead.url);
      if (!id) continue;
      try {
        const body = (await deps.fetchJson(
          `${SEARCH_URL}?type=rd&q=${encodeURIComponent(`"${cleaned}"`)}&docket_id=${id}`,
          headers,
        )) as { results?: Array<{ description?: unknown; absolute_url?: unknown }> } | null;
        out.apiRequests += 1;
        const doc = body?.results?.[0];
        if (doc) {
          const desc = str(doc.description);
          const durl = str(doc.absolute_url);
          lead.documentHint = `${desc}${durl ? ` (${SITE}${durl})` : ""}`.trim() || undefined;
        }
      } catch {
        out.apiRequests += 1;
      }
    }
  }

  // Persist the attempt + leads so (a) the gap-finder knows this official was
  // checked and (b) named-in leads survive beyond stdout. Best-effort; wrapped
  // in a transaction so the read-merge-write cannot interleave with a
  // concurrent run. Note: status stays within the sweeper's vocabulary
  // (filled|nothing_found) — "nothing filed but leads exist" is expressed by
  // note.leadsStored > 0, not a new status.
  try {
    await client.query("BEGIN");
    try {
      // Previously STORED leads are never evicted: they may be the Jefferson-class
      // discovery a past run surfaced. Old survivors first, then this run's fresh
      // leads fill whatever cap room remains (a noisy namesake run can add less,
      // but can never erase history).
      const prev = await client.query(
        "SELECT note FROM enrichment_attempts WHERE official_id = $1 AND category = 'legal_case' FOR UPDATE",
        [official.id],
      );
      const prevNote = prev.rows?.[0]?.note as string | undefined;
      let oldLeads: CourtListenerLead[] = [];
      if (prevNote) {
        try {
          oldLeads = (JSON.parse(prevNote) as { leads?: CourtListenerLead[] }).leads ?? [];
        } catch {
          // unreadable/legacy note — proceed with this run's leads only
        }
      }
      const have = new Set(oldLeads.map((l) => `${l.url}|${l.docketNumber}`));
      const mergedLeads = [
        ...oldLeads,
        ...out.leads.filter((l) => !have.has(`${l.url}|${l.docketNumber}`)),
      ].slice(0, NOTE_LEADS_CAP);

      const note = JSON.stringify({
        source: "courtlistener",
        usChecked: true,
        totalCount: out.totalCount,
        truncated: out.truncated,
        filed: out.filed,
        apiRequests: out.apiRequests,
        warnings: out.warnings,
        leads: mergedLeads,
        leadsThisRun: out.leads.length,
        leadsStored: mergedLeads.length,
        at: deps.now().toISOString(),
      });
      // next_eligible_at: without this, a fresh row defaults to now() and the
      // sweeper's gap-finder would re-run this official forever. The sweeper's
      // own recordOutcome (when it drives the run) overwrites with its policy.
      await client.query(
        `INSERT INTO enrichment_attempts (official_id, category, status, proposal_count, note, last_attempted_at, next_eligible_at, updated_at)
         VALUES ($1, 'legal_case', $2, $3, $4, now(), now() + interval '${RECHECK_DAYS} days', now())
         ON CONFLICT (official_id, category) DO UPDATE
           SET status = EXCLUDED.status, proposal_count = EXCLUDED.proposal_count,
               note = EXCLUDED.note, last_attempted_at = now(),
               next_eligible_at = now() + interval '${RECHECK_DAYS} days', updated_at = now()`,
        [official.id, out.filed > 0 ? "filled" : "nothing_found", out.filed, note],
      );
      await client.query("COMMIT");
      out.attemptRecorded = true;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    }
  } catch {
    out.attemptRecorded = false;
  }

  return out;
}
