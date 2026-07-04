"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  X,
  Pencil,
  ExternalLink,
  AlertTriangle,
  Send,
  Repeat2,
  CheckCheck,
} from "lucide-react";
import { socialsFetch } from "@/lib/api";
import { TweetCard, ReplyingToBadge } from "./tweet-card";
import type { DraftRow } from "./types";

const OUR_BRAND = {
  authorName: "OurNigeria",
  authorScreenName: "awanigeria",
  authorProfileImageUrl: null as string | null,
  verified: false,
};

/**
 * X-weighted character count — ₦ and other symbols count as 2 on X, so
 * `string.length` undercounts. Mirror X's weighting so the counter matches
 * what X actually enforces.
 */
function xWeightedLength(s: string): number {
  let weight = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    const lightweight =
      (cp >= 0x0000 && cp <= 0x10ff) ||
      (cp >= 0x2000 && cp <= 0x200d) ||
      (cp >= 0x2010 && cp <= 0x201f) ||
      (cp >= 0x2032 && cp <= 0x2037);
    weight += lightweight ? 1 : 2;
  }
  return weight;
}

interface DraftCardProps {
  draft: DraftRow;
  onChanged: () => void;
}

export function DraftCard({ draft, onChanged }: DraftCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(draft.content);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function errMsg(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }

  const original = draft.originalTweetSnapshot;
  const isIdentify =
    draft.postType === "identify_seat" || draft.postType === "proposal_verify";
  const isQuote = draft.postType === "quote";
  const targetTweetId = draft.inReplyToId ?? draft.quotedTweetId;
  const tweetUrl = targetTweetId
    ? draft.inReplyToUser
      ? `https://x.com/${draft.inReplyToUser}/status/${targetTweetId}`
      : `https://x.com/i/web/status/${targetTweetId}`
    : null;

  // X Web Intent URLs — open x.com's composer pre-filled so a human posts from
  // their own logged-in session (bypasses the API, which is reply-restricted on
  // the bot account). Reply uses `in_reply_to`; quote drops the target URL into
  // the text so X renders the embed; repost opens the retweet confirm dialog.
  const intentText = encodeURIComponent(draft.content);
  const intentUrl =
    targetTweetId == null
      ? null
      : isQuote && tweetUrl
        ? `https://x.com/intent/tweet?text=${intentText}&url=${encodeURIComponent(tweetUrl)}`
        : `https://x.com/intent/tweet?in_reply_to=${targetTweetId}&text=${intentText}`;
  const repostUrl = targetTweetId
    ? `https://x.com/intent/retweet?tweet_id=${targetTweetId}`
    : null;

  async function markPosted() {
    setBusy("mark-posted");
    setError(null);
    try {
      await socialsFetch(`/v1/replies/${draft.id}/mark-posted`, {
        method: "POST",
      });
      onChanged();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    setBusy("approve");
    setError(null);
    try {
      await socialsFetch(`/v1/replies/${draft.id}/approve`, { method: "POST" });
      onChanged();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    setBusy("reject");
    setError(null);
    try {
      await socialsFetch(`/v1/replies/${draft.id}/reject`, { method: "POST" });
      onChanged();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit() {
    setBusy("edit");
    setError(null);
    try {
      await socialsFetch(`/v1/replies/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify({ content: draftText }),
      });
      setEditing(false);
      onChanged();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  const draftTweetData = {
    ...OUR_BRAND,
    text: editing ? draftText : draft.content,
    tweetCreatedAt: null,
    likeCount: 0,
    replyCount: 0,
    retweetCount: 0,
    quoteCount: 0,
  };

  // X-weighted count (₦ counts as 2). 280 is a soft guideline — the bot runs on
  // an X Premium account with a higher cap, so this warns but no longer blocks
  // saving; the publish path surfaces X's real limit if exceeded.
  const charCount = xWeightedLength(editing ? draftText : draft.content);
  const overLimit = charCount > 280;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Meta row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="capitalize">
              {draft.postType}
            </Badge>
            {draft.source && draft.source !== "roam" ? (
              <Badge
                variant="default"
                title={
                  draft.source === "mention"
                    ? "Someone mentioned the account"
                    : "A reply under one of our own posts"
                }
              >
                {draft.source === "mention" ? "mention" : "reply to us"}
              </Badge>
            ) : null}
            {draft.reviewStatus ? (
              <Badge variant="outline" className="capitalize">
                {draft.reviewStatus}
              </Badge>
            ) : null}
            {draft.dataDomain ? (
              <Badge variant="secondary">{draft.dataDomain}</Badge>
            ) : null}
            {draft.triggerTopic ? (
              <span className="text-xs text-muted-foreground">
                via {draft.triggerTopic}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {new Date(draft.createdAt).toLocaleString()}
            </span>
            {tweetUrl ? (
              <a
                href={tweetUrl}
                target="_blank"
                rel="noreferrer"
                title="Open original tweet on X"
                aria-label="Open original tweet on X"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>

        {/* Preview */}
        {isIdentify ? (
          <div className="rounded-lg border p-4 whitespace-pre-wrap break-words text-sm">
            {editing ? draftText : draft.content}
          </div>
        ) : isQuote ? (
          <TweetCard
            tweet={draftTweetData}
            variant="draft"
            embedded={
              original ? (
                <TweetCard tweet={original} variant="embedded" />
              ) : null
            }
          />
        ) : (
          <div className="space-y-3">
            {original ? <TweetCard tweet={original} variant="full" /> : null}
            <ReplyingToBadge
              handle={original?.authorScreenName ?? draft.inReplyToUser ?? ""}
            />
            <TweetCard tweet={draftTweetData} variant="draft" />
          </div>
        )}

        {/* Edit textarea */}
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={4}
              className={overLimit ? "border-red-500" : ""}
            />
            <div
              className={`text-xs ${
                overLimit
                  ? "text-red-600"
                  : charCount > 260
                    ? "text-amber-600"
                    : "text-muted-foreground"
              }`}
            >
              {charCount} / 280
            </div>
          </div>
        ) : null}

        {/* Sidecar: agent + classifier + safety */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border p-3 space-y-1">
            <div className="text-muted-foreground">Agent</div>
            <div className="font-medium">
              confidence{" "}
              {draft.agentConfidence != null
                ? Math.round(draft.agentConfidence * 100) + "%"
                : "—"}
            </div>
            {draft.agentReasoning ? (
              <p className="text-[11px] text-muted-foreground line-clamp-3">
                {draft.agentReasoning}
              </p>
            ) : null}
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <div className="text-muted-foreground">Classifier</div>
            <div className="font-medium">
              score{" "}
              {draft.classifierScore != null
                ? draft.classifierScore.toFixed(2)
                : "—"}
            </div>
            {draft.classifierIntent ? (
              <p className="text-[11px] text-muted-foreground capitalize">
                intent: {draft.classifierIntent}
              </p>
            ) : null}
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <div className="text-muted-foreground">Safety</div>
            {draft.safetyWarnings && draft.safetyWarnings.length > 0 ? (
              <div className="space-y-1">
                <div className="font-medium text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {draft.safetyWarnings.length} warning(s)
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-0.5">
                  {draft.safetyWarnings.slice(0, 3).map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-emerald-600 font-medium">All checks pass</div>
            )}
          </div>
        </div>

        {/* Actions */}
        {draft.reviewStatus === "pending" ||
        draft.reviewStatus === "recommended" ||
        draft.reviewStatus === "edited" ? (
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {!editing && !isIdentify && intentUrl && (
              <Button
                asChild
                size="sm"
                className="bg-sky-600 hover:bg-sky-700 text-white"
                title="Open X with this reply pre-filled — post from your own logged-in account"
              >
                <a href={intentUrl} target="_blank" rel="noreferrer">
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Post on X
                </a>
              </Button>
            )}
            {!editing && !isIdentify && repostUrl && (
              <Button
                asChild
                size="sm"
                variant="outline"
                title="Open X to repost the original tweet"
              >
                <a href={repostUrl} target="_blank" rel="noreferrer">
                  <Repeat2 className="h-3.5 w-3.5 mr-1" />
                  Repost on X
                </a>
              </Button>
            )}
            {!editing && !isIdentify && (
              <Button
                size="sm"
                variant="outline"
                onClick={markPosted}
                disabled={!!busy}
                title="Mark this draft as posted (after you've posted it manually on X)"
                className="text-emerald-700 hover:text-emerald-800"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark posted
              </Button>
            )}
            {!editing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={approve}
                disabled={!!busy}
                title="Publish via the X API (may fail if the bot account is reply-restricted)"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Approve & Publish
              </Button>
            )}
            {editing ? (
              <>
                <Button size="sm" onClick={saveEdit} disabled={!!busy}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setDraftText(draft.content);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
                disabled={!!busy}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={reject}
              disabled={!!busy}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reject
            </Button>
            {tweetUrl ? (
              <a
                href={tweetUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1 hover:underline"
              >
                Open original on X <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        ) : null}

        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
