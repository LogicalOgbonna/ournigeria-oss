import {
  SCOPE_FOR,
  type CampaignListParams,
  type CampaignStatus,
  type ElectionType,
  type RaceKey,
} from "@/lib/campaigns";

/**
 * Rail order — the pure half of /dashboard/campaigns/order.
 *
 * The rail is `campaigns.display_order` within ONE race key (electionType,
 * year, and the single scope column that race type needs). `PUT
 * /api/admin/campaigns/order` is a full renumber, not a patch:
 * `AdminCampaignsService.order` nulls `display_order` for every row in the race
 * and then writes 1…n over the `ids` it was given, in order. So the payload has
 * to carry the WHOLE ranked list every time, and any row left out becomes
 * unranked. `uq_campaigns_race_display_order` (partial, NULLS NOT DISTINCT)
 * makes two rows on the same rank impossible, which is why the server
 * renumbers instead of swapping.
 */

/** The minimum a row needs to be placed on the rail. */
export interface OrderableRow {
  id: string;
  displayOrder: number | null;
  candidateName: string;
}

export type Bucket = "ranked" | "unranked";

/** The page's whole editable state: the rail, and everything off it. */
export interface Lists<T> {
  ranked: T[];
  unranked: T[];
}

/**
 * The statuses a ticket can hold and still be worth a rank.
 *
 * The API itself is wider than this — `order` accepts EVERY row that shares the
 * race key, whatever its status — but `withdrawn` and `dissolved` are terminal
 * (`retire` has no way back; `approve` only accepts draft/active/concluded/
 * suspended), so a rank on one of them could never reach the public rail.
 * `draft` and `suspended` are kept: both can become `active` later, and ranking
 * a draft before it is approved is the point of doing this ahead of an election.
 */
export const ORDERABLE_STATUSES: readonly CampaignStatus[] = [
  "draft",
  "active",
  "concluded",
  "suspended",
];

export function isOrderable(row: { status: CampaignStatus }): boolean {
  return ORDERABLE_STATUSES.includes(row.status);
}

/**
 * Split a race's tickets into the rail and the leftovers.
 *
 * Ranked rows keep the server's numbering (ties broken by id so the list is
 * stable across reloads — the unique index makes a real tie impossible, but a
 * mid-flight write should not shuffle the page). Unranked rows are alphabetical
 * by candidate: there is no meaningful order to preserve, and a name is what an
 * operator scans for.
 */
export function splitLists<T extends OrderableRow>(rows: readonly T[]): Lists<T> {
  const ranked = rows
    .filter((r) => r.displayOrder !== null)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.id.localeCompare(b.id));
  const unranked = rows
    .filter((r) => r.displayOrder === null)
    .sort((a, b) => a.candidateName.localeCompare(b.candidateName) || a.id.localeCompare(b.id));
  return { ranked, unranked };
}

export function bucketOf<T extends { id: string }>(lists: Lists<T>, id: string): Bucket | null {
  if (lists.ranked.some((r) => r.id === id)) return "ranked";
  if (lists.unranked.some((r) => r.id === id)) return "unranked";
  return null;
}

/**
 * Move one row to `index` of `bucket`. The index is where the row lands in the
 * target list AFTER it has been pulled out of its old one, which is the same
 * convention dnd-kit's `arrayMove` uses — so a drag that reports "over the
 * third card" can pass 2 straight through.
 *
 * A move that changes nothing (unknown id, same bucket and same index, index
 * clamped back onto itself) returns the SAME object, so callers can use
 * identity to decide whether anything happened.
 */
export function moveTo<T extends { id: string }>(
  lists: Lists<T>,
  id: string,
  bucket: Bucket,
  index: number,
): Lists<T> {
  const from = bucketOf(lists, id);
  if (from === null) return lists;
  const fromIndex = lists[from].findIndex((r) => r.id === id);
  const row = lists[from][fromIndex];

  const source = lists[from].slice();
  source.splice(fromIndex, 1);
  const target = from === bucket ? source : lists[bucket].slice();
  const at = Math.min(Math.max(index, 0), target.length);
  if (from === bucket && at === fromIndex) return lists;
  target.splice(at, 0, row);

  return from === bucket
    ? ({ ...lists, [bucket]: target } as Lists<T>)
    : ({ ...lists, [from]: source, [bucket]: target } as Lists<T>);
}

/**
 * One step up (-1) or down (+1) inside whichever list the row is already in.
 * At either end of the list nothing moves — leaving the rail is an explicit
 * button, never an accidental over-scroll.
 */
export function nudge<T extends { id: string }>(lists: Lists<T>, id: string, dir: -1 | 1): Lists<T> {
  const bucket = bucketOf(lists, id);
  if (bucket === null) return lists;
  const index = lists[bucket].findIndex((r) => r.id === id);
  const target = index + dir;
  if (target < 0 || target >= lists[bucket].length) return lists;
  return moveTo(lists, id, bucket, target);
}

/** The `ids` the PUT carries — the rail, in order. */
export function rankedIds<T extends { id: string }>(lists: Lists<T>): string[] {
  return lists.ranked.map((r) => r.id);
}

/**
 * Dirty check. Only the ranked sequence is persisted (unranked rows are simply
 * `display_order = null`), so re-sorting the unranked column changes nothing on
 * the server and must not arm the unsaved-changes prompt.
 */
export function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

// ---------- race key ----------

// `RaceKey` itself lives in lib/campaigns.ts — shared with <RaceKeyFields>.

/** The one scope code this race type carries, or null for a national race. */
export function raceScopeCode(key: RaceKey): string | null {
  switch (SCOPE_FOR[key.electionType]) {
    case "state":
      return key.stateCode ?? null;
    case "constituency":
      return key.constituencyCode ?? null;
    case "lga":
      return key.lgaCode ?? null;
    default:
      return null;
  }
}

/** True once the picker names one race: a scope code is present if the type needs one. */
export function raceComplete(key: RaceKey): boolean {
  return SCOPE_FOR[key.electionType] === null || raceScopeCode(key) !== null;
}

/** GET /api/admin/campaigns query for this race (`listQuerySchema` key names). */
export function listParamsFor(key: RaceKey, limit: number): CampaignListParams {
  const scope = SCOPE_FOR[key.electionType];
  const code = raceScopeCode(key);
  return {
    type: key.electionType,
    year: key.year,
    state: scope === "state" ? code : undefined,
    constituency: scope === "constituency" ? code : undefined,
    lga: scope === "lga" ? code : undefined,
    limit,
  };
}

/**
 * PUT /api/admin/campaigns/order body. Exactly ONE scope column is sent —
 * `raceScopeFor` in the API rejects a payload carrying a second, and rejects a
 * national race that carries any.
 */
export function orderBodyFor(key: RaceKey, ids: readonly string[]): Record<string, unknown> {
  const scope = SCOPE_FOR[key.electionType];
  const code = raceScopeCode(key);
  return {
    electionType: key.electionType,
    year: key.year,
    ...(scope === "state" ? { stateCode: code } : {}),
    ...(scope === "constituency" ? { constituencyCode: code } : {}),
    ...(scope === "lga" ? { lgaCode: code } : {}),
    ids: [...ids],
  };
}

/** "Presidential · 2027" / "Governor · 2027 · lagos" — what race is on screen. */
export function raceLabel(key: RaceKey, labels: Record<ElectionType, string>): string {
  return [labels[key.electionType], String(key.year), raceScopeCode(key)]
    .filter(Boolean)
    .join(" · ");
}
