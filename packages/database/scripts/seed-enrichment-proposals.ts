/**
 * Seed enrichment ChangeProposals for dashboard testing — DEV ONLY.
 *
 * Creates 3 proposals per status tab (pending, needs_human, needs_more_sources,
 * approved, rejected), each cycling fill → correction → create so the confirm-modal
 * variants can all be exercised.
 *
 * SAFETY
 *  - Run via `infisical run --env dev -- npx tsx packages/database/scripts/seed-enrichment-proposals.ts`.
 *  - Refuses to run when NODE_ENV=production and prints the connected DB before writing.
 *  - Every row is tagged with a sentinel agentRunId so it is trivially removable.
 *  - fill/correction proposals target a RANDOM (non-existent) official id, so approving
 *    them runs a harmless 0-row UPDATE and never mutates a real official.
 *
 * Re-runnable: deletes prior seed rows (by sentinel) before inserting.
 * Cleanup only:  ... seed-enrichment-proposals.ts --clean
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const SENTINEL_RUN_ID = "11111111-1111-4111-8111-111111111111";
const TAG = "[ENRICH-SEED]";

const STATUSES = [
  "pending",
  "needs_human",
  "needs_more_sources",
  "approved",
  "rejected",
] as const;
const KINDS = ["fill", "correction", "create"] as const;
type Kind = (typeof KINDS)[number];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Two corroborating sources; second one only on even indexes for variety. */
function sourcesFor(i: number) {
  const retrievedAt = new Date();
  const sources: Array<Record<string, unknown>> = [
    {
      url: "https://www.inecnigeria.org/elections/2023-general-election-results/",
      archiveUrl: "https://web.archive.org/web/2024/https://www.inecnigeria.org/",
      publisher: "inecnigeria.org",
      snippet:
        "Declaration of results for the constituency naming the elected candidate and their political party.",
      format: "pdf",
      locator: "p.12 §Declared Results",
      sourceTier: "canonical",
      confidence: "high",
      retrievedAt,
    },
  ];
  if (i % 2 === 0) {
    sources.push({
      url: "https://www.premiumtimesng.com/news/headlines/seed-coverage.html",
      archiveUrl: null,
      publisher: "premiumtimesng.com",
      snippet:
        "News report corroborating the official's verified contact details and current office.",
      format: "html",
      locator: null,
      sourceTier: "web",
      confidence: "medium",
      retrievedAt,
    });
  }
  return sources;
}

const FILLS = [
  { field: "email", value: "press@statehouse.gov.ng" },
  { field: "office_address", value: "Block A, State Secretariat, Capital City" },
  {
    field: "biography",
    value:
      "Two-term legislator focused on rural electrification and primary healthcare delivery.",
  },
];

const CORRECTIONS = [
  { field: "twitter_handle", current: "@old_handle_2019", value: "@verified_handle" },
  { field: "phone_number", current: "+2348011110000", value: "+2348099998888" },
  {
    field: "facebook_url",
    current: "https://facebook.com/old.page",
    value: "https://facebook.com/official.verified",
  },
];

const CREATE_WARDS = [
  { code: "enrich_seed_ward_001", ward: "Ofutop I", lga: "Ikom", state: "Cross River" },
  { code: "enrich_seed_ward_002", ward: "Abanyum", lga: "Ikom", state: "Cross River" },
  { code: "enrich_seed_ward_003", ward: "Olulumo", lga: "Ikom", state: "Cross River" },
];

const CONFIDENCE = ["high", "medium", "low"] as const;

type SeedWard = { code: string; ward: string; lga: string; state: string };

/** Build the per-status, per-kind proposal create payload. */
function buildProposal(status: string, kind: Kind, kindIdx: number, officialId: string | null, ward: SeedWard | null) {
  const confidence = CONFIDENCE[kindIdx % CONFIDENCE.length];
  const reasoning = `Seeded ${kind} proposal for the "${status}" tab. ${TAG}`;
  const reviewMeta =
    status === "approved"
      ? { reviewedAt: new Date(), appliedAt: new Date(), reviewNote: null as string | null }
      : status === "rejected"
        ? {
            reviewedAt: new Date(),
            appliedAt: null,
            reviewNote: `Insufficient corroboration — rejected. ${TAG}`,
          }
        : status === "needs_more_sources"
          ? {
              reviewedAt: new Date(),
              appliedAt: null,
              reviewNote: `Need a second canonical source before approving. ${TAG}`,
            }
          : { reviewedAt: null, appliedAt: null, reviewNote: null as string | null };

  const common = {
    status,
    confidence,
    reasoning,
    agentRunId: SENTINEL_RUN_ID,
    ...reviewMeta,
    sources: { create: sourcesFor(kindIdx) },
  };

  if (kind === "fill") {
    const f = FILLS[kindIdx % FILLS.length];
    return {
      // Real official id so the card can show whose data changes + link to their page.
      ...common,
      targetTable: "nigerian_officials",
      targetPk: officialId ?? randomUUID(),
      targetField: f.field,
      currentValue: null,
      proposedValue: f.value,
      changeKind: "fill",
    };
  }

  if (kind === "correction") {
    const c = CORRECTIONS[kindIdx % CORRECTIONS.length];
    return {
      ...common,
      targetTable: "nigerian_officials",
      targetPk: officialId ?? randomUUID(),
      targetField: c.field,
      currentValue: c.current,
      proposedValue: c.value,
      changeKind: "correction",
    };
  }

  // create — a councilor entity matching CouncilorProposedEntity.
  // Prefer a real councilor-free ward (so approve actually inserts); fall back to a placeholder.
  const w = ward ?? CREATE_WARDS[kindIdx % CREATE_WARDS.length];
  return {
    ...common,
    targetTable: "nigerian_officials",
    targetPk: null,
    targetField: "__create__",
    currentValue: null,
    proposedValue: {
      official: { name: `Hon. Seed Councillor ${w.ward} ${TAG}` },
      position: {
        role: "councilor",
        wardCode: w.code,
        appointmentType: "elected",
        status: "active",
        startDate: "2024-11-04",
        partyAcronym: null,
        sourceType: "election_result",
        confidence,
      },
      meta: { ward: w.ward, lga: w.lga, state: w.state },
    },
    changeKind: "create",
  };
}

