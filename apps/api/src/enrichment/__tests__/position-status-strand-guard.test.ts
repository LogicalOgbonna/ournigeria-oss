import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { EnrichmentApplyService } from "../enrichment-apply.service";
import type { ImageStorageService } from "../../images/image-storage.service";
import { CompletenessService } from "../../completeness/completeness.service";

const imageStorageStub = {
  isStoredUrl: () => true,
  storeOfficialImage: async (s: string) => ({ url: String(s), urlSmall: String(s) }),
} as unknown as ImageStorageService;

const ADMIN = "11111111-1111-1111-1111-111111111111";
const ZONE = "TZ_GUARD";
const STATE = "ts-guard";
const SEAT = "TS-GUARD-HA-01";

/**
 * Issue #109: a status downgrade (active → contested) must never leave an
 * occupied seat with zero active holders — the 2026-06-26 incident orphaned
 * 314 mha seats this way. The members importer is safe because bulk imports
 * apply creates (replacement install) before updates (downgrade).
 */
describe("official_positions status downgrade seat-stranding guard (integration)", () => {
  let prisma: PrismaService;
  let svc: EnrichmentApplyService;
  let holderId: string;
  let holderPositionId: string;
  let replacementId: string | undefined;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new EnrichmentApplyService(prisma, imageStorageStub, new CompletenessService(prisma));

    await prisma.$executeRawUnsafe(
      `INSERT INTO geopolitical_zones (code, name) VALUES ($1, 'Test Zone Guard') ON CONFLICT (code) DO NOTHING`,
      ZONE,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO nigerian_states (code, name, zone_code, capital) VALUES ($1, 'Test Guard State', $2, 'Testville') ON CONFLICT (code) DO NOTHING`,
      STATE,
      ZONE,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO nigerian_constituencies (code, name, type, state_code) VALUES ($1, 'Guard Test Constituency', 'state', $2) ON CONFLICT (code) DO NOTHING`,
      SEAT,
      STATE,
    );

    const holder = await prisma.nigerianOfficial.create({
      data: { name: "Strand Guard Holder", officialType: "elected" },
    });
    holderId = holder.id;
    const pos = await prisma.officialPosition.create({
      data: {
        officialId: holderId,
        role: "mha",
        status: "active",
        constituencyCode: SEAT,
        startDate: new Date("2023-06-01"),
      },
    });
    holderPositionId = pos.id;
  });

  afterAll(async () => {
    await prisma.changeProposal.deleteMany({ where: { targetPk: holderPositionId } });
    await prisma.officialPosition.deleteMany({ where: { constituencyCode: SEAT } });
    await prisma.nigerianOfficial.deleteMany({
      where: { id: { in: [holderId, replacementId].filter(Boolean) as string[] } },
    });
    await prisma.$executeRawUnsafe(`DELETE FROM nigerian_constituencies WHERE code = $1`, SEAT);
    await prisma.$executeRawUnsafe(`DELETE FROM nigerian_states WHERE code = $1`, STATE);
    await prisma.$executeRawUnsafe(`DELETE FROM geopolitical_zones WHERE code = $1`, ZONE);
    await prisma.onModuleDestroy();
  });

  async function proposeDowngrade(): Promise<string> {
    const proposal = await prisma.changeProposal.create({
      data: {
        targetTable: "official_positions",
        targetPk: holderPositionId,
        targetField: "status",
        proposedValue: "contested",
        changeKind: "correction",
        status: "pending",
      },
    });
    return proposal.id;
  }

  it("refuses to downgrade the seat's ONLY active holder", async () => {
    const proposalId = await proposeDowngrade();
    await expect(svc.apply(proposalId, ADMIN)).rejects.toThrow(/no active holder/i);

    const pos = await prisma.officialPosition.findUnique({ where: { id: holderPositionId } });
    expect(pos?.status).toBe("active");
  });

  it("does not guard state-jurisdiction positions (constituency_code null)", async () => {
    // Guard scope is constituency seats — the incident class. A state-level
    // position (e.g. governor, state_code jurisdiction) passes through.
    const pos = await prisma.officialPosition.create({
      data: {
        officialId: holderId,
        role: "governor",
        status: "active",
        stateCode: STATE,
        startDate: new Date("2023-06-01"),
      },
    });
    const proposal = await prisma.changeProposal.create({
      data: {
        targetTable: "official_positions",
        targetPk: pos.id,
        targetField: "status",
        proposedValue: "contested",
        changeKind: "correction",
        status: "pending",
      },
    });
    await svc.apply(proposal.id, ADMIN);
    const after = await prisma.officialPosition.findUnique({ where: { id: pos.id } });
    expect(after?.status).toBe("contested");
    await prisma.changeProposal.deleteMany({ where: { targetPk: pos.id } });
    await prisma.officialPosition.delete({ where: { id: pos.id } });
  });

  it("allows the downgrade once a replacement active holder exists", async () => {
    const replacement = await prisma.nigerianOfficial.create({
      data: { name: "Strand Guard Replacement", officialType: "elected" },
    });
    replacementId = replacement.id;
    await prisma.officialPosition.create({
      data: {
        officialId: replacementId,
        role: "mha",
        status: "active",
        constituencyCode: SEAT,
        startDate: new Date("2023-06-01"),
      },
    });

    const proposalId = await proposeDowngrade();
    await svc.apply(proposalId, ADMIN);

    const pos = await prisma.officialPosition.findUnique({ where: { id: holderPositionId } });
    expect(pos?.status).toBe("contested");
  });
});
