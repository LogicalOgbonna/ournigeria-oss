/**
 * Seed election campaigns (tickets) from a reviewable JSON dataset —
 * `packages/database/data/campaigns-2027-presidential.json` by default.
 *
 * Per ticket:
 *   1. Candidate and running mate are find-or-created as nigerian_officials
 *      (same conservative matcher as seed-party-candidates; `aka` names are
 *      tried too, so "Adewole Adebayo" in the DB is reused for "Adebayo Adewole
 *      Ebenezer"). Only NULL columns are filled; nothing is overwritten.
 *      GUARD: a name that matches an existing OFFICE HOLDER is reused only when
 *      the JSON says `knownOfficeHolder: true`. Otherwise a separate row is
 *      created and the collision is logged — "Buba Musa" (PRP running mate) is
 *      not the Gombe assemblyman of the same name. A false split is a merge
 *      away; a false merge puts a presidential ticket on a stranger's profile.
 *   2. An official_elections row anchors the ticket: candidate = election_type
 *      presidential / is_primary / won (what computeCandidates reads); running
 *      mate = vice_presidential / not a primary / pending (a nomination, not a
 *      win — see 20260828013000_elections_type_running_mates).
 *   3. The campaign is CREATED by slug. A slug that already exists is skipped
 *      (the dashboard owns it from then on). `--force` re-applies editorial
 *      copy only — never status, review columns, display_order, media or
 *      documents. New rows are created active + reviewed (the dataset is
 *      human-verified); display_order comes from dataset position only when
 *      the race has no ranked rows yet.
 *
 * Images are NOT uploaded: every key in the JSON already exists in S3 (see
 * _meta.images). URLs are `${CDN_BASE_URL}/${key}`.
 *
 * Usage:
 *   DATABASE_URL=… npx tsx scripts/seed-campaigns.ts [--file data/x.json] [--dry-run] [--force]
 *   (--force re-applies editorial copy to rows that already exist; it never
 *    touches status, review columns, display_order, media or documents.)
 *   (or via infisical run --env dev --path /api -- …; CDN_BASE_URL is read from
 *   the env and defaults to https://cdn.ournigeria.ng)
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { ensureTicketElections } from "../src/campaigns/election-anchor";
import { slugifyName } from "../src/slug";
import {
  findOrCreateOfficial,
  loadOfficials,
  matchOfficial,
  uniqueSlug,
  type OfficialRow,
} from "./_officials-upsert";

// ----- CLI -----

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
/** Re-apply editorial copy to rows that already exist. Copy only — see the header. */
const FORCE = args.includes("--force");
const fileArg = args[args.indexOf("--file") + 1];
const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = args.includes("--file")
  ? resolve(process.cwd(), fileArg)
  : join(HERE, "../data/campaigns-2027-presidential.json");

const CDN = (process.env.CDN_BASE_URL ?? "https://cdn.ournigeria.ng").replace(/\/+$/, "");

// ----- Dataset shape -----

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Person {
  name: string;
  aka?: string[];
  shortName?: string;
  dateOfBirth?: string;
  gender?: string;
  /** relative CDN keys */
  poster?: string;
  card?: string;
  confidence?: "high" | "medium" | "low";
  /**
   * This person IS the office holder of that name in our records (Tinubu,
   * Makinde, Onor…). Without it, a name that matches an existing official who
   * holds/held a position is treated as a collision and gets its own row.
   */
  knownOfficeHolder?: boolean;
}

interface Doc {
  kind: "manifesto" | "cv" | "achievements";
  subject: "ticket" | "candidate" | "running_mate";
  title: string;
  blurb?: string;
  cover?: string;
  file?: string;
  pageCount?: number;
}

