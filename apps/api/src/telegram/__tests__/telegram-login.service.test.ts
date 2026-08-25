import { describe, it, expect } from "vitest";
import { TelegramLoginService } from "../telegram-login.service";

// In-memory fake of the slice of PrismaService the service uses.
function makeFakePrisma() {
  const requests: any[] = [];
  const users: any[] = [];
  const api: any = {
    telegramLoginRequest: {
      create: async ({ data }: any) => {
        const row = { id: `req-${requests.length + 1}`, telegramId: null, userId: null, ...data };
        requests.push(row);
        return { ...row };
      },
      findUnique: async ({ where }: any) => {
        const r = requests.find(
          (x) =>
            (where.startParam !== undefined && x.startParam === where.startParam) ||
            (where.pollKey !== undefined && x.pollKey === where.pollKey) ||
            (where.id !== undefined && x.id === where.id),
        );
        return r ? { ...r } : null;
      },
      update: async ({ where, data }: any) => {
        const r = requests.find(
          (x) =>
            (where.startParam !== undefined && x.startParam === where.startParam) ||
            (where.pollKey !== undefined && x.pollKey === where.pollKey) ||
            (where.id !== undefined && x.id === where.id),
        );
        if (!r) throw new Error("request not found");
        Object.assign(r, data);
        return { ...r };
      },
      // Conditional-claim shape used by pollByKey's single-use consume: match on
      // pollKey AND current status, report how many rows actually flipped.
      updateMany: async ({ where, data }: any) => {
        const hits = requests.filter(
          (x) =>
            (where.pollKey === undefined || x.pollKey === where.pollKey) &&
            (where.status === undefined || x.status === where.status),
        );
        for (const r of hits) Object.assign(r, data);
        return { count: hits.length };
      },
      deleteMany: async () => ({ count: 0 }),
    },
    user: {
      findUnique: async ({ where }: any) => {
        const u = users.find(
          (x) =>
            (where.telegramId !== undefined && x.telegramId === where.telegramId) ||
            (where.id !== undefined && x.id === where.id),
        );
        return u ? { ...u } : null;
      },
      upsert: async ({ where, update, create }: any) => {
        const u = users.find((x) => x.telegramId === where.telegramId);
        if (u) {
          Object.assign(u, update);
          return { ...u };
        }
        const created = { id: `user-${users.length + 1}`, banned: false, ...create };
        users.push(created);
        return { ...created };
      },
      update: async ({ where, data }: any) => {
        const u = users.find((x) => x.id === where.id);
        if (!u) throw new Error("user not found");
        Object.assign(u, data);
        return { ...u };
      },
    },
    $transaction: async (fn: any) => fn(api),
  };
  return { prisma: api as any, requests, users };
}

// Disable rate limiting in unit tests by stubbing the limiter.
function makeService(prisma: any) {
  const svc = new TelegramLoginService(prisma);
  (svc as any).hitRateLimit = async () => false; // never limited
  return svc;
}

describe("TelegramLoginService.generateToken", () => {
  it("returns URL-safe tokens within Telegram's 64-char start-param limit", () => {
    const svc = makeService(makeFakePrisma().prisma);
    const t = svc.generateToken();
    expect(t.length).toBeGreaterThanOrEqual(16);
    expect(t.length).toBeLessThanOrEqual(64);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns distinct tokens on successive calls", () => {
    const svc = makeService(makeFakePrisma().prisma);
    expect(svc.generateToken()).not.toBe(svc.generateToken());
  });
});

