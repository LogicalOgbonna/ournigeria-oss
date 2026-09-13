/**
 * The extras every "who represents you" official card carries, shared by the
 * state / LGA / ward surfaces so a card looks the same wherever it renders.
 *
 * Kept out of `geo.service.ts` so the contact-normalisation rules — which
 * encode a real data-quality problem, see below — are unit-testable without
 * standing up Prisma.
 */

/** X/Twitter accounts that belong to an institution, not to any one official.
 *  `nass.gov.ng` embeds the National Assembly's own timeline widget on every
 *  member page, and the scraper stored that widget's link as the member's
 *  handle — 226 of the 281 stored handles are this one account. Rendering it
 *  would tell a citizen to tweet at the Assembly's press office believing they
 *  are reaching their own representative, so it is dropped, not displayed. */
const INSTITUTIONAL_X_HANDLES = new Set(["nassnigeria"]);

/** `twitter_handle` is stored in three shapes (bare `CCSoludo`, `@CCSoludo`, and
 *  full embed URLs like `https://x.com/nassnigeria?ref_src=twsrc%5Etfw`).
 *  Returns a bare handle the UI can safely build a link from, or null when the
 *  value is not a usable personal account. */
export function normalizeXHandle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let handle = raw.trim();
  if (!handle) return null;

  if (/^https?:\/\//i.test(handle)) {
    let url: URL;
    try {
      url = new URL(handle);
    } catch {
      return null;
    }
    if (!/(^|\.)(x|twitter)\.com$/i.test(url.hostname)) return null;
    handle = url.pathname.split("/").filter(Boolean)[0] ?? "";
  }

  handle = handle.replace(/^@/, "");
  // X handles are 1-15 chars of [A-Za-z0-9_]; anything else is scrape residue.
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
  if (INSTITUTIONAL_X_HANDLES.has(handle.toLowerCase())) return null;

  return handle;
}

/** How long this person has held the seat — "2023 - Present" while serving,
 *  "2019 - 2023" once ended.
 *
 *  `start_date` is set on every active position (2,358/2,358), so this always
 *  resolves; it replaces the literal string "Current" the cards used to show,
 *  which told a citizen nothing. `end_date` is set on almost nothing (1 row),
 *  because a term's end is not recorded per position — so a serving official
 *  reads as "- Present" rather than showing a term end we do not actually have. */
export function formatTerm(startDate?: Date | null, endDate?: Date | null): string | null {
  if (!startDate) return null;
  const start = startDate.getFullYear();
  return endDate ? `${start} - ${endDate.getFullYear()}` : `${start} - Present`;
}

/** Extras every "who represents you" card shows, shared by the state/LGA/ward
 *  surfaces so a card looks the same wherever it is rendered:
 *  - how long they have held the seat,
 *  - how to reach them (email / phone / X),
 *  - any leadership office held in the chamber (Speaker, Chief Whip, ...),
 *  - how complete our record of them is, which doubles as the contribute prompt.
 *  All of it is already loaded (`include: { official: true }`) — the mappers
 *  just used to drop it. */
export function officialCardExtras(pos: any) {
  const o = pos.official;
  return {
    term: formatTerm(pos.startDate, pos.endDate),
    leadershipRole: pos.leadershipRole ?? null,
    email: o.email ?? null,
    phone: o.phoneNumber ?? null,
    twitter: normalizeXHandle(o.twitterHandle),
    // Decimal(3,2) 0..1 — Prisma hands back a Decimal, which serialises as a
    // string over JSON; the clients want a number.
    completeness: o.completenessScore == null ? null : Number(o.completenessScore),
  };
}
