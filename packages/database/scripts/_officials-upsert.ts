/**
 * Shared find-or-create + enrich helper for nigerian_officials, used by
 * seed-party-officers.ts and seed-party-candidates.ts.
 *
 * Dedup is the critical part: many party officers / flagbearers are sitting
 * governors or senators already in the table, and we must NEVER insert a second
 * row for the same person. Matching is intentionally conservative:
 *
 *   - normalize names (lowercase, strip diacritics/punctuation, collapse spaces)
 *   - an exact normalized-string match always wins;
 *   - otherwise we require the two names to share >= 2 significant tokens
 *     (length >= 3). A single shared surname is NOT enough — that is what
 *     prevents "Atiku Abubakar" from matching the unrelated "Atiku Nasiru",
 *     or "Samuel Anyanwu" from matching "Anyanwu Obilor".
 *   - among multiple candidates, prefer an exact normalized match, then one that
 *     already holds an official_position (governor/senator/etc.), then the most
 *     shared tokens.
 *
 * Enrichment of a matched row only ever fills columns that are currently NULL —
 * existing data is never overwritten, and we skip the UPDATE entirely when there
 * is nothing to fill (so re-runs are pure no-ops).
 */

import type { PrismaClient } from '@prisma/client';
import { slugifyName } from '../src/slug';

export interface OfficialRow {
  id: string;
  name: string;
  officialType: string | null;
  imageUrl: string | null;
  biography: string | null;
  twitterHandle: string | null;
  facebookUrl: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  slug: string | null;
  hasPosition: boolean;
}

export interface OfficialInput {
  name: string;
  /**
   * Used ONLY when creating a brand-new row; matched rows keep their type.
   * Must satisfy chk_official_type: one of elected/appointed/civil_servant/
   * judicial/security/traditional/other, or null. (There is no 'party_officer'
   * value, so officer-only people are created with null.)
   */
  officialType: string | null;
  imageUrl?: string | null;
  biography?: string | null;
  gender?: string | null;
  /** "YYYY-MM-DD" (full dates only). */
  dateOfBirth?: string | null;
  twitterHandle?: string | null;
  facebookUrl?: string | null;
  /**
   * Whether this person is known to have held public/elected office (derived
   * from the research's priorOffice). Gates merging a non-exact (middle-name)
   * match into an EXISTING officeholder: without this, a contested party officer
   * named e.g. "Bala Yunusa Mohammed" would wrongly merge into the unrelated
   * Bauchi Governor "Bala Mohammed". Exact-name matches ignore this gate.
   */
  canMergeOfficeHolder?: boolean;
}

/** True when prior-office text names a public/elected office (dedup gate). */
export function looksLikePublicOfficeHolder(text: string | null | undefined): boolean {
  if (!text) return false;
  return /govern|senat|preside|minister|representative|house of rep|deputy|lawmaker|commissioner|central bank|\bcbn\b/i.test(
    text,
  );
}

export interface FindOrCreateResult {
  id: string;
  created: boolean;
  enriched: boolean;
  matchedName: string;
}

/** Lowercase, NFKD diacritic-strip, drop punctuation, collapse whitespace. */
function normalizeName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Significant tokens (length >= 3) of a normalized name. */
function sigTokens(name: string): Set<string> {
  return new Set(normalizeName(name).split(' ').filter((t) => t.length >= 3));
}

function sharedCount(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n += 1;
  return n;
}

/** Load every official once; the caller threads this cache through all calls. */
export async function loadOfficials(prisma: PrismaClient): Promise<OfficialRow[]> {
  return prisma.$queryRawUnsafe<OfficialRow[]>(
    `SELECT o.id,
            o.name,
            o.official_type   AS "officialType",
            o.image_url       AS "imageUrl",
            o.biography,
            o.twitter_handle  AS "twitterHandle",
            o.facebook_url    AS "facebookUrl",
            o.gender,
            o.date_of_birth   AS "dateOfBirth",
            o.slug,
            EXISTS (SELECT 1 FROM official_positions p WHERE p.official_id = o.id) AS "hasPosition"
       FROM nigerian_officials o`,
  );
}

/**
 * Best existing match for `name`, or null. Conservative:
 *   1. exact normalized match always wins;
 *   2. otherwise the two names must be in a SUBSET relation — every significant
 *      token of the shorter name appears in the longer (handles middle names,
 *      e.g. "Charles Soludo" vs "Charles Chukwuma Soludo"), with >= 2 shared
 *      tokens. Plain 2-token overlaps that are NOT subsets are rejected (that is
 *      what keeps "Hakeem Baba-Ahmed" away from "Ahmed Saidu Baba").
 *   3. a subset match into an EXISTING officeholder is only accepted when
 *      opts.canMergeOfficeHolder is true (prevents common-name collisions like
 *      "Bala Yunusa Mohammed" → Governor "Bala Mohammed").
 */
