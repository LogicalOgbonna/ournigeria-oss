import { describe, it, expect, vi, beforeEach } from "vitest";
import { TwitterAdapter } from "../platforms/twitter/twitter.adapter.js";

// Mock twitter-api-v2
const mockUploadMedia = vi.fn();
const mockCreateMediaMetadata = vi.fn();
const mockTweet = vi.fn();

function createMockAdapter(): TwitterAdapter {
  const adapter = Object.create(TwitterAdapter.prototype);
  adapter.logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
  adapter.client = {
    v1: {
      uploadMedia: mockUploadMedia,
      createMediaMetadata: mockCreateMediaMetadata,
    },
    v2: {
      tweet: mockTweet,
    },
  };
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
