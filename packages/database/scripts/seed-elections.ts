/**
 * Seed first-class election EVENTS (plan 68 §5) and backfill `election_id`
 * on campaigns + non-primary official_elections.
 *
 * Events are CREATED by slug — a slug that already exists is skipped (the
 * dashboard owns it from then on; this script never updates an event row).
 * Both seeded rows land unpublished + unreviewed on purpose (D10.4): a
 * reviewer confirms the INEC date/source in the dashboard before publish.
 *
 * Backfill (D10.1 subsumption, plan §2): a campaign / non-primary
 * official_elections row attaches to the election event with the MOST
 * SPECIFIC scope that subsumes its own scope — same office (the event's
 * `office` IS the campaigns.election_type vocabulary) and cycle year, where
 * every non-null scope column on the event either is null (broader) or
 * equals the row's value, and the row's state is not in
 * election_excluded_states. Ties broken by event specificity
 * (ward > constituency > lga > state > nationwide); still ambiguous → the
 * group is SKIPPED, listed on stderr and the script exits 1. Non-`general`
 * rounds never auto-attach (a supplementary election's tickets are attached
 * by explicit admin action only). `'other'`-type campaigns are skipped and
 * counted, never silently dropped (E1.3). Campaign has NO ward_code column,
 * so a ward-scoped event can never subsume a campaign — the rule handles it
 * (event ward non-null vs row ward null ⇒ no subsume); attachment there is
 * manual. is_primary and MATE-type (vice_presidential etc.) anchor rows are
 * party events, not ours — never fetched, they keep election_id null.
 *
 * Idempotent: only rows whose election_id IS NULL are ever written, so a
 * re-run is a no-op and a dashboard-made attachment is never overwritten.
 *
 * Usage:
 *   DATABASE_URL=… npx tsx scripts/seed-elections.ts [--dry-run]
 */
import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// ----- CLI -----

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

// ----- Seeded events (CREATE-ONLY by slug) -----

const EVENTS = [
  {
    slug: "2027-presidential",
    office: "presidential",
    year: 2027,
    round: "general",
    // D10.4: INEC's announced date — the PostHog payload's 2027-02-27 and
    // POLLING_DAY's 2027-02-20 are both stale.
    electionDate: new Date("2027-01-16T00:00:00.000Z"),
    datePrecision: "day",
    label: "2027 General Election",
    published: false,
    confidence: "medium",
    sourceType: "manual",
    // PLACEHOLDER pending review: swap in the exact INEC press-release URL
    // when the reviewer confirms the row (seeded unreviewed for exactly that).
    sourceUrl: "https://www.inecnigeria.org/2027-general-election-timetable/",
    reviewStatus: "unreviewed",
  },
  {
    slug: "2026-osun-gubernatorial",
    office: "gubernatorial",
    year: 2026,
    round: "general",
    electionDate: new Date("2026-12-08T00:00:00.000Z"),
    datePrecision: "day",
    stateCode: "osun",
    label: "Osun Governorship",
    published: false,
    confidence: "medium",
    sourceType: "manual",
    // PLACEHOLDER pending review, as above.
    sourceUrl: "https://www.inecnigeria.org/osun-2026-governorship-timetable/",
    reviewStatus: "unreviewed",
  },
] as const;

/** chk_elections_office vocabulary = campaigns.election_type MINUS 'other'. */
const OFFICE_TYPES = [
  "presidential",
  "gubernatorial",
  "senatorial",
  "house_of_reps",
  "state_assembly",
  "lga_chairman",
  "councilor",
] as const;

// ----- D10.1 subsumption (pure — exported for the vitest suite) -----

export interface ScopeArc {
  stateCode: string | null;
  constituencyCode: string | null;
  lgaCode: string | null;
  wardCode: string | null;
}

export interface ElectionEventLite extends ScopeArc {
  id: string;
  slug: string;
  office: string;
  year: number;
  round: string;
  excludedStates: readonly string[];
}

export interface AttachableRow extends ScopeArc {
  /** campaigns.election_type / official_elections.election_type */
  electionType: string;
  year: number;
}

export type Subsumption =
  | { kind: "attach"; event: ElectionEventLite }
  | { kind: "none" }
  | { kind: "ambiguous"; events: ElectionEventLite[] };

