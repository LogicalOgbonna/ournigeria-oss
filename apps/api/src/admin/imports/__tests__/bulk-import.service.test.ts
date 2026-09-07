import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { EnrichmentApplyService } from "../../../enrichment/enrichment-apply.service";
import { AuditService } from "../../../audit/audit.service";
import { AuditCryptoService } from "../../../audit/audit-crypto.service";
import { CompletenessService } from "../../../completeness/completeness.service";
import type { ImageStorageService } from "../../../images/image-storage.service";
import { BulkImportService } from "../bulk-import.service";
import { IMPORTERS } from "../importer.registry";
import type { DatasetImporter } from "../importer.types";

// Image path is never exercised here; report every URL as stored so the branch is a no-op.
const imageStub = {
  isStoredUrl: () => true,
  storeOfficialImage: async (s: string) => ({ url: String(s), urlSmall: String(s) }),
} as unknown as ImageStorageService;

const ADMIN = "11111111-1111-1111-1111-111111111111";
const ACR = "APC"; // real, low-traffic-field party (empty slogan in seed data)
const FIELD = "slogan"; // confirmed in APPLIABLE_FIELDS.political_parties
const MARKER = "ZZZ-IMPORT-MARKER";
const FIXTURE_NAME = "test-fixture-bulk-import";

/**
 * Throwaway importer: proposes a single correction/fill on a real party's slogan.
 * Idempotent: once the live value equals MARKER, diff returns it as unchanged.
 */
const fixture: DatasetImporter = {
  name: FIXTURE_NAME,
  label: "test fixture",
  description: "test fixture",
  autoApprove: true,
  validate(json: unknown) {
    if (typeof json !== "object" || json === null) throw new Error("bad shape");
  },
  async diff(_json, prisma) {
    const p = await prisma.politicalParty.findUnique({
      where: { acronym: ACR },
      select: { slogan: true },
    });
    if (p?.slogan === MARKER) {
      return { creates: [], updates: [], unchangedCount: 1, sample: [] };
    }
    return {
      creates: [],
      unchangedCount: 0,
      updates: [
        {
          targetTable: "political_parties",
          targetField: FIELD,
          targetPk: ACR,
          changeKind: p?.slogan ? "correction" : "fill",
          proposedValue: MARKER,
          sources: [
            { url: "https://example.org", publisher: "example.org", snippet: "test", format: "html" },
          ],
          label: `${ACR} · ${FIELD}`,
        },
      ],
      sample: [{ kind: "update", label: `${ACR} · ${FIELD}`, detail: MARKER }],
    };
  },
};

