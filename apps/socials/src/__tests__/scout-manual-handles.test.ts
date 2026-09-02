import { describe, it, expect, vi } from "vitest";
import { ScoutController } from "../platforms/twitter/controllers/scout.controller.js";

function makeController(opts?: {
  existing?: { handle: string; status: string } | null;
  lga?: { code: string; stateCode: string } | null;
  ward?: { code: string; lgaCode: string } | null;
}) {
  const scout = {} as any;
  const handles = {
    findByHandle: vi.fn().mockResolvedValue(opts?.existing ?? null),
    createManual: vi.fn().mockImplementation(async (i) => ({ id: "new1", ...i })),
    delete: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue([]),
    updateStatus: vi.fn(),
  } as any;
  const settings = {} as any;
  const prisma = {
    nigerianState: {
      findUnique: vi.fn().mockImplementation(async ({ where }) =>
        where.code === "kano" ? { code: "kano", name: "Kano" } : null,
      ),
      findMany: vi.fn().mockResolvedValue([]),
    },
    nigerianLga: {
      findUnique: vi.fn().mockResolvedValue(opts?.lga ?? null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    nigerianWard: { findUnique: vi.fn().mockResolvedValue(opts?.ward ?? null) },
  } as any;
  return {
    ctrl: new ScoutController(scout, handles, settings, prisma),
    handles,
  };
}

describe("ScoutController manual add/remove", () => {
  it("adds a handle (strips leading @, validates state)", async () => {
    const { ctrl, handles } = makeController();
    const created = await ctrl.createHandle({ handle: "@Ada_NG", stateCode: "kano" });
    expect(handles.createManual).toHaveBeenCalledWith(
      expect.objectContaining({ handle: "Ada_NG", stateCode: "kano" }),
    );
    expect(created.id).toBe("new1");
  });

  it("rejects a malformed handle", async () => {
    const { ctrl } = makeController();
    await expect(
      ctrl.createHandle({ handle: "not a handle!", stateCode: "kano" }),
    ).rejects.toThrow(/handle must be/);
  });

  it("rejects an unknown state slug", async () => {
    const { ctrl } = makeController();
    await expect(
      ctrl.createHandle({ handle: "ada_ng", stateCode: "KN" }),
    ).rejects.toThrow(/stateCode must be a valid state slug/);
  });

  it("rejects an LGA that belongs to another state", async () => {
    const { ctrl } = makeController({
      lga: { code: "lagos_ikeja", stateCode: "lagos" },
    });
    await expect(
      ctrl.createHandle({ handle: "ada_ng", stateCode: "kano", lgaCode: "lagos_ikeja" }),
    ).rejects.toThrow(/not an LGA of kano/);
  });

  it("rejects a ward from another state even when no lgaCode is supplied", async () => {
    // Regression: ward validation used to be skipped entirely without lgaCode,
    // accepting any ward from any state.
    const { ctrl } = makeController({
      ward: { code: "lagos_ikeja_w01", lgaCode: "lagos_ikeja" },
      lga: { code: "lagos_ikeja", stateCode: "lagos" },
    });
    await expect(
      ctrl.createHandle({ handle: "ada_ng", stateCode: "kano", wardCode: "lagos_ikeja_w01" }),
    ).rejects.toThrow(/does not belong to kano/);
  });

  it("409s on a duplicate handle (case-insensitive)", async () => {
    const { ctrl, handles } = makeController({
      existing: { handle: "Ada_NG", status: "active" },
    });
    await expect(
      ctrl.createHandle({ handle: "ada_ng", stateCode: "kano" }),
    ).rejects.toThrow(/already tracked/);
    expect(handles.createManual).not.toHaveBeenCalled();
  });

  it("deletes a handle; P2025 → 404, other errors pass through as-is", async () => {
    const { ctrl, handles } = makeController();
    expect(await ctrl.deleteHandle("h1")).toEqual({ ok: true });
    handles.delete.mockRejectedValue(
      Object.assign(new Error("not found"), { code: "P2025" }),
    );
    await expect(ctrl.deleteHandle("nope")).rejects.toThrow(/Not Found/);
    // A DB outage must NOT be misreported as "row does not exist".
    handles.delete.mockRejectedValue(new Error("connection refused"));
    await expect(ctrl.deleteHandle("h2")).rejects.toThrow(/connection refused/);
  });

  it("PATCH rejects statuses outside the curation set and 404s unknown ids", async () => {
    const { ctrl, handles } = makeController();
    // "pending" is a birth status, not an operator-settable one; arbitrary
    // strings must never reach the status column.
    await expect(
      ctrl.updateHandle("h1", { status: "pending" }),
    ).rejects.toThrow(/status must be one of/);
    await expect(ctrl.updateHandle("h1", { status: "banned" })).rejects.toThrow(
      /status must be one of/,
    );
    handles.updateStatus.mockRejectedValue(
      Object.assign(new Error("gone"), { code: "P2025" }),
    );
    await expect(
      ctrl.updateHandle("stale-id", { status: "active" }),
    ).rejects.toThrow(/Not Found/);
  });

  it("rejects malformed limit/offset with a 400 instead of a Prisma 500", async () => {
    const { ctrl, handles } = makeController();
    expect(() => ctrl.list(undefined, undefined, "abc")).toThrow(
      /limit must be a non-negative integer/,
    );
    expect(() => ctrl.list(undefined, undefined, "10", "-5")).toThrow(
      /offset must be a non-negative integer/,
    );
    await ctrl.list(undefined, undefined, "10", "20");
    expect(handles.list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 20 }),
    );
  });
});
