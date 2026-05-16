"use client";

import { Heart, MessageCircle, Repeat2, Quote, BadgeCheck } from "lucide-react";
import type { OriginalTweetSnapshot } from "./types";

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export interface TweetLikeData {
  authorName: string;
  authorScreenName: string;
  authorProfileImageUrl: string | null;
  text: string;
  tweetCreatedAt: string | null;
  replyCount?: number;
  retweetCount?: number;
  likeCount?: number;
  quoteCount?: number;
  verified?: boolean;
}

interface TweetCardProps {
  tweet: TweetLikeData;
  variant?: "full" | "embedded" | "draft";
  embedded?: React.ReactNode;
  className?: string;
}

/**
 * Twitter-faithful tweet card. Used three ways:
 *  - "full"     — the original tweet a draft is responding to
 *  - "embedded" — quoted tweet rendered inside a quote draft
 *  - "draft"    — our generated tweet text styled like a real post
 *
 * Renders close to twitter.com light-mode visually so reviewers see what
 * the post will look like before it ships.
 */
export function TweetCard({
  tweet,
  variant = "full",
  embedded,
  className = "",
}: TweetCardProps) {
  const isEmbedded = variant === "embedded";
  const isDraft = variant === "draft";

  return (
    <div
      className={[
        "rounded-2xl border bg-white text-[#0f1419] dark:bg-[#15202b] dark:text-white",
        isEmbedded ? "p-3" : "p-4",
        "border-[#eff3f4] dark:border-[#38444d]",
        className,
      ].join(" ")}
    >
      <div className="flex gap-3">
        <div
          className={[
            "shrink-0 rounded-full bg-[#cfd9de] dark:bg-[#38444d] overflow-hidden",
            isEmbedded ? "h-8 w-8" : "h-10 w-10",
          ].join(" ")}
        >
          {tweet.authorProfileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tweet.authorProfileImageUrl}
              alt={`${tweet.authorScreenName} avatar`}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span
              className={[
                "font-bold leading-tight truncate",
                isEmbedded ? "text-sm" : "",
              ].join(" ")}
            >
              {tweet.authorName}
            </span>
            {tweet.verified ? (
              <BadgeCheck className="h-4 w-4 text-[#1d9bf0]" />
            ) : null}
            <span className="text-[#536471] dark:text-[#71767b] text-sm truncate">
              @{tweet.authorScreenName}
            </span>
            {tweet.tweetCreatedAt ? (
              <>
                <span className="text-[#536471] dark:text-[#71767b]">·</span>
                <span className="text-[#536471] dark:text-[#71767b] text-sm">
                  {isDraft ? "now" : formatTime(tweet.tweetCreatedAt)}
                </span>
              </>
            ) : null}
          </div>
          <p
            className={[
              "mt-1 whitespace-pre-wrap break-words",
              isEmbedded ? "text-sm" : "",
            ].join(" ")}
          >
            {tweet.text}
          </p>

          {embedded ? <div className="mt-3">{embedded}</div> : null}

          {!isEmbedded && !isDraft ? (
            <div className="mt-3 flex items-center gap-6 text-[#536471] dark:text-[#71767b] text-sm">
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                {formatCount(tweet.replyCount ?? 0)}
              </span>
              <span className="flex items-center gap-1.5">
                <Repeat2 className="h-4 w-4" />
                {formatCount(tweet.retweetCount ?? 0)}
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                {formatCount(tweet.likeCount ?? 0)}
              </span>
              <span className="flex items-center gap-1.5">
                <Quote className="h-4 w-4" />
                {formatCount(tweet.quoteCount ?? 0)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** "Replying to @handle" pill above a reply draft. */
export function ReplyingToBadge({ handle }: { handle: string }) {
  return (
    <div className="text-sm text-[#536471] dark:text-[#71767b]">
      Replying to{" "}
      <span className="text-[#1d9bf0]">
        @{handle}
      </span>
    </div>
  );
}