function dbHost(): string {
  try {
    return new URL(process.env.DATABASE_URL ?? "").host || "(unparseable)";
  } catch {
    return "(unparseable)";
  }
}

async function clean() {
  const del = await prisma.changeProposal.deleteMany({ where: { agentRunId: SENTINEL_RUN_ID } });
  // Officials/positions that may have been created by approving a `create` seed proposal.
  const officials = await prisma.nigerianOfficial.findMany({
    where: { name: { contains: TAG } },
    select: { id: true },
  });
  const ids = officials.map((o) => o.id);
  if (ids.length) {
    await prisma.officialPosition.deleteMany({ where: { officialId: { in: ids } } });
    await prisma.nigerianOfficial.deleteMany({ where: { id: { in: ids } } });
  }
  console.log(`Cleaned: ${del.count} proposals, ${ids.length} tagged officials.`);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV=production. This script is dev-only.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Run via `infisical run --env dev -- ...`.");
  }

  await prisma.$connect();
  const [info] = await prisma.$queryRawUnsafe<{ db: string; usr: string }[]>(
    "SELECT current_database() AS db, current_user AS usr",
  );
  console.log(`Connected → host=${dbHost()} db=${info.db} user=${info.usr}`);

  const cleanOnly = process.argv.includes("--clean");
  if (cleanOnly) {
    await clean();
    await prisma.$disconnect();
    return;
  }

  // Idempotent: remove prior seed rows first (sources cascade).
  const removed = await prisma.changeProposal.deleteMany({
    where: { agentRunId: SENTINEL_RUN_ID },
  });
  if (removed.count) console.log(`Removed ${removed.count} prior seed proposals.`);

  // Real officials so fill/correction cards show the name + a working public-page link.
  const realOfficials = await prisma.nigerianOfficial.findMany({
    take: 12,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  if (realOfficials.length === 0) console.warn("No officials found — fill/correction cards will show 'Unknown official'.");

  // Real wards with NO current councilor, so a create proposal is actually approvable
  // (a fake ward would fail the official_positions.ward_code FK on apply → 500).
  const freeWards = await prisma.$queryRawUnsafe<SeedWard[]>(`
    SELECT w.code AS code, w.name AS ward, l.name AS lga, s.name AS state
    FROM nigerian_wards w
    JOIN nigerian_lgas l ON l.code = w.lga_code
    JOIN nigerian_states s ON s.code = l.state_code
    WHERE NOT EXISTS (
      SELECT 1 FROM official_positions op
      WHERE op.ward_code = w.code AND op.role = 'councilor'
        AND (op.end_date IS NULL OR op.end_date > now())
    )
    ORDER BY w.code
    LIMIT 6
  `);
  if (freeWards.length === 0) console.warn("No councilor-free ward found — create proposals use a placeholder ward (won't be approvable).");

  let created = 0;
  let oi = 0;
  let wi = 0;
  for (const status of STATUSES) {
    for (let k = 0; k < KINDS.length; k++) {
      const kind = KINDS[k];
      const officialId =
        (kind === "fill" || kind === "correction") && realOfficials.length
          ? realOfficials[oi++ % realOfficials.length].id
          : null;
      const ward = kind === "create" && freeWards.length ? freeWards[wi++ % freeWards.length] : null;
      const data = buildProposal(status, kind, k, officialId, ward);
      await prisma.changeProposal.create({ data: data as never });
      created++;
    }
    console.log(`  ${status}: 3 proposals (fill, correction, create)`);
  }
  console.log(`\nSeeded ${created} enrichment proposals across ${STATUSES.length} tabs.`);
  console.log(`Cleanup later:  infisical run --env dev -- npx tsx packages/database/scripts/seed-enrichment-proposals.ts --clean`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
