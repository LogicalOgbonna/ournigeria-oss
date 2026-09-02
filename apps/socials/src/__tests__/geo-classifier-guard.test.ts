import { describe, it, expect, vi, beforeEach } from "vitest";

const generateObject = vi.fn();
// Plain flag instead of a throwing vi.fn: vitest v4 fails a test whenever a
// mock records a thrown result, even when application code catches it.
let failWith: Error | null = null;
vi.mock("ai", () => ({
  generateObject: (...a: unknown[]) => {
    if (failWith) throw failWith;
    return generateObject(...a);
  },
}));

import { GeoClassifierService } from "../platforms/twitter/scout/geo-classifier.service.js";

const config = {
  get: (k: string) =>
    ({
      DEEPSEEK_API_KEY: "sk-test",
      SOCIALS_CLASSIFIER_MODEL: "deepseek-chat",
      SOCIALS_CLASSIFIER_TEMPERATURE: 0.2,
    })[k],
} as any;

const CANDIDATE = {
  name: "Ada",
  handle: "ada_ng",
  bio: "somewhere",
  location: "",
  followers: 10,
  tweetText: "hi",
};

describe("GeoClassifierService slug hallucination guard", () => {
  beforeEach(() => {
    generateObject.mockReset();
    failWith = null;
  });

  it("nulls a state slug the model invented (not in nigerian_states)", async () => {
    generateObject.mockResolvedValue({
      object: {
        isNigerian: true,
        stateSlug: "GM", // hallucinated — the enrichment-agent incident class
        lgaName: null,
        wardName: null,
        confidence: 0.9,
        evidence: "made up",
      },
    });
    const svc = new GeoClassifierService(config);
    const out = await svc.classify(CANDIDATE, ["kano", "lagos"], {
      slug: "kano",
      name: "Kano",
    });
    expect(out).not.toBeNull();
    expect(out!.stateSlug).toBeNull();
    expect(out!.confidence).toBe(0);
  });

  it("passes through a valid slug untouched", async () => {
    generateObject.mockResolvedValue({
      object: {
        isNigerian: true,
        stateSlug: "kano",
        lgaName: "Dala",
        wardName: null,
        confidence: 0.8,
        evidence: "bio",
      },
    });
    const svc = new GeoClassifierService(config);
    const out = await svc.classify(CANDIDATE, ["kano", "lagos"], {
      slug: "kano",
      name: "Kano",
    });
    expect(out!.stateSlug).toBe("kano");
    expect(out!.confidence).toBe(0.8);
  });

  it("returns null (author skipped) when the model call fails", async () => {
    failWith = new Error("timeout");
    const svc = new GeoClassifierService(config);
    const out = await svc.classify(CANDIDATE, ["kano"], {
      slug: "kano",
      name: "Kano",
    });
    expect(out).toBeNull();
  });
});
