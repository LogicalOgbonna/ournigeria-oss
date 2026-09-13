/**
 * Shapes the `/elections/<year>/<ticket>` page renders — Figma `1:987` (APC)
 * and `1:1209` (NDC). The content itself is no longer authored here: it comes
 * from `GET /api/campaigns/:slug` through `toTicketProfile()` in
 * `@/lib/campaigns`, where the editorial copy, photos and documents were
 * seeded by packages/database/scripts/seed-campaigns.ts.
 *
 * Career and education deliberately have no fields: they join on the official
 * record (`/api/officials/:slug`) — see `TicketProfile.tsx`.
 */

/**
 * A tab in the documents panel.
 *
 * `href` is the real document. The design's viewer chrome (zoom, page count,
 * search) is presentational — see `DocsPanel` — so a tab with no `href` shows
 * its cover with the download disabled rather than pretending to page through
 * something that is not there.
 */
export interface TicketDoc {
  readonly key: "manifesto" | "cv" | "achievements";
  readonly title: string;
  readonly blurb: string;
  readonly cover?: string;
  readonly href?: string;
  /** Printed as "1 of N" beside the viewer controls. */
  readonly pages?: number;
}

/** One half of a ticket, as the two portrait cards print it. */
export interface TicketPerson {
  /** Given names — the first, unaccented line of the serif name block. */
  readonly given: string;
  /** Surname — the second line, set in the party accent. */
  readonly surname: string;
  /** ISO date. Ages are computed, never stored, so they do not go stale. Absent = no age line. */
  readonly dob?: string;
  /** Role label, split the way the design splits it: base + accent parenthetical. */
  readonly role: readonly [base: string, accent: string];
  readonly photo?: string;
}

export interface TicketProfile {
  readonly candidate: TicketPerson;
  readonly mate: TicketPerson | null;
  /** Centred paragraph under the ticket pair. */
  readonly visionLine: string;
  /** Smaller line beneath it. */
  readonly fineprint: string;
  /** Full-bleed band: the pull-quote, its background fill and its photo. */
  readonly quote: string;
  readonly quoteBg: string;
  readonly quotePhoto?: string;
  /** The accented word in the "Who is <short>?" heading. */
  readonly short: string;
  readonly bio: string;
  readonly bioPhoto?: string;
  readonly docs: readonly TicketDoc[];
}

/** Whole years between `dob` and now. Figma's "74 years" is this, not a constant. */
export function ageFrom(dob: string, now: Date = new Date()): number {
  const born = new Date(dob);
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const month = now.getUTCMonth() - born.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < born.getUTCDate())) age -= 1;
  return age;
}
