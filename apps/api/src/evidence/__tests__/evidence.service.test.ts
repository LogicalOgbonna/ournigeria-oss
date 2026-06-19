import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { EvidenceService } from "../evidence.service";

const SRC = {
  url: "https://inecnigeria.org/results/x",
  publisher: "inecnigeria.org",
  snippet: "declared winner with 762,134 votes",
  format: "html",
  sourceTier: "canonical",
  retrievedAt: new Date(),
};

describe("EvidenceService (integration)", () => {
  let prisma: PrismaService;
  let svc: EvidenceService;
  let officialId: string;
  let educationId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new EvidenceService(prisma);

    const official = await prisma.nigerianOfficial.create({
      data: { name: "Evidence Test Official 45b" },
    });
    officialId = official.id;
    const edu = await prisma.officialEducation.create({
      data: { officialId, institution: "Test University 45b", qualification: "B.Sc" },
    });
    educationId = edu.id;

    await svc.create({ entryType: "education", entryId: educationId, ...SRC });
    await svc.create({ entryType: "education", entryId: educationId, ...SRC, sourceTier: "web", publisher: "premium-times" });
    await svc.create({ entryType: "official_field", entryId: officialId, field: "biography", ...SRC });
  });

  afterAll(async () => {
    await prisma.evidence.deleteMany({ where: { entryId: { in: [officialId, educationId] } } });
    // official cascade-deletes the education row
    await prisma.nigerianOfficial.delete({ where: { id: officialId } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  it("batches one load across entries and groups by entryId", async () => {
    const map = await svc.loadForEntries([educationId, officialId]);
    expect(map.get(educationId)).toHaveLength(2);
    // canonical sorts before web
    expect(map.get(educationId)![0].sourceTier).toBe("canonical");
  });

  it("keys official-level field evidence as entryId#field", async () => {
    const map = await svc.loadForEntries([officialId]);
    expect(map.get(officialId)).toBeUndefined();
    expect(map.get(EvidenceService.key(officialId, "biography"))).toHaveLength(1);
  });

  it("attach() stitches evidence onto mapped entries", async () => {
    const map = await svc.loadForEntries([educationId]);
    const [entry] = svc.attach([{ id: educationId, institution: "Test University 45b" }], map);
    expect(entry.evidence).toHaveLength(2);
  });

  it("rejects official_field evidence without a field", async () => {
    await expect(
      svc.create({ entryType: "official_field", entryId: officialId, ...SRC }),
    ).rejects.toThrow(/requires a field/);
  });

  it("deleteFor() cascades evidence for a fact", async () => {
    const tmp = await prisma.officialAward.create({
      data: { officialId, title: "Temp Award 45b" },
    });
    await svc.create({ entryType: "award", entryId: tmp.id, ...SRC });
    expect(await svc.deleteFor("award", tmp.id)).toBe(1);
    const map = await svc.loadForEntries([tmp.id]);
    expect(map.size).toBe(0);
    await prisma.officialAward.delete({ where: { id: tmp.id } });
  });
});
