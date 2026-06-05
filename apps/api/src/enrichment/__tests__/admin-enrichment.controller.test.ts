import { describe, it, expect, vi } from "vitest";
import { AdminEnrichmentController } from "../admin-enrichment.controller";

describe("AdminEnrichmentController", () => {
  const apply = { apply: vi.fn().mockResolvedValue(undefined) } as any;
  const query = {
    listByStatus: vi.fn().mockResolvedValue([{ id: "p1" }]),
    getWithSources: vi.fn().mockResolvedValue({ id: "p1", sources: [] }),
  } as any;
  const prisma = { changeProposal: { update: vi.fn().mockResolvedValue({ id: "p1" }) } } as any;
  const ctrl = new AdminEnrichmentController(apply, query, prisma);
  // The AdminGuard sets request.adminId (a plain string) — not request.admin.id
  const req = { adminId: "admin-1" } as any;

  it("lists by status (defaults to pending)", async () => {
    expect(await ctrl.list(undefined)).toEqual([{ id: "p1" }]);
    expect(query.listByStatus).toHaveBeenCalledWith("pending");
  });

  it("approve calls the apply service with the admin id", async () => {
    await ctrl.approve("p1", req);
    expect(apply.apply).toHaveBeenCalledWith("p1", "admin-1");
  });

  it("reject sets status=rejected with the note", async () => {
    await ctrl.reject("p1", { note: "bad source" }, req);
    expect(prisma.changeProposal.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "p1" },
      data: expect.objectContaining({ status: "rejected", reviewNote: "bad source", reviewedBy: "admin-1" }),
    }));
  });
});
