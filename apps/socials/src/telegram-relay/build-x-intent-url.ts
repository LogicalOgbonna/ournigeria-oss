// Endpoints: x.com/intent/tweet (originals) + x.com/intent/retweet. reply/quote
// params are best-effort on mobile (may drop context) — live-verify manually.
export interface IntentDraft {
  postType: "opinion_tweet" | "thread" | "reply" | "quote" | "retweet" | string;
  content: string;
  inReplyToId?: string | null;
  quotedTweetId?: string | null;
  quotedAuthorHandle?: string | null;
}

function firstTweet(content: string, postType: string): string {
  if (postType !== "thread") return content;
  try {
    const parts = JSON.parse(content) as string[];
    return Array.isArray(parts) && parts.length ? parts[0] : content;
  } catch {
    return content;
  }
}

export function buildXIntentUrl(draft: IntentDraft): string {
  if (draft.postType === "retweet") {
    const id = draft.quotedTweetId ?? draft.inReplyToId ?? "";
    return `https://x.com/intent/retweet?tweet_id=${encodeURIComponent(id)}`;
  }
  const text = encodeURIComponent(firstTweet(draft.content, draft.postType));
  const params: string[] = [];
  if (draft.postType === "reply" && draft.inReplyToId) {
    params.push(`in_reply_to=${encodeURIComponent(draft.inReplyToId)}`);
  }
  if (draft.postType === "quote" && draft.quotedTweetId) {
    const handle = draft.quotedAuthorHandle ?? "i";
    const quotedUrl = `https://x.com/${handle}/status/${draft.quotedTweetId}`;
    params.push(`url=${encodeURIComponent(quotedUrl)}`);
  }
  params.push(`text=${text}`);
  return `https://x.com/intent/tweet?${params.join("&")}`;
}
