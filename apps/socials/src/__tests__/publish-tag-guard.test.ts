import { describe, it, expect, vi } from "vitest";
import {
  appendTags,
  parseTagLine,
  rebuildTagLine,
} from "../campaign/tag-line.js";
import { ReplyQueueService } from "../reply-queue/reply-queue.service.js";

const QUESTION_DRAFT =
  "Who chairs Dala LGA? Add the name: https://ournigeria.ng/proposals/new?x=1\n\n@ada_ng @musa_k — you're from Dala, do you know who this is?";
const LEGACY_CC_DRAFT = "Who chairs Dala LGA?\n\ncc @ada_ng @musa_k";

describe("parseTagLine / rebuildTagLine", () => {
  it("round-trips the directed-question line", () => {
    const parsed = parseTagLine(QUESTION_DRAFT)!;
    expect(parsed.handles).toEqual(["ada_ng", "musa_k"]);
    expect(parsed.lead).toBe("");
    expect(parsed.tail).toContain("do you know who this is?");
    expect(rebuildTagLine(parsed, parsed.handles)).toBe(QUESTION_DRAFT);
  });

  it("round-trips the legacy cc line", () => {
    const parsed = parseTagLine(LEGACY_CC_DRAFT)!;
    expect(parsed.handles).toEqual(["ada_ng", "musa_k"]);
    expect(parsed.lead).toBe("cc");
    expect(rebuildTagLine(parsed, ["musa_k"])).toBe(
      "Who chairs Dala LGA?\n\ncc @musa_k",
    );
  });

  it("drops the whole line when no handles survive", () => {
    const parsed = parseTagLine(QUESTION_DRAFT)!;
    expect(rebuildTagLine(parsed, [])).toBe(
      "Who chairs Dala LGA? Add the name: https://ournigeria.ng/proposals/new?x=1",
    );
  });

  it("returns null for untagged campaign text", () => {
    expect(
      parseTagLine("Nobody's on record.\n\nOpen the link: https://x.test/a"),
    ).toBeNull();
  });

  it("parses what appendTags produces (generator/parser stay in sync)", () => {
    const { text } = appendTags("Body line.", ["ada_ng"], {
      lead: "",
      tail: " — you're from Kano, do you know who this is?",
    });
    const parsed = parseTagLine(text)!;
    expect(parsed.handles).toEqual(["ada_ng"]);
    expect(parsed.body).toBe("Body line.");
  });
});

interface Row {
  id: string;
  handle: string;
  status: string;
}

function makeService(opts: {
  rows: Row[];
  taggedHandleIds?: string[];
  taggedToday?: number;
  content?: string;
}) {
  const post = {
    id: "p1",
    postType: "identify_seat",
    content: opts.content ?? QUESTION_DRAFT,
    taggedHandleIds: opts.taggedHandleIds ?? opts.rows.map((r) => r.id),
    quotedTweetId: null,
    inReplyToId: null,
  };
  const prisma = {
    socialPost: {
      findUnique: vi.fn().mockResolvedValue(post),
      update: vi.fn().mockImplementation(async (args) => ({ ...post, ...args.data })),
    },
    identifyCampaignTarget: { updateMany: vi.fn().mockResolvedValue({}) },
  } as any;
  const publisher = {
    publishOriginal: vi.fn().mockResolvedValue([{ id: "tweet1" }]),
  } as any;
  const scoutedHandles = {
    findByIds: vi
      .fn()
      .mockImplementation(async (ids: string[]) =>
        opts.rows.filter((r) => ids.includes(r.id)),
      ),
    taggedInLastDay: vi.fn().mockResolvedValue(opts.taggedToday ?? 0),
    markTagged: vi.fn().mockResolvedValue(undefined),
  } as any;
  const config = { get: () => 10 } as any;
  const svc = new ReplyQueueService(prisma, publisher, scoutedHandles, config);
  return { svc, prisma, publisher, scoutedHandles };
}