const SCOPE_COLUMNS = ["stateCode", "constituencyCode", "lgaCode", "wardCode"] as const;

/** Tiebreak rank: ward > constituency > lga > state > nationwide (D10.1). */
export function eventSpecificity(event: ScopeArc): number {
  if (event.wardCode !== null) return 4;
  if (event.constituencyCode !== null) return 3;
  if (event.lgaCode !== null) return 2;
  if (event.stateCode !== null) return 1;
  return 0;
}

function subsumes(event: ElectionEventLite, row: AttachableRow): boolean {
  if (event.office !== row.electionType || event.year !== row.year) return false;
  // Non-general rounds never auto-attach — explicit admin action only.
  if (event.round !== "general") return false;
  for (const col of SCOPE_COLUMNS) {
    const eventValue = event[col];
    if (eventValue !== null && eventValue !== row[col]) return false;
  }
  if (row.stateCode !== null && event.excludedStates.includes(row.stateCode)) return false;
  return true;
}

/**
 * The most-specific-subsuming event for one row, per D10.1. Two subsuming
 * events at the SAME specificity rank is ambiguous — the caller skips the
 * row, reports loudly and exits non-zero.
 */
export function findSubsumingElection(row: AttachableRow, events: readonly ElectionEventLite[]): Subsumption {
  const matches = events.filter((event) => subsumes(event, row));
  if (matches.length === 0) return { kind: "none" };
  const top = Math.max(...matches.map(eventSpecificity));
  const best = matches.filter((event) => eventSpecificity(event) === top);
  if (best.length > 1) return { kind: "ambiguous", events: best };
  return { kind: "attach", event: best[0] };
}

// ----- Main -----

const describeScope = (row: AttachableRow) =>
  [
    `${row.electionType} ${row.year}`,
    ...SCOPE_COLUMNS.filter((col) => row[col] !== null).map((col) => `${col}=${row[col]}`),
  ].join(" ") || "nationwide";