export function matchOfficial(
  cache: OfficialRow[],
  name: string,
  opts?: { canMergeOfficeHolder?: boolean },
): OfficialRow | null {
  const norm = normalizeName(name);
  const tokens = sigTokens(name);

  const exact = cache.filter((r) => normalizeName(r.name) === norm);
  if (exact.length > 0) {
    exact.sort((a, b) => (b.hasPosition ? 1 : 0) - (a.hasPosition ? 1 : 0));
    return exact[0];
  }

  type Scored = { row: OfficialRow; shared: number };
  const subset: Scored[] = [];
  for (const row of cache) {
    const rTokens = sigTokens(row.name);
    const shared = sharedCount(tokens, rTokens);
    if (shared < 2) continue;
    const isSubset = shared === Math.min(tokens.size, rTokens.size);
    if (!isSubset) continue;
    if (row.hasPosition && !opts?.canMergeOfficeHolder) continue;
    subset.push({ row, shared });
  }

  if (subset.length === 0) return null;
  subset.sort(
    (a, b) =>
      (b.row.hasPosition ? 1 : 0) - (a.row.hasPosition ? 1 : 0) || b.shared - a.shared,
  );
  return subset[0].row;
}

/** Reserve a unique slug not present in the cache (DB) — append -2, -3, … */
function uniqueSlug(cache: OfficialRow[], reserved: Set<string>, name: string): string {
  const base = slugifyName(name) || 'official';
  const taken = (s: string) =>
    reserved.has(s) || cache.some((o) => o.slug === s);
  if (!taken(base)) {
    reserved.add(base);
    return base;
  }
  for (let i = 2; ; i += 1) {
    const cand = `${base}-${i}`.slice(0, 160);
    if (!taken(cand)) {
      reserved.add(cand);
      return cand;
    }
  }
}

/**
 * Find an existing official (conservative match) and enrich its NULL fields, or
 * create a new one. Mutates `cache`/`reserved` so later calls in the same run
 * see the new/updated row (prevents intra-run duplicates).
 */
export async function findOrCreateOfficial(
  prisma: PrismaClient,
  cache: OfficialRow[],
  reserved: Set<string>,
  input: OfficialInput,
): Promise<FindOrCreateResult> {
  const match = matchOfficial(cache, input.name, {
    canMergeOfficeHolder: input.canMergeOfficeHolder ?? false,
  });

  if (match) {
    // Enrich only currently-NULL columns; skip the write if nothing to fill.
    const sets: string[] = [];
    const values: unknown[] = [];
    const fill = (col: string, cur: unknown, val: unknown, cast = '') => {
      if ((cur === null || cur === undefined) && val !== null && val !== undefined && val !== '') {
        values.push(val);
        sets.push(`"${col}" = $${values.length}${cast}`);
      }
    };
    fill('image_url', match.imageUrl, input.imageUrl ?? null);
    fill('biography', match.biography, input.biography ?? null);
    fill('twitter_handle', match.twitterHandle, input.twitterHandle ?? null);
    fill('facebook_url', match.facebookUrl, input.facebookUrl ?? null);
    fill('gender', match.gender, input.gender ?? null);
    fill('date_of_birth', match.dateOfBirth, input.dateOfBirth ?? null, '::date');

    let enriched = false;
    if (sets.length > 0) {
      values.push(match.id);
      await prisma.$executeRawUnsafe(
        `UPDATE nigerian_officials SET ${sets.join(', ')} WHERE id = $${values.length}`,
        ...values,
      );
      enriched = true;
      // Reflect the fill in the cache so later matches see it.
      if (input.imageUrl && !match.imageUrl) match.imageUrl = input.imageUrl;
      if (input.biography && !match.biography) match.biography = input.biography;
      if (input.twitterHandle && !match.twitterHandle) match.twitterHandle = input.twitterHandle;
      if (input.facebookUrl && !match.facebookUrl) match.facebookUrl = input.facebookUrl;
      if (input.gender && !match.gender) match.gender = input.gender;
    }

    return { id: match.id, created: false, enriched, matchedName: match.name };
  }

  // Create a new official.
  const slug = uniqueSlug(cache, reserved, input.name);
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO nigerian_officials
       (name, slug, official_type, image_url, biography, gender, date_of_birth, twitter_handle, facebook_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9)
     RETURNING id`,
    input.name,
    slug,
    input.officialType,
    input.imageUrl ?? null,
    input.biography ?? null,
    input.gender ?? null,
    input.dateOfBirth ?? null,
    input.twitterHandle ?? null,
    input.facebookUrl ?? null,
  );
  const id = rows[0].id;

  cache.push({
    id,
    name: input.name,
    officialType: input.officialType,
    imageUrl: input.imageUrl ?? null,
    biography: input.biography ?? null,
    twitterHandle: input.twitterHandle ?? null,
    facebookUrl: input.facebookUrl ?? null,
    gender: input.gender ?? null,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
    slug,
    hasPosition: false,
  });

  return { id, created: true, enriched: false, matchedName: input.name };
}
