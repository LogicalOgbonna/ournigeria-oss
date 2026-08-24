import { test, expect, request as playwrightRequest } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

// Live-API regression for the seat-aware identify flow (design spec §9).
// Self-contained: seeds its own throwaway NigerianWard (unique per run, parented
// to a real seeded LGA) because the local DB has 0 wards. Tears everything down
// in afterAll so the spec is rerunnable and leaves no residue.
const API = process.env.E2E_API_URL || "http://localhost:3001/api";
const DB =
  process.env.DATABASE_URL ||
  "postgresql://spending:spending@localhost:5432/spending";
const WARD = `E2E-WARD-${randomBytes(4).toString("hex")}`;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DB }),
});
let lgaCode = "";
let stateCode = "";

test.beforeAll(async () => {
  const lga = await prisma.nigerianLga.findFirst({
    select: { code: true, stateCode: true },
  });
  if (!lga) throw new Error("no LGA seeded");
  lgaCode = lga.code;
  stateCode = lga.stateCode;
  await prisma.nigerianWard.create({
    data: { code: WARD, name: `E2E Ward ${WARD}`, lgaCode },
  });
});

test.afterAll(async () => {
  await prisma.nigerianOfficial.deleteMany({
    where: { positions: { some: { wardCode: WARD } } },
  });
  await prisma.nigerianWard.deleteMany({ where: { code: WARD } });
  await prisma.$disconnect();
});

test.describe("@web identify seat dedup + corroboration", () => {
  test("created -> competing -> corroborated, seat exposes candidates", async () => {
    const ctx = await playwrightRequest.newContext();

    // 1st submission for an empty seat → creates the canonical official/position.
    const first = await ctx.post(`${API}/proposals/identify`, {
      data: {
        name: "Ada Eze",
        role: "councilor",
        partyAcronym: "APC",
        wardCode: WARD,
        stateCode,
        lgaCode,
      },
    });
    expect(first.ok()).toBeTruthy();
    const firstBody = await first.json();
    expect(firstBody.outcome).toBe("created");
    const officialId = firstBody.officialId;
    const positionId = firstBody.positionId;

    // A different name at the same seat → competing candidate. NO new official/position.
    const second = await ctx.post(`${API}/proposals/identify`, {
      data: {
        name: "Chidi Okeke",
        role: "councilor",
        partyAcronym: "PDP",
        wardCode: WARD,
        stateCode,
        lgaCode,
      },
    });
    const secondBody = await second.json();
    expect(secondBody.outcome).toBe("competing");
    expect(secondBody.officialId).toBe(officialId);
    expect(secondBody.positionId).toBe(positionId);

    // An identical name at the same seat → corroboration (confirm/upvote).
    const third = await ctx.post(`${API}/proposals/identify`, {
      data: { name: "Ada Eze", role: "councilor", wardCode: WARD, stateCode, lgaCode },
    });
    const thirdBody = await third.json();
    expect(thirdBody.outcome).toBe("corroborated");
    expect(thirdBody.upvoteCount).toBeGreaterThanOrEqual(1);

    // The seat exposes the canonical official + ranked candidates.
    const seat = await ctx.get(
      `${API}/proposals/seat?role=councilor&wardCode=${WARD}&stateCode=${stateCode}&lgaCode=${lgaCode}`,
    );
    const seatBody = await seat.json();
    expect(seatBody.hasCanonical).toBe(true);
    expect(seatBody.official.id).toBe(officialId);
    const names = seatBody.candidates.map((c: any) => c.name).sort();
    expect(names).toEqual(["Ada Eze", "Chidi Okeke"]);
    const ada = seatBody.candidates.find((c: any) => c.name === "Ada Eze");
    expect(ada.confirmCount).toBeGreaterThanOrEqual(1);

    await ctx.dispose();
  });
});
