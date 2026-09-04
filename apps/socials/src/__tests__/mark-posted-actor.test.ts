import { describe, it, expect, vi } from "vitest";
import { ReplyQueueService } from "../reply-queue/reply-queue.service.js";

function svc(post: any) {
  const socialPost = {
    findUnique: vi.fn().mockResolvedValue(post),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...post, ...data })),
  };
  const prisma = { socialPost } as any;
  const s = new ReplyQueueService(
    prisma,
    {} as any,
    {} as any,
    { get: () => 10 } as any,
  );
  return { s, socialPost };
}

describe("markPosted with telegram actor", () => {
  it("records telegramActor and stamps published", async () => {
    const { s, socialPost } = svc({ id: "p1", status: "drafted", externalId: null });
    await s.markPosted("p1", "sys-uuid", undefined, "@ops_dan");
    const data = socialPost.update.mock.calls[0][0].data;
    expect(data.status).toBe("published");
    expect(data.telegramActor).toBe("@ops_dan");
    expect(data.reviewedBy).toBe("sys-uuid");
  });

  it("is a no-op when the row is already published (double-tap / cross-surface)", async () => {
    const { s, socialPost } = svc({ id: "p1", status: "published", externalId: "9" });
    const res = await s.markPosted("p1", "sys-uuid", undefined, "@ops_dan");
    expect(socialPost.update).not.toHaveBeenCalled();
    expect(res.status).toBe("published");
  });

  it("does NOT resurrect a rejected draft (paste-URL path can't un-reject)", async () => {
    const { s, socialPost } = svc({ id: "p1", status: "rejected", externalId: null });
    const res = await s.markPosted("p1", "sys-uuid", "1899", "@ops_dan");
    expect(socialPost.update).not.toHaveBeenCalled();
    expect(res.status).toBe("rejected");
  });
});

describe("reject idempotency + actor", () => {
  it("no-ops when already rejected", async () => {
    const { s, socialPost } = svc({ id: "p1", status: "rejected" });
    await s.reject("p1", "sys-uuid", "@ops_dan");
    expect(socialPost.update).not.toHaveBeenCalled();
  });
  it("records telegramActor on reject", async () => {
    const { s, socialPost } = svc({ id: "p1", status: "drafted" });
    await s.reject("p1", "sys-uuid", "@ops_dan");
    expect(socialPost.update.mock.calls[0][0].data.telegramActor).toBe("@ops_dan");
  });
});