export interface Ticket {
  slug: string;
  party: string;
  confidence?: "high" | "medium" | "low";
  sourceUrl?: string;
  notes?: string;
  factionLabel?: string;
  isDisputed?: boolean;
  candidate: Person;
  runningMate: Person | null;
  logo?: string | null;
  brandColor?: string;
  visionLine?: string;
  fineprint?: string;
  pullQuote?: string;
  pullQuoteBg?: string;
  quotePhoto?: string;
  bioPhoto?: string;
  candidateBio?: string;
  documents?: Doc[];
  posterArt?: {
    urlColor?: string;
    candidate: Box;
    mate?: Box;
    chip?: Record<string, unknown>;
    scrim?: Record<string, unknown>;
  };
}

export interface Dataset {
  electionType: string;
  year: number;
  documentBlurbs: Record<string, string>;
  tickets: Ticket[];
}

const cdn = (key: string | null | undefined) => (key ? `${CDN}/${key.replace(/^\/+/, "")}` : null);

// ----- One ticket -----

export type WriteOutcome = "created" | "updated" | "skipped";

/**
 * Create the campaign row for one ticket, with its documents, media and
 * official_elections anchor. Existing slug → "skipped" (or copy-only
 * "updated" with force). Exported for the create-only test.
 */
export async function writeTicket(
  prisma: PrismaClient,
  data: Dataset,
  t: Ticket,
  index: number,
  opts: { candidateId: string | null; mateId: string | null; force: boolean },
): Promise<WriteOutcome> {
  const posterMeta = t.posterArt
    ? {
        box: t.posterArt.candidate,
        chip: t.posterArt.chip ?? null,
        scrim: t.posterArt.scrim ?? null,
        urlColor: t.posterArt.urlColor ?? null,
      }
    : undefined;

  const media: { type: string; url: string; metadata?: object }[] = [];
  const push = (type: string, key: string | null | undefined, metadata?: object) => {
    const url = cdn(key);
    if (url) media.push({ type, url, metadata });
  };
  push("poster_candidate", t.candidate.poster, posterMeta);
  push("poster_mate", t.runningMate?.poster, t.posterArt?.mate ? { box: t.posterArt.mate } : undefined);
  push("card_candidate", t.candidate.card);
  push("card_mate", t.runningMate?.card);
  push("quote_photo", t.quotePhoto);
  push("bio_photo", t.bioPhoto);
  push("logo", t.logo);

  const documents = (t.documents ?? []).map((d) => ({
    kind: d.kind,
    subject: d.subject,
    title: d.title,
    blurb: d.blurb ?? data.documentBlurbs[d.kind] ?? null,
    coverUrl: cdn(d.cover),
    fileUrl: cdn(d.file),
    pageCount: d.pageCount ?? null,
    confidence: t.confidence ?? "medium",
    sourceType: "import",
  }));

  /** Editorial copy — the only thing --force is allowed to re-apply. */
  const copy = {
    candidateShortName: t.candidate.shortName ?? null,
    candidateBio: t.candidateBio ?? null,
    visionLine: t.visionLine ?? null,
    fineprint: t.fineprint ?? null,
    pullQuote: t.pullQuote ?? null,
    pullQuoteBg: t.pullQuoteBg ?? null,
    brandColor: t.brandColor ?? null,
    factionLabel: t.factionLabel ?? null,
    isDisputed: t.isDisputed ?? false,
    sourceUrl: t.sourceUrl ?? null,
  };

  const existing = await prisma.campaign.findUnique({ where: { slug: t.slug }, select: { id: true } });
  if (existing) {
    if (!opts.force) return "skipped";
    await prisma.campaign.update({ where: { id: existing.id }, data: copy });
    return "updated";
  }

  const anchorInput = {
    electionType: data.electionType,
    year: data.year,
    partyAcronym: t.party,
    stateCode: null,
    constituencyCode: null,
    lgaCode: null,
    candidateOfficialId: opts.candidateId,
    candidateName: t.candidate.name,
    runningMateOfficialId: opts.mateId,
    runningMateName: t.runningMate?.name ?? null,
  };

  await prisma.$transaction(async (tx) => {
    // Dataset position claims the rail only while nothing OUTSIDE this dataset
    // is ranked in the race (and the rank is still free) — once the dashboard
    // has ordered the race it owns display_order and new rows arrive unranked.
    const ranked = await tx.campaign.findMany({
      where: {
        electionType: data.electionType,
        year: data.year,
        stateCode: null,
        constituencyCode: null,
        lgaCode: null,
        displayOrder: { not: null },
      },
      select: { slug: true, displayOrder: true },
    });
    const ours = new Set(data.tickets.map((x) => x.slug));
    const wanted = index + 1;
    const claimable = ranked.every((r) => ours.has(r.slug)) && !ranked.some((r) => r.displayOrder === wanted);

    const anchor = await ensureTicketElections(tx, anchorInput, {
      result: "won",
      reviewedBy: "seed-campaigns",
      sourceType: "import",
      confidence: t.confidence ?? "medium",
      notes: t.notes ?? null,
    });
    await tx.campaign.create({
      data: {
        slug: t.slug,
        electionType: data.electionType,
        year: data.year,
        partyAcronym: t.party,
        officialElectionId: anchor.candidateElectionId,
        candidateOfficialId: opts.candidateId,
        candidateName: t.candidate.name,
        candidateImageUrl: cdn(t.candidate.card ?? t.candidate.poster),
        runningMateOfficialId: opts.mateId,
        runningMateName: t.runningMate?.name ?? null,
        runningMateImageUrl: cdn(t.runningMate?.card ?? t.runningMate?.poster),
        displayOrder: claimable ? wanted : null,
        // The dataset is human-verified, so a fresh row lands live and reviewed
        // (the column DEFAULT is 'draft' for dashboard-authored tickets).
        status: "active",
        reviewStatus: "reviewed",
        reviewedBy: "seed-campaigns",
        lastVerifiedAt: new Date(),
        confidence: t.confidence ?? "medium",
        sourceType: "import",
        ...copy,
        documents: { create: documents },
        media: { create: media.map((m, i) => ({ ...m, displayOrder: i })) },
      },
    });
  });
  return "created";
}

