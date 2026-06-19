import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { createHash } from "crypto";
import { PrismaService } from "@ournigeria/database";
import { EvidenceSnapshotService } from "../evidence-snapshot.service";
import { EvidenceService } from "../evidence.service";

const PAGE = "<html><body>INEC declared results — 762,134 votes</body></html>";

/** Minimal ConfigService stand-in (S3 client is stubbed; values are inert). */
const configStub = {
  getOrThrow: (k: string) => `test-${k.toLowerCase()}`,
  get: () => undefined,
} as any;

describe("EvidenceSnapshotService (integration, stubbed S3)", () => {
  let prisma: PrismaService;
  let evidence: EvidenceService;
  let svc: EvidenceSnapshotService;
  let server: Server;
  let baseUrl: string;
  let officialId: string;
  let awardId: string;
  const puts: { key: string; bytes: number; contentType: string }[] = [];

  beforeAll(async () => {
    server = createServer((req, res) => {
      if (req.url === "/ok") {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(PAGE);
      } else if (req.url === "/huge") {
        // Declared content-length over the cap — rejected without download.
        res.writeHead(200, { "content-type": "text/html", "content-length": String(25 * 1024 * 1024) });
        res.end("x");
      } else {
        res.writeHead(404);
        res.end("gone");
      }
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    prisma = new PrismaService();
    await prisma.onModuleInit();
    evidence = new EvidenceService(prisma);
    svc = new EvidenceSnapshotService(prisma, configStub);
    // Stub S3 — record puts instead of talking to AWS.
    (svc as any).s3 = {
      send: async (cmd: any) => {
        puts.push({
          key: cmd.input.Key,
          bytes: cmd.input.Body.length,
          contentType: cmd.input.ContentType,
        });
      },
    };

    const o = await prisma.nigerianOfficial.create({ data: { name: "Snapshot Test Official 45d" } });
    officialId = o.id;
    const award = await prisma.officialAward.create({ data: { officialId, title: "Snapshot Award" } });
    awardId = award.id;
  });

  afterAll(async () => {
    await prisma.evidence.deleteMany({ where: { entryId: awardId } });
    await prisma.nigerianOfficial.delete({ where: { id: officialId } }).catch(() => {});
    await prisma.onModuleDestroy();
    await new Promise<void>((r) => server.close(() => r()));
  });

  function mkEvidence(url: string) {
    return evidence.create({
      entryType: "award",
      entryId: awardId,
      url,
      publisher: "test",
      snippet: "snippet",
      format: "html",
      sourceTier: "web",
      retrievedAt: new Date(),
    });
  }

  it("captures a reachable source: S3 put + hash + size + captured status", async () => {
    const row = await mkEvidence(`${baseUrl}/ok`);
    expect(await svc.capture(row.id)).toBe("captured");

    const after = await prisma.evidence.findUnique({ where: { id: row.id } });
    expect(after?.snapshotStatus).toBe("captured");
    expect(after?.snapshotKey).toBe(`evidence-snapshots/${row.id}`);
    expect(after?.byteSize).toBe(Buffer.byteLength(PAGE));
    expect(after?.contentHash).toBe(createHash("sha256").update(PAGE).digest("hex"));
    expect(after?.capturedAt).toBeTruthy();

    const put = puts.find((p) => p.key === `evidence-snapshots/${row.id}`);
    expect(put).toBeTruthy();
    expect(put!.contentType).toContain("text/html");
  });

  it("marks an HTTP 404 source failed without retrying (4xx = no retry)", async () => {
    const row = await mkEvidence(`${baseUrl}/missing`);
    expect(await svc.capture(row.id)).toBe("failed");
    const after = await prisma.evidence.findUnique({ where: { id: row.id } });
    expect(after?.snapshotStatus).toBe("failed");
    expect(after?.snapshotKey).toBeNull();
  });

  it("rejects an oversized source via the declared content-length cap", async () => {
    const row = await mkEvidence(`${baseUrl}/huge`);
    expect(await svc.capture(row.id)).toBe("failed");
  });

  it("sweepPending processes pending rows and skips already-captured ones", async () => {
    const fresh = await mkEvidence(`${baseUrl}/ok`);
    const res = await svc.sweepPending(50);
    expect(res.captured).toBeGreaterThanOrEqual(1);

    const after = await prisma.evidence.findUnique({ where: { id: fresh.id } });
    expect(after?.snapshotStatus).toBe("captured");
    // second pass: nothing pending for this entry anymore
    expect(await svc.capture(fresh.id)).toBe("skipped");
  });
});
