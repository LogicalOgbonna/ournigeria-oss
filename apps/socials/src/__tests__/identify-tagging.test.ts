import { describe, it, expect, vi } from "vitest";
import { IdentifyCampaignService } from "../identify/identify-campaign.service.js";

const CFG: Record<string, number> = {
  SOCIALS_TAG_MAX_HANDLES: 2,
  SOCIALS_TAG_COOLDOWN_DAYS: 14,
  SOCIALS_TAG_DAILY_CAP: 10,
  SOCIALS_TAG_ACTIVE_DAYS: 30,
};

const SEAT_ROW = {
  seat_code: "kano_dala_w01",
  seat_name: "Dala Ward 1",
  lga_code: "kano_dala",
  lga_name: "Dala",
  state_code: "kano",
  state_name: "Kano",
};

function makeService(opts: {
  tagHandles: boolean;
  picked?: Array<{ id: string; handle: string }>;
  taggedToday?: number;
  unsafeHandles?: string[];
  seatRow?: Record<string, unknown>;
}) {
  const config = { get: (k: string) => CFG[k] } as any;
  const prisma = {
    // First raw query is selectSeat (one row); later ones (seatHasPosition)
    // must return empty so the park path proceeds.
    $queryRawUnsafe: vi
      .fn()
      .mockResolvedValueOnce([opts.seatRow ?? SEAT_ROW])
      .mockResolvedValue([]),
    socialPost: {
      create: vi.fn().mockResolvedValue({ id: "post1" }),
    },
    identifyCampaignTarget: {
      create: vi.fn().mockResolvedValue({}),
    },
  } as any;
  const publisher = { publishOriginal: vi.fn() } as any;
  const unsafe = new Set((opts.unsafeHandles ?? []).map((h) => `@${h}`));
  const safetyFilter = {
    check: vi.fn().mockImplementation((content: string) =>
      unsafe.has(content)
        ? { safe: false, warnings: ["blocked keyword"], blocked: false, blockReasons: [] }
        : { safe: true, warnings: [], blocked: false, blockReasons: [] },
    ),
  } as any;
  const settings = {
    getTagHandles: vi.fn().mockResolvedValue(opts.tagHandles),
    getIdentifyAutoPost: vi.fn().mockResolvedValue(false),
  } as any;
  const templates = {
    pickIdentify: vi
      .fn()
      .mockResolvedValue("Who represents {ward}, {lga}, {state}? {url}"),
  } as any;
  const scoutedHandles = {
    pickForLocation: vi.fn().mockResolvedValue(opts.picked ?? []),
    markTagged: vi.fn().mockResolvedValue(undefined),
    taggedInLastDay: vi.fn().mockResolvedValue(opts.taggedToday ?? 0),
    updateStatus: vi.fn().mockResolvedValue({}),
  } as any;

  const svc = new IdentifyCampaignService(
    config,
    prisma,
    publisher,
    safetyFilter,
    settings,
    templates,
    scoutedHandles,
  );
  return { svc, scoutedHandles, safetyFilter, prisma, publisher };
}