// ----- Main -----

async function main() {
  const data = JSON.parse(readFileSync(FILE, "utf8")) as Dataset;
  console.log(`${DRY_RUN ? "[dry-run] " : ""}${data.tickets.length} tickets from ${FILE}`);

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const stats = {
    officialsCreated: 0,
    officialsReused: 0,
    collisionsSplit: 0,
    created: 0,
    updated: 0,
    skipped: 0,
  };

  try {
    // Fail loudly and early: a missing party is a migration gap, not a data gap.
    const parties = new Set(
      (await prisma.politicalParty.findMany({ select: { acronym: true } })).map((p) => p.acronym),
    );
    const missing = [...new Set(data.tickets.map((t) => t.party))].filter((a) => !parties.has(a));
    if (missing.length > 0) {
      throw new Error(
        `political_parties is missing ${missing.join(", ")} — see 20260907030000_seed_2027_presidential_parties`,
      );
    }

    const cache: OfficialRow[] = await loadOfficials(prisma);
    const reserved = new Set<string>();

    /** Insert a brand-new official row, bypassing the name matcher (collision case). */
    async function createSeparate(p: Person, name: string) {
      const slug = uniqueSlug(cache, reserved, name);
      const imageUrl = cdn(p.card ?? p.poster);
      const dateOfBirth = p.dateOfBirth ? new Date(p.dateOfBirth) : null;
      const row = await prisma.nigerianOfficial.create({
        data: { name, slug, officialType: "elected", imageUrl, gender: p.gender ?? null, dateOfBirth },
        select: { id: true },
      });
      cache.push({
        id: row.id,
        name,
        officialType: "elected",
        imageUrl,
        biography: null,
        twitterHandle: null,
        facebookUrl: null,
        gender: p.gender ?? null,
        dateOfBirth,
        slug,
        hasPosition: false,
      });
      return { id: row.id, created: true };
    }

    /** Reuse an existing official under any of the person's names; create otherwise. */
    async function resolvePerson(p: Person, role: "candidate" | "mate") {
      const canMergeOfficeHolder = p.knownOfficeHolder ?? false;
      const names = [p.name, ...(p.aka ?? [])];
      // A position-less row with exactly this name is either a candidate row
      // from seed-party-candidates or the separate row a previous run of THIS
      // script created after a collision — reuse it before consulting the
      // matcher, or every run would mint another "Buba Musa".
      const own = names
        .map((n) => slugifyName(n))
        .map((s) => cache.find((o) => !o.hasPosition && slugifyName(o.name) === s))
        .find((m): m is OfficialRow => Boolean(m));
      const matched =
        own ??
        names
          .map((n) => matchOfficial(cache, n, { canMergeOfficeHolder }))
          .find((m): m is OfficialRow => Boolean(m));
      const collision = Boolean(matched && matched.hasPosition && !canMergeOfficeHolder);
      const label = role === "candidate" ? "candidate" : "mate     ";

      if (DRY_RUN) {
        const verdict = collision
          ? `NEW (name collides with office holder ${matched!.slug} — set knownOfficeHolder to merge)`
          : matched
            ? `reuse ${matched.slug}`
            : "NEW";
        console.log(`    ${label} ${p.name} → ${verdict}`);
        return { id: matched && !collision ? matched.id : "dry-run", created: !matched || collision };
      }

      if (collision) {
        console.log(`    ${label} ${p.name} collides with office holder ${matched!.slug}; creating a separate row`);
        stats.collisionsSplit += 1;
        return createSeparate(p, p.name);
      }

      if (matched) {
        // Reuse BY ID. Do not hand the name back to findOrCreateOfficial: it
        // re-runs the matcher, and with two exact "Buba Musa" rows in the table
        // that returns whichever the DB listed first — the assemblyman, on one
        // run. Fill only the columns that are still NULL, like the helper does.
        const fill: Record<string, unknown> = {};
        const imageUrl = cdn(p.card ?? p.poster);
        if (!matched.imageUrl && imageUrl) fill.imageUrl = imageUrl;
        if (!matched.gender && p.gender) fill.gender = p.gender;
        if (!matched.dateOfBirth && p.dateOfBirth) fill.dateOfBirth = new Date(p.dateOfBirth);
        if (Object.keys(fill).length > 0) {
          await prisma.nigerianOfficial.update({ where: { id: matched.id }, data: fill });
          Object.assign(matched, fill);
        }
        stats.officialsReused += 1;
        return { id: matched.id, created: false };
      }

      const res = await findOrCreateOfficial(prisma, cache, reserved, {
        name: p.name,
        officialType: "elected",
        imageUrl: cdn(p.card ?? p.poster),
        dateOfBirth: p.dateOfBirth ?? null,
        gender: p.gender ?? null,
        canMergeOfficeHolder,
      });
      if (res.created) stats.officialsCreated += 1;
      else stats.officialsReused += 1;
      return res;
    }

    for (const [index, t] of data.tickets.entries()) {
      console.log(`\n${t.slug}  [${t.party}]  ${t.candidate.name}${t.runningMate ? ` & ${t.runningMate.name}` : ""}`);

      const cand = await resolvePerson(t.candidate, "candidate");
      const mate = t.runningMate ? await resolvePerson(t.runningMate, "mate") : null;

      if (DRY_RUN) {
        // resolvePerson handed back "dry-run" ids; nothing to write. Just say
        // what a real run would do with the campaign row.
        const exists = await prisma.campaign.findUnique({ where: { slug: t.slug }, select: { id: true } });
        if (!exists) stats.created += 1;
        else if (FORCE) stats.updated += 1;
        else stats.skipped += 1;
        console.log(`    ${exists ? (FORCE ? "exists → copy updated" : "exists → skipped") : "NEW → created"}`);
        continue;
      }

      const outcome = await writeTicket(prisma, data, t, index, {
        candidateId: cand.id,
        mateId: mate?.id ?? null,
        force: FORCE,
      });
      if (outcome === "created") stats.created += 1;
      else if (outcome === "updated") stats.updated += 1;
      else stats.skipped += 1;
      console.log(`    ${outcome}`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  console.log("\nDone.", stats);
}

// Only run when invoked directly — writeTicket is imported by tests.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
