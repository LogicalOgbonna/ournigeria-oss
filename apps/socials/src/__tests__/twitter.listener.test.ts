import { describe, it, expect, vi, beforeEach } from "vitest";
import { TwitterListener } from "../platforms/twitter/twitter.listener.js";
import type { SearchResult } from "../platforms/platform.interface.js";

// Mock TwitterAdapter
function createMockAdapter() {
  return {
    search: vi.fn<(query: string, sinceId?: string) => Promise<SearchResult>>(),
    postTweet: vi.fn(),
    postThread: vi.fn(),
    postReply: vi.fn(),
    getEngagement: vi.fn(),
    getMentions: vi.fn(),
  };
}

describe("TwitterListener", () => {
  let adapter: ReturnType<typeof createMockAdapter>;
  let listener: TwitterListener;

  beforeEach(() => {
    adapter = createMockAdapter();
    listener = new TwitterListener(adapter as any);
  });

  it("returns tweets from poll and stores sinceId for next poll", async () => {
    adapter.search.mockResolvedValue({
      tweets: [
        { id: "1", text: "EFCC charges governor" },
        { id: "2", text: "Budget allocation news" },
      ],
      newestId: "2",
      resultCount: 2,
    });

    const group = listener.getKeywordGroups()[0];
    const result = await listener.poll(group);

    expect(result.tweets).toHaveLength(2);
    expect(result.resultCount).toBe(2);
    expect(result.isTrending).toBe(false);
    expect(adapter.search).toHaveBeenCalledOnce();

    // Second poll should pass the stored sinceId
    adapter.search.mockResolvedValue({
      tweets: [],
      newestId: undefined,
      resultCount: 0,
    });
    await listener.poll(group);
    expect(adapter.search).toHaveBeenLastCalledWith(
      expect.any(String),
      "2",
    );
  });

  it("detects trending when result count exceeds 3x previous count", async () => {
    const group = listener.getKeywordGroups()[0];

    // First poll: baseline count
    adapter.search.mockResolvedValue({
      tweets: [{ id: "1", text: "test" }],
      newestId: "1",
      resultCount: 5,
    });
    const first = await listener.poll(group);
    expect(first.isTrending).toBe(false);

    // Second poll: >3x spike (16 > 5*3=15)
    adapter.search.mockResolvedValue({
      tweets: [{ id: "2", text: "trending" }],
      newestId: "2",
      resultCount: 16,
    });
    const second = await listener.poll(group);
    expect(second.isTrending).toBe(true);
  });

  it("returns empty tweets array when search yields no results", async () => {
    adapter.search.mockResolvedValue({
      tweets: [],
      newestId: undefined,
      resultCount: 0,
    });

    const result = await listener.poll();
    expect(result.tweets).toEqual([]);
    expect(result.resultCount).toBe(0);
    expect(result.isTrending).toBe(false);
  });
});