describe("IdentifyCampaignService location-handle tagging", () => {
  it("appends scouted handles when the tag_handles toggle is on", async () => {
    const { svc, scoutedHandles, safetyFilter } = makeService({
      tagHandles: true,
      picked: [
        { id: "h1", handle: "ada_ng" },
        { id: "h2", handle: "musa_k" },
      ],
    });
    const preview = await svc.postOneCategory("councilor", 0, { dryRun: true });
    // Directed question at the locals, referencing their place — not a bare cc.
    expect(preview?.text).toContain("@ada_ng @musa_k");
    expect(preview?.text).toContain(
      "you're from Dala Ward 1, Dala, do you know who this is?",
    );
    expect(preview?.text).not.toContain("cc @");
    // Most granular first: the councilor seat's ward code + the recency window.
    expect(scoutedHandles.pickForLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        stateCode: "kano",
        lgaCode: "kano_dala",
        wardCode: "kano_dala_w01",
        limit: 2,
        activeWithinDays: 30,
      }),
    );
    // Safety runs on the FINAL tagged text (earlier calls are the per-handle
    // screens).
    expect(safetyFilter.check.mock.calls.at(-1)![0]).toContain("@ada_ng");
    // Dry run performs no writes — no cooldown stamped.
    expect(scoutedHandles.markTagged).not.toHaveBeenCalled();
  });

  it("leaves the tweet untouched when the toggle is off", async () => {
    const { svc, scoutedHandles } = makeService({ tagHandles: false });
    const preview = await svc.postOneCategory("councilor", 0, { dryRun: true });
    expect(preview?.text).not.toContain("do you know who this is?");
    expect(scoutedHandles.pickForLocation).not.toHaveBeenCalled();
  });

  it("survives a tagging failure — tweet goes out untagged", async () => {
    const { svc, scoutedHandles } = makeService({ tagHandles: true });
    scoutedHandles.pickForLocation.mockRejectedValue(new Error("db down"));
    const preview = await svc.postOneCategory("councilor", 0, { dryRun: true });
    expect(preview?.text).toContain("Who represents Dala Ward 1");
    expect(preview?.text).not.toContain("do you know who this is?");
  });

  it("stops tagging for the day once the global daily cap is reached", async () => {
    const { svc, scoutedHandles } = makeService({
      tagHandles: true,
      picked: [{ id: "h1", handle: "ada_ng" }],
      taggedToday: 10, // == SOCIALS_TAG_DAILY_CAP
    });
    const preview = await svc.postOneCategory("councilor", 0, { dryRun: true });
    expect(preview?.text).not.toContain("do you know who this is?");
    expect(scoutedHandles.pickForLocation).not.toHaveBeenCalled();
  });

  it("mha seats ask with the constituency name and pick at state granularity", async () => {
    const { svc, scoutedHandles } = makeService({
      tagHandles: true,
      picked: [{ id: "h1", handle: "ada_ng" }],
      seatRow: {
        seat_code: "kano_c01",
        seat_name: "Dala Constituency",
        state_code: "kano",
        state_name: "Kano",
      },
    });
    const preview = await svc.postOneCategory("mha", 0, { dryRun: true });
    expect(preview?.text).toContain(
      "you're from Dala Constituency, do you know who this is?",
    );
    // No ward/LGA on an assembly seat — the pick falls back to state tier.
    expect(scoutedHandles.pickForLocation).toHaveBeenCalledWith(
      expect.objectContaining({ stateCode: "kano", wardCode: null }),
    );
  });

  it("clamps the pick to the remaining daily budget (cap is hard, never overshot)", async () => {
    const { svc, scoutedHandles } = makeService({
      tagHandles: true,
      picked: [{ id: "h1", handle: "ada_ng" }],
      taggedToday: 9, // cap 10, maxHandles 2 → only 1 mention allowed
    });
    await svc.postOneCategory("councilor", 0, { dryRun: true });
    expect(scoutedHandles.pickForLocation).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 1 }),
    );
  });

  it("auto-rejects a handle that trips the safety filter and tags the rest", async () => {
    const { svc, scoutedHandles } = makeService({
      tagHandles: true,
      picked: [
        { id: "bad1", handle: "Kill_Boi" },
        { id: "h2", handle: "musa_k" },
      ],
      unsafeHandles: ["Kill_Boi"],
    });
    const preview = await svc.postOneCategory("councilor", 0, { dryRun: true });
    // The offending handle never reaches the tweet AND can never wedge a
    // future one — it is knocked out of the active pool.
    expect(preview?.text).not.toContain("Kill_Boi");
    expect(preview?.text).toContain("@musa_k");
    expect(scoutedHandles.updateStatus).toHaveBeenCalledWith("bad1", "rejected");
  });

  it("park path stamps the tag cooldown for applied handles", async () => {
    const { svc, scoutedHandles, prisma } = makeService({
      tagHandles: true,
      picked: [{ id: "h1", handle: "ada_ng" }],
    });
    const preview = await svc.postOneCategory("councilor", 1, { dryRun: false });
    expect(preview?.text).toContain("@ada_ng");
    expect(prisma.socialPost.create).toHaveBeenCalled();
    // The ids ride on the draft row — the publish-time consent guard
    // validates THESE, never text inference.
    expect(prisma.socialPost.create.mock.calls[0][0].data.taggedHandleIds).toEqual([
      "h1",
    ]);
    expect(prisma.identifyCampaignTarget.create).toHaveBeenCalled();
    expect(scoutedHandles.markTagged).toHaveBeenCalledWith(["h1"]);
  });
});
