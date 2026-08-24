import { describe, expect, it, vi } from "vitest";
import { DraftDigestNotifierService } from "../scheduler/draft-digest-notifier.service.js";

// Config where the manual-posting relay is enabled; every other key resolves to
// the dashboard URL (constructor reads SOCIALS_DASHBOARD_URL).
function cfg(map: Record<string, any>) {
  return {
    get: (k: string) =>
      k in map ? map[k] : "https://dashboard.example/dashboard/social",
  } as any;
}

describe("DraftDigestNotifierService relay gate", () => {
  it("no-ops without querying when the relay is enabled", async () => {
    const prisma = {
      $queryRaw: vi.fn(),
      socialPost: { updateMany: vi.fn() },
    } as any;
    const telegram = { notify: vi.fn() } as any;
    const svc = new DraftDigestNotifierService(
      prisma,
      telegram,
      cfg({ SOCIALS_TELEGRAM_RELAY_ENABLED: true }),
    );

    await expect(svc.notifyDraftDigest()).resolves.toEqual({ notified: 0 });

    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(telegram.notify).not.toHaveBeenCalled();
  });
});
