import { describe, it, expect, vi, beforeEach } from "vitest";
import { TwitterPublisher } from "../platforms/twitter/twitter.publisher.js";

function createMockAdapter() {
  return {
    postTweet: vi.fn(),
    postThread: vi.fn(),
    postReply: vi.fn(),
    uploadMedia: vi.fn(),
    postTweetWithMedia: vi.fn(),
  };
}

describe("TwitterPublisher.publishWithImage", () => {
  let adapter: ReturnType<typeof createMockAdapter>;
  let publisher: TwitterPublisher;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = createMockAdapter();
    publisher = new TwitterPublisher(adapter as any);
  });

  it("success → uploads media and posts tweet with media_id", async () => {
    adapter.uploadMedia.mockResolvedValue("media_123");
    adapter.postTweetWithMedia.mockResolvedValue({ id: "tweet_1", text: "caption" });

    const result = await publisher.publishWithImage(
      "caption text",
      Buffer.from("png-data"),
      "Alt text",
    );

    expect(adapter.uploadMedia).toHaveBeenCalledWith(Buffer.from("png-data"), "image/png", "Alt text");
    expect(adapter.postTweetWithMedia).toHaveBeenCalledWith("caption text", ["media_123"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tweet_1");
  });

  it("media upload fails → falls back to text-only tweet", async () => {
    adapter.uploadMedia.mockRejectedValue(new Error("Upload failed"));
    adapter.postTweet.mockResolvedValue({ id: "tweet_2", text: "caption" });

    const result = await publisher.publishWithImage(
      "caption text",
      Buffer.from("png-data"),
      "Alt text",
    );

    expect(adapter.postTweet).toHaveBeenCalledWith("caption text");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("tweet_2");
  });
});