async function main() {
  console.log(`${DRY_RUN ? "[dry-run] " : ""}seed ${EVENTS.length} election events + backfill election_id`);

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const stats = {
    eventsCreated: 0,
    eventsSkipped: 0,
    campaignsAttached: 0,
    campaignsOtherSkipped: 0,
    campaignsUnmatched: 0,
    participationsAttached: 0,
    participationsUnmatched: 0,
  };
  const ambiguous: string[] = [];

  try {
    // 1. Events, create-only by slug.
    for (const ev of EVENTS) {
      const existing = await prisma.election.findUnique({ where: { slug: ev.slug }, select: { id: true } });
      if (existing) {
        stats.eventsSkipped += 1;
        console.log(`  ${ev.slug}: exists → skipped`);
        continue;
      }
      if (!DRY_RUN) await prisma.election.create({ data: ev });
      stats.eventsCreated += 1;
      console.log(`  ${ev.slug}: ${DRY_RUN ? "would create" : "created"}`);
    }

    // 2. Attachment candidates: EVERY event row (not just the two above), so
    // a re-run also backfills rows for dashboard-created events. subsumes()
    // drops non-general rounds.
    const events: ElectionEventLite[] = (
      await prisma.election.findMany({ include: { excludedStates: { select: { stateCode: true } } } })
    ).map((e) => ({
      id: e.id,
      slug: e.slug,
      office: e.office,
      year: e.year,
      round: e.round,
      stateCode: e.stateCode,
      constituencyCode: e.constituencyCode,
      lgaCode: e.lgaCode,
      wardCode: e.wardCode,
      excludedStates: e.excludedStates.map((x) => x.stateCode),
    }));
    if (DRY_RUN) {
      // The rows "created" above don't exist yet — splice them in so the
      // backfill preview matches what a real run would do.
      for (const ev of EVENTS) {
        if (events.some((e) => e.slug === ev.slug)) continue;
        events.push({
          id: `dry-run:${ev.slug}`,
          slug: ev.slug,
          office: ev.office,
          year: ev.year,
          round: ev.round,
          stateCode: "stateCode" in ev ? ev.stateCode : null,
          constituencyCode: null,
          lgaCode: null,
          wardCode: null,
          excludedStates: [],
        });
      }
    }

    // 3. Campaigns. Rows sharing a race key share an outcome — group first.
    const campaigns = await prisma.campaign.findMany({
      where: { electionId: null },
      select: { id: true, slug: true, electionType: true, year: true, stateCode: true, constituencyCode: true, lgaCode: true },
    });
    const campaignGroups = new Map<string, { row: AttachableRow; ids: string[]; slugs: string[] }>();
    for (const c of campaigns) {
      if (c.electionType === "other") {
        // E1.3: no event can carry office 'other' — counted, never silent.
        stats.campaignsOtherSkipped += 1;
        continue;
      }
      const row: AttachableRow = {
        electionType: c.electionType,
        year: c.year,
        stateCode: c.stateCode,
        constituencyCode: c.constituencyCode,
        lgaCode: c.lgaCode,
        wardCode: null, // Campaign has no ward_code column
      };
      const key = JSON.stringify(row);
      const group = campaignGroups.get(key) ?? { row, ids: [], slugs: [] };
      group.ids.push(c.id);
      group.slugs.push(c.slug);
      campaignGroups.set(key, group);
    }
    for (const { row, ids, slugs } of campaignGroups.values()) {
      const outcome = findSubsumingElection(row, events);
      if (outcome.kind === "attach") {
        if (!DRY_RUN) {
          await prisma.campaign.updateMany({
            where: { id: { in: ids }, electionId: null },
            data: { electionId: outcome.event.id },
          });
        }
        stats.campaignsAttached += ids.length;
        console.log(`  campaigns → ${outcome.event.slug}: ${ids.length} (${describeScope(row)})`);
      } else if (outcome.kind === "ambiguous") {
        ambiguous.push(
          `campaigns [${slugs.join(", ")}] (${describeScope(row)}) subsumed by ${outcome.events
            .map((e) => e.slug)
            .join(" AND ")}`,
        );
      } else {
        stats.campaignsUnmatched += ids.length;
      }
    }

    // 4. Non-primary official_elections. The election_type filter keeps the
    // MATE-type anchors (vice_presidential, …) out entirely.
    const participations = await prisma.officialElection.findMany({
      where: { electionId: null, isPrimary: false, electionType: { in: [...OFFICE_TYPES] } },
      select: { id: true, electionType: true, year: true, stateCode: true, constituencyCode: true, lgaCode: true, wardCode: true },
    });
    const participationGroups = new Map<string, { row: AttachableRow; ids: string[] }>();
    for (const p of participations) {
      const row: AttachableRow = {
        electionType: p.electionType,
        year: p.year,
        stateCode: p.stateCode,
        constituencyCode: p.constituencyCode,
        lgaCode: p.lgaCode,
        wardCode: p.wardCode,
      };
      const key = JSON.stringify(row);
      const group = participationGroups.get(key) ?? { row, ids: [] };
      group.ids.push(p.id);
      participationGroups.set(key, group);
    }
    for (const { row, ids } of participationGroups.values()) {
      const outcome = findSubsumingElection(row, events);
      if (outcome.kind === "attach") {
        if (!DRY_RUN) {
          await prisma.officialElection.updateMany({
            where: { id: { in: ids }, electionId: null },
            data: { electionId: outcome.event.id },
          });
        }
        stats.participationsAttached += ids.length;
        console.log(`  official_elections → ${outcome.event.slug}: ${ids.length} (${describeScope(row)})`);
      } else if (outcome.kind === "ambiguous") {
        ambiguous.push(
          `official_elections [${ids.join(", ")}] (${describeScope(row)}) subsumed by ${outcome.events
            .map((e) => e.slug)
            .join(" AND ")}`,
        );
      } else {
        stats.participationsUnmatched += ids.length;
      }
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  console.log("\nDone.", stats);

  if (ambiguous.length > 0) {
    console.error(
      `\nAMBIGUOUS attachment — ${ambiguous.length} group(s) SKIPPED. Scope the colliding events apart or attach these rows manually, then re-run:`,
    );
    for (const line of ambiguous) console.error(`  - ${line}`);
    process.exit(1);
  }
}

// Only run when invoked directly — the subsumption logic is imported by tests.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
