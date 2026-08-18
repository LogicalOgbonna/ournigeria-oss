export interface ReconcileDraft {
  content: string;
  postType: string;
  inReplyToId: string | null;
  quotedTweetId: string | null;
  dispatchedAt: Date;
}
export interface Candidate {
  id: string;
  text: string;
  createdAt: Date;
  inReplyToId: string | null;
  isQuote: boolean;
}

export function normalizeTweetText(s: string): string {
  return s
    .normalize("NFC")
    .replace(/https?:\/\/t\.co\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Dice coefficient on bigrams — cheap, dependency-free (0..1).
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const bigrams = (x: string) => {
    const g = new Map<string, number>();
    for (let i = 0; i < x.length - 1; i++) {
      const k = x.slice(i, i + 2);
      g.set(k, (g.get(k) ?? 0) + 1);
    }
    return g;
  };
  const A = bigrams(a), B = bigrams(b);
  let inter = 0;
  for (const [k, n] of A) inter += Math.min(n, B.get(k) ?? 0);
  const total = (a.length - 1) + (b.length - 1);
  return total <= 0 ? 0 : (2 * inter) / total;
}

const SIM_THRESHOLD = 0.72;

export function matchTweet(draft: ReconcileDraft, candidates: Candidate[]): Candidate | null {
  const want = normalizeTweetText(firstTweetText(draft));
  const eligible = candidates.filter((cand) => {
    if (cand.createdAt < draft.dispatchedAt) return false;
    if (draft.postType === "reply" && draft.inReplyToId) {
      return cand.inReplyToId === draft.inReplyToId;
    }
    if (draft.postType === "quote" && draft.quotedTweetId) {
      return cand.isQuote;
    }
    return true;
  });

  const scored = eligible
    .map((cand) => ({ cand, score: similarity(want, normalizeTweetText(cand.text)) }))
    .filter((x) => x.score >= SIM_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;
  // No-guess on tie: if the top two are within 0.02, we can't safely disambiguate.
  if (scored.length > 1 && scored[0].score - scored[1].score < 0.02) return null;
  return scored[0].cand;
}

function firstTweetText(draft: ReconcileDraft): string {
  if (draft.postType !== "thread") return draft.content;
  try {
    const parts = JSON.parse(draft.content) as string[];
    return Array.isArray(parts) && parts.length ? parts[0] : draft.content;
  } catch {
    return draft.content;
  }
}