describe("TelegramLoginService.createLoginRequest", () => {
  it("persists a pending row with distinct startParam and pollKey", async () => {
    const { prisma, requests } = makeFakePrisma();
    const svc = makeService(prisma);
    const out = await svc.createLoginRequest("login");
    expect(out.startParam).not.toBe(out.pollKey);
    expect(requests).toHaveLength(1);
    expect(requests[0].status).toBe("pending");
    expect(requests[0].intent).toBe("login");
    expect(requests[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("binds userId for link intent", async () => {
    const { prisma, requests } = makeFakePrisma();
    const svc = makeService(prisma);
    await svc.createLoginRequest("link", "user-42");
    expect(requests[0].intent).toBe("link");
    expect(requests[0].userId).toBe("user-42");
  });
});

describe("TelegramLoginService.resolveStartParam (login intent)", () => {
  it("authenticates and upserts a user by telegram id", async () => {
    const { prisma, requests, users } = makeFakePrisma();
    const svc = makeService(prisma);
    const { startParam } = await svc.createLoginRequest("login");

    const res = await svc.resolveStartParam(startParam, { id: 555, first_name: "Ada" });
    expect(res).toEqual({ ok: true });
    expect(requests[0].status).toBe("authenticated");
    expect(requests[0].telegramId).toBe("555");
    const created = users.find((u) => u.telegramId === "555");
    expect(created).toBeTruthy();
    expect(requests[0].userId).toBe(created.id);
  });

  it("rejects an unknown start param", async () => {
    const { prisma } = makeFakePrisma();
    const svc = makeService(prisma);
    const res = await svc.resolveStartParam("nope", { id: 1 });
    expect(res).toEqual({ ok: false, reason: "unknown" });
  });

  it("rejects an expired request", async () => {
    const { prisma, requests } = makeFakePrisma();
    const svc = makeService(prisma);
    const { startParam } = await svc.createLoginRequest("login");
    requests[0].expiresAt = new Date(Date.now() - 1000);
    const res = await svc.resolveStartParam(startParam, { id: 9 });
    expect(res).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects a request that is no longer pending (single-use against replay)", async () => {
    const { prisma, requests } = makeFakePrisma();
    const svc = makeService(prisma);
    const { startParam } = await svc.createLoginRequest("login");
    requests[0].status = "authenticated";
    const res = await svc.resolveStartParam(startParam, { id: 9 });
    expect(res).toEqual({ ok: false, reason: "already_used" });
  });

  it("blocks a banned user", async () => {
    const { prisma, requests, users } = makeFakePrisma();
    users.push({ id: "user-1", telegramId: "777", banned: true });
    const svc = makeService(prisma);
    const { startParam } = await svc.createLoginRequest("login");
    const res = await svc.resolveStartParam(startParam, { id: 777 });
    expect(res).toEqual({ ok: false, reason: "banned" });
    expect(requests[0].status).toBe("pending"); // not authenticated
  });
});

describe("TelegramLoginService.resolveStartParam (link intent)", () => {
  it("attaches telegram id to the bound user and moves it off any prior owner", async () => {
    const { prisma, requests, users } = makeFakePrisma();
    users.push({ id: "bound-user", telegramId: null, banned: false });
    users.push({ id: "old-owner", telegramId: "888", banned: false });
    const svc = makeService(prisma);
    const { startParam } = await svc.createLoginRequest("link", "bound-user");

    const res = await svc.resolveStartParam(startParam, { id: 888 });
    expect(res).toEqual({ ok: true });
    expect(users.find((u) => u.id === "bound-user").telegramId).toBe("888");
    expect(users.find((u) => u.id === "old-owner").telegramId).toBeNull();
    expect(requests[0].userId).toBe("bound-user");
  });
});

describe("TelegramLoginService.pollByKey", () => {
  it("returns pending before authentication", async () => {
    const { prisma } = makeFakePrisma();
    const svc = makeService(prisma);
    const { pollKey } = await svc.createLoginRequest("login");
    expect(await svc.pollByKey(pollKey)).toEqual({ status: "pending" });
  });

  it("returns authenticated once, then expired (single-use consume)", async () => {
    const { prisma } = makeFakePrisma();
    const svc = makeService(prisma);
    const { startParam, pollKey } = await svc.createLoginRequest("login");
    await svc.resolveStartParam(startParam, { id: 12 });

    const first = await svc.pollByKey(pollKey);
    expect(first.status).toBe("authenticated");
    expect((first as any).userId).toBeTruthy();

    const second = await svc.pollByKey(pollKey);
    expect(second).toEqual({ status: "expired" });
  });

  it("returns expired for an unknown poll key", async () => {
    const { prisma } = makeFakePrisma();
    const svc = makeService(prisma);
    expect(await svc.pollByKey("nope")).toEqual({ status: "expired" });
  });

  it("returns expired for a timed-out pending request", async () => {
    const { prisma, requests } = makeFakePrisma();
    const svc = makeService(prisma);
    const { pollKey } = await svc.createLoginRequest("login");
    requests[0].expiresAt = new Date(Date.now() - 1000);
    expect(await svc.pollByKey(pollKey)).toEqual({ status: "expired" });
  });
});