describe("BulkImportService (integration)", () => {
  let prisma: PrismaService;
  let svc: BulkImportService;
  let originalSlogan: string | null = null;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const apply = new EnrichmentApplyService(prisma, imageStub, new CompletenessService(prisma));
    svc = new BulkImportService(prisma, apply);

    const p = await prisma.politicalParty.findUnique({ where: { acronym: ACR }, select: { slogan: true } });
    originalSlogan = p?.slogan ?? null;

    IMPORTERS[FIXTURE_NAME] = fixture;
  });

  afterAll(async () => {
    // Restore the live field.
    await prisma.politicalParty
      .update({ where: { acronym: ACR }, data: { slogan: originalSlogan } })
      .catch(() => {});
    // Remove fixture proposals (+ their sources via cascade) and import runs.
    await prisma.proposalSource.deleteMany({
      where: { proposal: { targetTable: "political_parties", targetPk: ACR, proposedValue: { equals: MARKER } } },
    }).catch(() => {});
    await prisma.changeProposal.deleteMany({
      where: { targetTable: "political_parties", targetPk: ACR, proposedValue: { equals: MARKER } },
    });
    await prisma.importRun.deleteMany({ where: { dataset: FIXTURE_NAME } });
    // Remove activity_log rows written by the non-uuid-PK fix: only rows that carry
    // metadata.targetPk = ACR (uuid-keyed tables never set targetPk in metadata).
    await prisma.$executeRaw`
      DELETE FROM activity_log
      WHERE target_type = 'political_parties'
        AND event_type  = 'proposal_applied'
        AND metadata->>'targetPk' = ${ACR}
    `.catch(() => {});
    delete IMPORTERS[FIXTURE_NAME];
    await prisma.onModuleDestroy();
  });

  it("preview throws NotFoundException for an unknown dataset", async () => {
    await expect(svc.preview("no-such-dataset", {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it("preview throws BadRequestException when validate fails", async () => {
    await expect(svc.preview(FIXTURE_NAME, null)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("preview returns the diff without writing", async () => {
    const diff = await svc.preview(FIXTURE_NAME, {});
    expect(diff.updates.length).toBe(1);
    const live = await prisma.politicalParty.findUnique({ where: { acronym: ACR }, select: { slogan: true } });
    expect(live?.slogan).not.toBe(MARKER); // no write happened
  });

  it("apply changes the live row through the audited pipeline and records an import_run", async () => {
    const result = await svc.apply(FIXTURE_NAME, {}, ADMIN);

    expect(result.updated).toBe(1);
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.runId).toBeTruthy();

    // The live row was actually written by the apply pipeline.
    const live = await prisma.politicalParty.findUnique({ where: { acronym: ACR }, select: { slogan: true } });
    expect(live?.slogan).toBe(MARKER);

    // The change_proposal was applied (status approved) via the audited path.
    const proposal = await prisma.changeProposal.findFirst({
      where: { targetTable: "political_parties", targetPk: ACR, proposedValue: { equals: MARKER } },
    });
    expect(proposal?.status).toBe("approved");
    expect(proposal?.appliedAt).toBeTruthy();

    // The import_run audit row was recorded.
    const run = await prisma.importRun.findUnique({ where: { id: result.runId } });
    expect(run?.status).toBe("done");
    expect(run?.updatedCount).toBe(1);
    expect(run?.dataset).toBe(FIXTURE_NAME);
    expect(run?.finishedAt).toBeTruthy();

    // activity_log non-uuid PK fix: political_parties is keyed by varchar `acronym`,
    // so the apply path must write the NIL uuid into target_id (a uuid column) and
    // carry the real natural key in metadata.targetPk instead of trying to cast ACR
    // as a uuid (which would roll back the whole transaction).
    const activityRow = await prisma.activityLog.findFirst({
      where: {
        eventType: "proposal_applied",
        targetType: "political_parties",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: { path: ["proposalId"], equals: (proposal as any)?.id },
      },
      orderBy: { createdAt: "desc" },
    });
    expect(activityRow).toBeTruthy();
    expect(activityRow?.targetId).toBe("00000000-0000-0000-0000-000000000000");
    expect((activityRow?.metadata as Record<string, unknown>)?.targetPk).toBe(ACR);
  });

  it("re-running is idempotent: 0 updates, skipped=1, live row unchanged", async () => {
    const result = await svc.apply(FIXTURE_NAME, {}, ADMIN);

    expect(result.updated).toBe(0);
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(0);

    const live = await prisma.politicalParty.findUnique({ where: { acronym: ACR }, select: { slogan: true } });
    expect(live?.slogan).toBe(MARKER);

    const run = await prisma.importRun.findUnique({ where: { id: result.runId } });
    expect(run?.status).toBe("done");
    expect(run?.skippedCount).toBe(1);
  });
});

/**
 * Apply-path regression for the political_parties CREATE: drives a create through
 * the REAL audited pipeline (BulkImportService.apply → EnrichmentApplyService
 * .applyCreate → politicalPartyEntity.insert). political_parties is keyed by the
 * varchar `acronym` (NOT a uuid), so the apply path must NOT roll back on:
 *   - copySourcesToEvidence (skipped: entity.evidenceEntryType = null), and
 *   - the activity_log.target_id uuid cast (nil uuid + acronym in metadata.targetPk).
 * Also asserts idempotency: a re-run sees the party as existing → 0 creates.
 */
const PARTY_FIXTURE = "test-fixture-party-create";
const NEW_ACR = "ZZQ"; // throwaway, must not exist in seed data
const NEW_NAME = "Zzq Apply Path Party";

const partyCreateFixture: DatasetImporter = {
  name: PARTY_FIXTURE,
  label: "test party create fixture",
  description: "test party create fixture",
  autoApprove: true,
  validate(json: unknown) {
    if (typeof json !== "object" || json === null) throw new Error("bad shape");
  },
  async diff(_json, prisma) {
    const existing = await prisma.politicalParty.findUnique({ where: { acronym: NEW_ACR } });
    if (existing) {
      return { creates: [], updates: [], unchangedCount: 1, sample: [] };
    }
    return {
      updates: [],
      unchangedCount: 0,
      creates: [
        {
          targetTable: "political_parties",
          changeKind: "create",
          proposedValue: { acronym: NEW_ACR, name: NEW_NAME, ideology: "Centrist" },
          confidence: "high",
          sources: [
            { url: "https://example.org/new-party", publisher: "example.org", snippet: "new party", format: "html" },
          ],
          label: `${NEW_ACR} · (new party)`,
        },
      ],
      sample: [{ kind: "create", label: `${NEW_ACR} · (new party)`, detail: NEW_NAME }],
    };
  },
};

describe("BulkImportService — political_parties CREATE apply path (integration)", () => {
  let prisma: PrismaService;
  let svc: BulkImportService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const apply = new EnrichmentApplyService(prisma, imageStub, new CompletenessService(prisma));
    svc = new BulkImportService(prisma, apply);
    // Defensive pre-clean.
    await prisma.politicalParty.delete({ where: { acronym: NEW_ACR } }).catch(() => {});
    IMPORTERS[PARTY_FIXTURE] = partyCreateFixture;
  });

  afterAll(async () => {
    await prisma.proposalSource
      .deleteMany({ where: { proposal: { targetTable: "political_parties", proposedValue: { path: ["acronym"], equals: NEW_ACR } } } })
      .catch(() => {});
    await prisma.changeProposal
      .deleteMany({ where: { targetTable: "political_parties", proposedValue: { path: ["acronym"], equals: NEW_ACR } } })
      .catch(() => {});
    await prisma.$executeRaw`
      DELETE FROM activity_log
      WHERE target_type = 'political_parties'
        AND event_type  = 'fact_created'
        AND metadata->>'targetPk' = ${NEW_ACR}
    `.catch(() => {});
    await prisma.importRun.deleteMany({ where: { dataset: PARTY_FIXTURE } }).catch(() => {});
    await prisma.politicalParty.delete({ where: { acronym: NEW_ACR } }).catch(() => {});
    delete IMPORTERS[PARTY_FIXTURE];
    await prisma.onModuleDestroy();
  });

  it("creates a brand-new political_parties row through the audited pipeline (no evidence/activity_log rollback)", async () => {
    const result = await svc.apply(PARTY_FIXTURE, {}, ADMIN);

    expect(result.errors).toHaveLength(0);
    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);

    // The party row was actually created (proves the tx committed — no rollback).
    const party = await prisma.politicalParty.findUnique({ where: { acronym: NEW_ACR } });
    expect(party).toBeTruthy();
    expect(party?.name).toBe(NEW_NAME);
    expect(party?.isActive).toBe(true);
    expect(party?.ideology).toBe("Centrist");

    // The proposal was applied via the audited path.
    const proposal = await prisma.changeProposal.findFirst({
      where: { targetTable: "political_parties", proposedValue: { path: ["acronym"], equals: NEW_ACR } },
    });
    expect(proposal?.status).toBe("approved");

    // No evidence rows were written (party CREATEs skip evidence — non-uuid PK).
    const proposalSources = await prisma.proposalSource.findMany({ where: { proposalId: proposal!.id } });
    expect(proposalSources.length).toBeGreaterThanOrEqual(1); // sources exist on the proposal…
    // …but they were NOT copied to evidence (no uuid entry_id to point at).
    // (evidence has no row keyed to a string acronym; nothing to assert beyond the commit succeeding.)

    // activity_log: nil uuid target_id + acronym carried in metadata.targetPk.
    const activityRow = await prisma.activityLog.findFirst({
      where: {
        eventType: "fact_created",
        targetType: "political_parties",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: { path: ["proposalId"], equals: (proposal as any)?.id },
      },
      orderBy: { createdAt: "desc" },
    });
    expect(activityRow).toBeTruthy();
    expect(activityRow?.targetId).toBe("00000000-0000-0000-0000-000000000000");
    expect((activityRow?.metadata as Record<string, unknown>)?.targetPk).toBe(NEW_ACR);
  });

  it("re-running is idempotent: the party already exists → 0 creates, skipped=1", async () => {
    const result = await svc.apply(PARTY_FIXTURE, {}, ADMIN);
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(0);
  });
});

/**
 * CRITICAL grant regression: the apply transaction runs as
 * `SET LOCAL ROLE enrichment_apply` and AuditService.log is its LAST write, so
 * the role needs INSERT on `audit_events`. Without it (the state before
 * migration 20260908090100 grew that GRANT) every campaigns import 500s and
 * rolls back — but only when an AuditService is actually wired, which the
 * other fixtures here deliberately skip. This one constructs the real thing.
 *
 * Asserts the ticket committed AND that its chain event landed.
 */
const CAMPAIGN_FIXTURE = "test-fixture-campaign-create";
const CAMPAIGN_TAG = Date.now().toString(36);
const CAMPAIGN_SLUG = `zzz-bulk-campaign-${CAMPAIGN_TAG}`;
const CAMPAIGN_YEAR = 2098;
const CANDIDATE_NAME = `Zzz Bulk Campaign ${CAMPAIGN_TAG}`;

const campaignCreateFixture: DatasetImporter = {
  name: CAMPAIGN_FIXTURE,
  label: "test campaign create fixture",
  description: "test campaign create fixture",
  autoApprove: true,
  validate(json: unknown) {
    if (typeof json !== "object" || json === null) throw new Error("bad shape");
  },
  async diff(_json, prisma) {
    const existing = await prisma.campaign.findUnique({ where: { slug: CAMPAIGN_SLUG } });
    if (existing) return { creates: [], updates: [], unchangedCount: 1, sample: [] };
    return {
      updates: [],
      unchangedCount: 0,
      creates: [
        {
          targetTable: "campaigns",
          changeKind: "create",
          proposedValue: {
            slug: CAMPAIGN_SLUG,
            party: "APC",
            electionType: "gubernatorial",
            year: CAMPAIGN_YEAR,
            stateCode: "lagos",
            candidate: { name: CANDIDATE_NAME },
            runningMate: null,
            visionLine: "audited import",
          },
          confidence: "high",
          sources: [
            { url: "https://example.org/ticket", publisher: "example.org", snippet: "ticket", format: "html" },
          ],
          label: `${CAMPAIGN_SLUG} (APC)`,
        },
      ],
      sample: [{ kind: "create", label: `${CAMPAIGN_SLUG} (APC)`, detail: CANDIDATE_NAME }],
    };
  },
};

describe("BulkImportService — campaigns CREATE with a real AuditService (integration)", () => {
  let prisma: PrismaService;
  let svc: BulkImportService;
  let campaignId: string | null = null;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    // The whole point of this suite: a REAL AuditService, so the apply tx
    // actually inserts into audit_events as enrichment_apply.
    const audit = new AuditService(prisma, new AuditCryptoService(prisma));
    const apply = new EnrichmentApplyService(prisma, imageStub, new CompletenessService(prisma), audit);
    svc = new BulkImportService(prisma, apply);
    IMPORTERS[CAMPAIGN_FIXTURE] = campaignCreateFixture;
  });

  afterAll(async () => {
    const row = await prisma.campaign.findUnique({
      where: { slug: CAMPAIGN_SLUG },
      select: { id: true, candidateOfficialId: true, runningMateOfficialId: true },
    });
    if (row) {
      await prisma.campaign.delete({ where: { id: row.id } }).catch(() => {});
      const officials = [row.candidateOfficialId, row.runningMateOfficialId].filter((x): x is string => Boolean(x));
      await prisma.officialElection.deleteMany({ where: { officialId: { in: officials } } }).catch(() => {});
      await prisma.nigerianOfficial.deleteMany({ where: { id: { in: officials } } }).catch(() => {});
    }
    await prisma.proposalSource
      .deleteMany({ where: { proposal: { targetTable: "campaigns", proposedValue: { path: ["slug"], equals: CAMPAIGN_SLUG } } } })
      .catch(() => {});
    await prisma.changeProposal
      .deleteMany({ where: { targetTable: "campaigns", proposedValue: { path: ["slug"], equals: CAMPAIGN_SLUG } } })
      .catch(() => {});
    if (campaignId) {
      await prisma.activityLog
        .deleteMany({ where: { targetType: "campaigns", targetId: campaignId } })
        .catch(() => {});
    }
    await prisma.importRun.deleteMany({ where: { dataset: CAMPAIGN_FIXTURE } }).catch(() => {});
    delete IMPORTERS[CAMPAIGN_FIXTURE];
    // audit_events is append-only by trigger — the chain row stays.
    await prisma.onModuleDestroy();
  });

  it("commits the ticket and its audit_events chain row under the enrichment_apply role", async () => {
    const result = await svc.apply(CAMPAIGN_FIXTURE, {}, ADMIN);

    expect(result.errors).toHaveLength(0);
    expect(result.created).toBe(1);

    // The ticket committed — proves the audit INSERT did not roll the tx back.
    const campaign = await prisma.campaign.findUnique({ where: { slug: CAMPAIGN_SLUG } });
    expect(campaign).toBeTruthy();
    expect(campaign?.status).toBe("draft");
    expect(campaign?.reviewStatus).toBe("unreviewed");
    campaignId = campaign!.id;

    // …and the chain event for it exists.
    const events = await prisma.$queryRaw<{ action: string; target_id: string }[]>`
      SELECT action, target_id FROM audit_events
      WHERE action = 'enrichment.fact_created' AND target_id = ${campaignId}
    `;
    expect(events).toHaveLength(1);
  });
});
