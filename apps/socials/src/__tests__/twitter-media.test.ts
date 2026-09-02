import { describe, it, expect, vi, beforeEach } from "vitest";

// The adapter builds a fresh TwitterApi per call from a DB-stored OAuth2 token
// (getClient → new TwitterApi(accessToken)) — there is no long-lived
// `adapter.client` to stub anymore. Mock the module so every construction
// returns our fake client, and pre-seed the cached token so getClient never
// touches XTokenRepo.
const mockUploadMedia = vi.fn();
const mockCreateMediaMetadata = vi.fn();
const mockTweet = vi.fn();
const mockClient = {
  v1: {
    uploadMedia: mockUploadMedia,
    createMediaMetadata: mockCreateMediaMetadata,
  },
  v2: {
    tweet: mockTweet,
  },
};

vi.mock("twitter-api-v2", () => ({
  // A constructor returning an object overrides `this` — every
  // `new TwitterApi(...)` in the adapter yields our fake client.
  TwitterApi: class {
    constructor() {
      return mockClient;
    }
  },
  // The adapter's 401-refresh path does `instanceof ApiResponseError`.
  ApiResponseError: class ApiResponseError extends Error {
    code?: number;
  },
}));

import { TwitterAdapter } from "../platforms/twitter/twitter.adapter.js";

function createMockAdapter(): TwitterAdapter {
  const adapter = Object.create(TwitterAdapter.prototype) as TwitterAdapter;
  (adapter as any).logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
  // Seed the token cache so getClient() skips the XTokenRepo load.
  (adapter as any).cachedAccessToken = "cached-token";
  return adapter;
}

describe("TwitterAdapter media methods", () => {
  let adapter: TwitterAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = createMockAdapter();
  });

  it("uploadMedia calls v1.uploadMedia with buffer and mimeType", async () => {
    const buffer = Buffer.from("fake-image");
    mockUploadMedia.mockResolvedValue("media_123");

    const mediaId = await adapter.uploadMedia(buffer, "image/png");
    expect(mockUploadMedia).toHaveBeenCalledWith(buffer, { mimeType: "image/png" });
    expect(mediaId).toBe("media_123");
  });

  it("uploadMedia sets alt text via createMediaMetadata", async () => {
    const buffer = Buffer.from("fake-image");
    mockUploadMedia.mockResolvedValue("media_456");

    await adapter.uploadMedia(buffer, "image/png", "Alt text for image");
    expect(mockCreateMediaMetadata).toHaveBeenCalledWith("media_456", {
      alt_text: { text: "Alt text for image" },
    });
  });

  it("postTweetWithMedia passes media_ids to v2.tweet", async () => {
    mockTweet.mockResolvedValue({ data: { id: "tweet_789", text: "hello" } });

    const result = await adapter.postTweetWithMedia("hello", ["media_123"]);
    expect(mockTweet).toHaveBeenCalledWith("hello", {
      media: { media_ids: ["media_123"] },
    });
    expect(result.id).toBe("tweet_789");
  });

  it("uploadMedia failure throws (not silently ignored)", async () => {
    mockUploadMedia.mockRejectedValue(new Error("Upload failed"));

    await expect(
      adapter.uploadMedia(Buffer.from("x"), "image/png"),
    ).rejects.toThrow("Upload failed");
  });
});
