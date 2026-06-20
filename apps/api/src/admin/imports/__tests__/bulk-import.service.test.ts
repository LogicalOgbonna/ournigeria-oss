import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { EnrichmentApplyService } from "../../../enrichment/enrichment-apply.service";
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