describe("approve() publish-time tag guard (identify_seat, id-based)", () => {
  it("strips a mention whose consent changed after drafting, publishes the rest", async () => {
    const { svc, publisher, scoutedHandles } = makeService({
      rows: [
        { id: "h1", handle: "ada_ng", status: "opted_out" },
        { id: "h2", handle: "musa_k", status: "active" },
      ],
    });
    await svc.approve("p1", "admin1");
    const published = publisher.publishOriginal.mock.calls[0][0];
    expect(published).not.toContain("@ada_ng");
    expect(published).toContain("@musa_k — you're from Dala");
    // Cooldown re-stamped only for what actually went out.
    expect(scoutedHandles.markTagged).toHaveBeenCalledWith(["h2"]);
    // Budget count excludes the draft's OWN stamped handles (double-count
    // would let a full drafting day strip every same-day approval).
    expect(scoutedHandles.taggedInLastDay).toHaveBeenCalledWith(["h1", "h2"]);
  });

  it("drops the whole question line when every tracked mention is revoked", async () => {
    const { svc, publisher, scoutedHandles } = makeService({
      rows: [
        { id: "h1", handle: "ada_ng", status: "rejected" },
        { id: "h2", handle: "musa_k", status: "opted_out" },
      ],
    });
    await svc.approve("p1", "admin1");
    const published = publisher.publishOriginal.mock.calls[0][0];
    expect(published).not.toContain("do you know who this is?");
    expect(published).toContain("Who chairs Dala LGA?");
    expect(scoutedHandles.markTagged).toHaveBeenCalledWith([]);
  });

  it("never strips an operator-authored mention (not in the persisted ids)", async () => {
    // Only musa_k is tracked; @ada_ng on the line was written by a human.
    const { svc, publisher } = makeService({
      rows: [{ id: "h2", handle: "musa_k", status: "opted_out" }],
      taggedHandleIds: ["h2"],
    });
    await svc.approve("p1", "admin1");
    const published = publisher.publishOriginal.mock.calls[0][0];
    expect(published).toContain("@ada_ng"); // human's mention survives
    expect(published).not.toContain("@musa_k"); // revoked tracked mention goes
  });

  it("clamps a batch approval to the trailing-24h mention budget", async () => {
    const { svc, publisher } = makeService({
      rows: [
        { id: "h1", handle: "ada_ng", status: "active" },
        { id: "h2", handle: "musa_k", status: "active" },
      ],
      taggedToday: 9, // cap 10 → only 1 tracked mention may still publish
    });
    await svc.approve("p1", "admin1");
    const published = publisher.publishOriginal.mock.calls[0][0];
    expect(published).toContain("@ada_ng");
    expect(published).not.toContain("@musa_k");
  });

  it("blocks (422) instead of silently editing a rewritten draft with a revoked mention", async () => {
    const { svc, publisher } = makeService({
      rows: [{ id: "h1", handle: "ada_ng", status: "opted_out" }],
      // Operator rewrote the draft — no recognizable tag line, but the
      // revoked @mention may still be in there somewhere.
      content: "Totally rewritten by the operator. @ada_ng knows this one.",
    });
    await expect(svc.approve("p1", "admin1")).rejects.toThrow(
      /consent status changed/,
    );
    expect(publisher.publishOriginal).not.toHaveBeenCalled();
  });

  it("publishes a rewritten draft untouched when all tracked mentions are still active", async () => {
    const content = "Totally rewritten. @ada_ng please weigh in!";
    const { svc, publisher } = makeService({
      rows: [{ id: "h1", handle: "ada_ng", status: "active" }],
      content,
    });
    await svc.approve("p1", "admin1");
    expect(publisher.publishOriginal.mock.calls[0][0]).toBe(content);
  });

  it("skips the guard entirely for drafts with no tracked ids (legacy/untagged)", async () => {
    const { svc, publisher, scoutedHandles } = makeService({
      rows: [],
      taggedHandleIds: [],
    });
    await svc.approve("p1", "admin1");
    expect(publisher.publishOriginal.mock.calls[0][0]).toBe(QUESTION_DRAFT);
    expect(scoutedHandles.findByIds).not.toHaveBeenCalled();
  });

  it("persists the guarded content, not the drafted content", async () => {
    const { svc, prisma } = makeService({
      rows: [
        { id: "h1", handle: "ada_ng", status: "rejected" },
        { id: "h2", handle: "musa_k", status: "active" },
      ],
    });
    await svc.approve("p1", "admin1");
    const saved = prisma.socialPost.update.mock.calls[0][0].data.content;
    expect(saved).not.toContain("@ada_ng");
    expect(saved).toContain("@musa_k");
  });
});
