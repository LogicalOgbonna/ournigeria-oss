import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { AdminOfficialsService } from "../admin-officials.service";

const OID = "33333333-3333-3333-3333-333333333333";
const ACTOR = { actorType: "staff" as const, actorId: "admin-1" };

function makeStub(overrides: { existing?: Record<string, unknown> | null } = {}) {
  const existing =
    overrides.existing === undefined
      ? {
          id: OID,
          name: "Test Person",
          slug: "test-person",
          email: "old@x.ng",
          biography: null,
          deletedAt: null,
          deletionReason: null,
        }
      : overrides.existing;
  const tx = {
    nigerianOfficial: {
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
      create: vi.fn(async ({ data }: any) => ({ id: OID, ...data })),
      update: vi.fn(async ({ data }: any) => ({ ...existing, ...data })),
    },
    officialSlugAlias: {
      findMany: vi.fn(async () => []), // usedSlugs: other officials' aliases count as taken
      findUnique: vi.fn(async () => null),
      delete: vi.fn(async () => ({})),
      deleteMany: vi.fn(async () => ({})),
      upsert: vi.fn(async () => ({})),
    },
  };
  const prisma = {
    $transaction: vi.fn(async (fn: any) => fn(tx)),
    nigerianOfficial: { findUnique: vi.fn(async () => existing) },
  };
  const audit = { log: vi.fn(async () => ({ seq: 1 })) };
  const completeness = { recompute: vi.fn(async () => undefined) };
  const svc = new AdminOfficialsService(
    prisma as never,
    audit as never,
    completeness as never,
  );
  return { svc, prisma, tx, audit, completeness };
}

describe("AdminOfficialsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("create slugs the name and logs official.created in the tx", async () => {
    const { svc, tx, audit } = makeStub();
    const created = await svc.create(ACTOR, { name: "Ada Lovelace" });
    expect(tx.nigerianOfficial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Ada Lovelace", slug: "ada-lovelace" }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      tx,
      ACTOR,
      expect.objectContaining({
        action: "official.created",
        metadata: { pathway: "direct" },
      }),
    );
    expect(created.id).toBe(OID);
  });

  it("update requires a reason and logs a changed-fields diff", async () => {
    const { svc, tx, audit } = makeStub();
    await expect(svc.update(ACTOR, OID, { email: "n@x.ng" }, "")).rejects.toThrow(
      BadRequestException,
    );
    await svc.update(ACTOR, OID, { email: "new@x.ng" }, "verified new contact");
    const [, , event] = audit.log.mock.calls[0] as unknown as [unknown, unknown, any];
    expect(event.action).toBe("official.updated");
    expect(event.diff.before).toEqual({ email: "old@x.ng" });
    expect(event.diff.after).toEqual({ email: "new@x.ng" });
    expect(event.metadata).toMatchObject({ pathway: "direct", reason: "verified new contact" });
    expect(tx.nigerianOfficial.update).toHaveBeenCalled();
  });

  it("update on a name reslugs and preserves the old slug as an alias", async () => {
    const { svc, tx } = makeStub();
    await svc.update(ACTOR, OID, { name: "Renamed Person" }, "name correction");
    expect(tx.officialSlugAlias.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "test-person" } }),
    );
  });

  it("slug update validates format, refuses hijacks, writes redirect + audit", async () => {
    const { svc, tx, audit } = makeStub();
    await expect(
      svc.updateSlug(ACTOR, OID, "Bad Slug!", "x reason"),
    ).rejects.toThrow(/invalid slug/i);

    await svc.updateSlug(ACTOR, OID, "clean-slug", "seo fix");
    expect(tx.officialSlugAlias.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "test-person" } }),
    );
    const [, , event] = audit.log.mock.calls[0] as unknown as [unknown, unknown, any];
    expect(event.action).toBe("official.slug.updated");
    expect(event.diff).toEqual({
      before: { slug: "test-person" },
      after: { slug: "clean-slug" },
    });
  });

  it("slug update 409s when another official's redirect owns the slug", async () => {
    const { svc, tx } = makeStub();
    tx.officialSlugAlias.findUnique.mockResolvedValueOnce({
      officialId: "someone-else",
    } as never);
    await expect(
      svc.updateSlug(ACTOR, OID, "taken-slug", "x reason"),
    ).rejects.toThrow(ConflictException);
  });

  it("soft delete snapshots the row; restore reverses; double-delete 409s", async () => {
    const { svc, audit } = makeStub();
    await svc.softDelete(ACTOR, OID, "duplicate record");
    const [, , event] = audit.log.mock.calls[0] as unknown as [unknown, unknown, any];
    expect(event.action).toBe("official.deleted");
    expect(event.diff.before).toMatchObject({ name: "Test Person" });
    expect(event.diff.after).toBeNull();

    const deleted = makeStub({
      existing: { id: OID, name: "X", deletedAt: new Date(), deletionReason: "dup" },
    });
    await expect(
      deleted.svc.softDelete(ACTOR, OID, "again"),
    ).rejects.toThrow(ConflictException);
    await deleted.svc.restore(ACTOR, OID);
    const [, , restoreEvent] = deleted.audit.log.mock.calls[0] as unknown as [
      unknown,
      unknown,
      any,
    ];
    expect(restoreEvent.action).toBe("official.restored");
  });

  it("404s on missing or already-deleted officials for update", async () => {
    const missing = makeStub({ existing: null });
    await expect(
      missing.svc.update(ACTOR, OID, { email: "x@x.ng" }, "reason here"),
    ).rejects.toThrow(NotFoundException);
    const deleted = makeStub({
      existing: { id: OID, name: "X", slug: "x", deletedAt: new Date() },
    });
    await expect(
      deleted.svc.update(ACTOR, OID, { email: "x@x.ng" }, "reason here"),
    ).rejects.toThrow(NotFoundException);
  });
});
