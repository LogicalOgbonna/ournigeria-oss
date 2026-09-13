import { adminFetch } from "@/lib/api";
import type { AuditEvent } from "@/lib/campaigns";
import type { Tone } from "@/lib/tone";

// `errorMessage` lives next to ApiError in lib/api.ts; re-exported here so
// election pages can keep importing everything they need from one module.
export { errorMessage } from "@/lib/api";

// ---------- types (mirror apps/api/src/election/admin-elections.*) ----------

/** campaigns.election_type vocabulary MINUS 'other' (plan 68 D10.6). */
export type ElectionOffice =
  | "presidential"
  | "gubernatorial"
  | "senatorial"
  | "house_of_reps"
  | "state_assembly"
  | "lga_chairman"
  | "councilor";
export const ELECTION_OFFICES: ElectionOffice[] = [
  "presidential",
  "gubernatorial",
  "senatorial",
  "house_of_reps",
  "state_assembly",
  "lga_chairman",
  "councilor",
];
export const OFFICE_LABEL: Record<ElectionOffice, string> = {
  presidential: "Presidential",
  gubernatorial: "Governor",
  senatorial: "Senate",
  house_of_reps: "House of Reps",
  state_assembly: "State Assembly",
  lga_chairman: "LGA Chairman",
  councilor: "Councillor",
};

export type ElectionRound = "general" | "runoff" | "supplementary" | "rerun" | "bye";
export const ELECTION_ROUNDS: ElectionRound[] = [
  "general",
  "runoff",
  "supplementary",
  "rerun",
  "bye",
];
export const ROUND_LABEL: Record<ElectionRound, string> = {
  general: "General",
  runoff: "Run-off",
  supplementary: "Supplementary",
  rerun: "Re-run",
  bye: "Bye-election",
};

export type ElectionStatus = "scheduled" | "postponed" | "concluded" | "cancelled";
export const ELECTION_STATUSES: ElectionStatus[] = [
  "scheduled",
  "postponed",
  "concluded",
  "cancelled",
];

export type DatePrecision = "year" | "month" | "day";
export const DATE_PRECISIONS: DatePrecision[] = ["year", "month", "day"];
export const PRECISION_LABEL: Record<DatePrecision, string> = {
  year: "Year only",
  month: "Month known",
  day: "Exact day",
};

export type ElectionReviewStatus = "unreviewed" | "reviewed" | "disputed";

/**
 * D4 + D10.3 as amended by E1.2/E1.4 — ONE legal encoding per precision:
 * year ⇒ date NULL; month ⇒ date = YYYY-MM-01; day ⇒ full date. Mirrors
 * `dateEncodingError` in admin-elections.schemas.ts so the form can reject
 * a bad pair with a named field error before the API does.
 */
export function dateEncodingError(
  precision: DatePrecision,
  electionDate: string | null,
): string | null {
  if (precision === "year") {
    return electionDate ? "a year-precision event must not carry a date" : null;
  }
  if (!electionDate) return `${precision} precision requires a date`;
  if (precision === "month" && !/-01$/.test(electionDate)) {
    return "month precision stores the first of the month (YYYY-MM-01)";
  }
  return null;
}

