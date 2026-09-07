import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { listImporters } from "../importer.registry";
import { ImportsController } from "../imports.controller";

describe("imports registry wiring", () => {
  it("registers the party importers and the state-assembly importers", () => {
    const names = listImporters()
      .map((i) => i.name)
      .sort();
    expect(names).toEqual([
      "campaigns",
      "party-candidates",
      "party-officers",
      "party-profiles",
      "state-assembly-members",
      "state-assembly-reconciliation",
    ]);
  });
});

/** Build a multer-style file from a JS value (JSON-serialized into a Buffer). */
function jsonFile(value: unknown): Express.Multer.File {
  return { buffer: Buffer.from(JSON.stringify(value), "utf8") } as Express.Multer.File;
}

describe("ImportsController", () => {
  const svc = {
    preview: vi.fn().mockResolvedValue({ creates: [], updates: [], unchangedCount: 0, sample: [] }),
    apply: vi.fn().mockResolvedValue({ runId: "run-1", created: 1, updated: 0, skipped: 0, errors: [] }),
  } as any;
  const prisma = {
    importRun: { findMany: vi.fn().mockResolvedValue([]) },
  } as any;
  const audit = { log: vi.fn(async () => ({ seq: 1 })) } as any;
  const ctrl = new ImportsController(svc, prisma, audit);
  // AdminGuard sets request.adminId (a plain string)
  const req = { adminId: "admin-1" } as any;

  it("preview parses the JSON file and delegates to the service", async () => {
    svc.preview.mockClear();
    const payload = { parties: [{ acronym: "APC" }] };
    await ctrl.preview("party-profiles", jsonFile(payload));
    expect(svc.preview).toHaveBeenCalledWith("party-profiles", payload);
  });

  it("apply parses the JSON file and delegates with the admin id", async () => {
    svc.apply.mockClear();
    const payload = { officers: [{ party: "APC" }] };
    const res = await ctrl.apply("party-officers", jsonFile(payload), req);
    expect(svc.apply).toHaveBeenCalledWith("party-officers", payload, "admin-1");
    expect(res).toEqual({ runId: "run-1", created: 1, updated: 0, skipped: 0, errors: [] });
  });

  it("preview throws BadRequest when no file is uploaded", async () => {
    await expect(ctrl.preview("party-profiles", undefined as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("apply throws BadRequest when the file is not valid JSON", async () => {
    const bad = { buffer: Buffer.from("not json{", "utf8") } as Express.Multer.File;
    await expect(ctrl.apply("party-profiles", bad, req)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("list returns importer metadata joined with the latest run per dataset", async () => {
    prisma.importRun.findMany.mockResolvedValueOnce([
      { id: "r1", dataset: "party-profiles", status: "done", startedAt: new Date("2026-06-20") },
      { id: "r0", dataset: "party-profiles", status: "failed", startedAt: new Date("2026-06-19") },
    ]);
    const out = await ctrl.list();
    const profiles = out.find((i) => i.name === "party-profiles");
    expect(profiles).toBeDefined();
    expect(profiles).toMatchObject({ name: "party-profiles", autoApprove: expect.any(Boolean) });
    expect(profiles?.label).toBeTruthy();
    expect(profiles?.description).toBeTruthy();
    // latest run only (most recent startedAt)
    expect(profiles?.latestRun?.id).toBe("r1");
    // a dataset with no runs reports null
    const candidates = out.find((i) => i.name === "party-candidates");
    expect(candidates?.latestRun).toBeNull();
  });
});