/** mirrors SLUG_RE in admin-elections.schemas.ts. */
export const ELECTION_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ElectionRow {
  id: string;
  slug: string;
  office: ElectionOffice;
  year: number;
  round: ElectionRound;
  /** @db.Date serialized as an ISO timestamp — slice(0, 10) for the YYYY-MM-DD. */
  electionDate: string | null;
  datePrecision: DatePrecision;
  label: string | null;
  stateCode: string | null;
  constituencyCode: string | null;
  lgaCode: string | null;
  wardCode: string | null;
  status: ElectionStatus;
  published: boolean;
  confidence: "high" | "medium" | "low";
  sourceType: string;
  sourceUrl: string | null;
  reviewStatus: ElectionReviewStatus;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `list()` includes the resolved state, carve-out codes and attachment counts. */
export interface ElectionListRow extends ElectionRow {
  state: { code: string; name: string } | null;
  excludedStates: { stateCode: string }[];
  _count: { campaigns: number; officialElections: number };
}

/** `get()` additionally resolves every scope row, names the carve-outs and carries the audit tail. */
export interface ElectionDetail extends ElectionRow {
  state: { code: string; name: string } | null;
  constituency: { code: string; name: string; type: string } | null;
  lga: { code: string; name: string } | null;
  ward: { code: string; name: string } | null;
  excludedStates: { stateCode: string; state: { code: string; name: string } }[];
  _count: { campaigns: number; officialElections: number };
  audit: AuditEvent[];
}

// ---------- status chip ----------

export type { Tone };

/**
 * One human label for the (published, status, reviewStatus) triple. The chip
 * is draft/published × scheduled/postponed/concluded/cancelled (plan 68 §6):
 *   - `publish` is the only way to published; PATCH on a published row flips
 *     reviewStatus back to "unreviewed" — the reviewer needs to see that.
 *   - concluded/cancelled drop off the gate automatically, whatever
 *     `published` says, so the terminal statuses win the label.
 */
export function electionStatusLabel(e: {
  published: boolean;
  status: ElectionStatus;
  reviewStatus: ElectionReviewStatus;
}): { label: string; tone: Tone } {
  if (e.status === "cancelled") return { label: "Cancelled", tone: "danger" };
  if (e.status === "concluded") return { label: "Concluded", tone: "neutral" };
  const base = e.published ? "Published" : "Draft";
  if (e.status === "postponed") return { label: `${base} · postponed`, tone: "warning" };
  // Published but edited since the publish — the reviewer needs to re-confirm.
  if (e.published && e.reviewStatus !== "reviewed") {
    return { label: "Published · re-review", tone: "warning" };
  }
  return e.published
    ? { label: "Published", tone: "success" }
    : { label: "Draft", tone: "neutral" };
}

/** "16 Jan 2027" | "Jan 2027" | "2027" — honest about the stored precision. */
export function displayDate(e: {
  year: number;
  electionDate: string | null;
  datePrecision: DatePrecision;
}): string {
  const iso = e.electionDate?.slice(0, 10);
  if (!iso || e.datePrecision === "year") return String(e.year);
  const [y, m, d] = iso.split("-").map(Number);
  // Formatted via UTC pieces, never `new Date(iso).toLocaleString()`: a @db.Date
  // is UTC midnight and a western timezone would render the previous day.
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-NG", {
    month: "short",
    timeZone: "UTC",
  });
  return e.datePrecision === "month" ? `${month} ${y}` : `${d} ${month} ${y}`;
}

// ---------- fetchers ----------

/** Mirrors listQuerySchema in admin-elections.schemas.ts. */
export interface ElectionListParams {
  year?: number;
  office?: ElectionOffice;
  round?: ElectionRound;
  status?: ElectionStatus;
  published?: "true" | "false";
  state?: string | null;
  q?: string | null;
  limit?: number;
  offset?: number;
}

/** Drops null/undefined/empty values so a cleared filter leaves the query string. */
const q = (
  params: Record<string, string | number | boolean | null | undefined>,
): string =>
  new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();

export type ElectionVerb = "publish" | "unpublish" | "conclude" | "cancel";

export const electionsApi = {
  list: (params: ElectionListParams) =>
    adminFetch(`/elections?${q({ ...params })}`) as Promise<{
      total: number;
      rows: ElectionListRow[];
    }>,
  get: (id: string) => adminFetch(`/elections/${id}`) as Promise<ElectionDetail>,
  create: (body: Record<string, unknown>) =>
    adminFetch("/elections", {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<ElectionRow>,
  patch: (id: string, body: Record<string, unknown>) =>
    adminFetch(`/elections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }) as Promise<ElectionRow>,
  remove: (id: string) =>
    adminFetch(`/elections/${id}`, { method: "DELETE" }) as Promise<{ deleted: true }>,
  /** The four review verbs all take the same mandatory {reason} body. */
  verb: (id: string, verb: ElectionVerb, body: { reason: string }) =>
    adminFetch(`/elections/${id}/${verb}`, {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<ElectionRow>,
  /** Kill switch (D10.8): writes ONLY the elections.gate_enabled setting. */
  setGate: (enabled: boolean) =>
    adminFetch("/elections/gate", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }) as Promise<{ enabled: boolean }>,
};
