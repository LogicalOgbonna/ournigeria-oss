"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  SkipForward,
  AlertTriangle,
  FileEdit,
  CheckCircle2,
  Send,
  Layers,
  ExternalLink,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import { socialsFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

interface FunnelData {
  scanned: number;
  passedClassifier: number;
  drafterSkipped: number;
  drafterError: number;
  drafted: number;
  approved: number;
  published: number;
}

type StageKey =
  | "all"
  | "scanned"
  | "passedClassifier"
  | "drafterSkipped"
  | "drafterError"
  | "drafted"
  | "approved"
  | "published";

interface Stage {
  key: StageKey;
  label: string;
  sub?: string;
  icon: typeof Search;
  color: string;
  bg: string;
  countKey?: keyof FunnelData;
}

const stages: Stage[] = [
  {
    key: "all",
    label: "all",
    icon: Layers,
    color: "text-foreground",
    bg: "bg-foreground",
  },
  {
    key: "scanned",
    label: "scanned",
    sub: "discovered",
    icon: Search,
    color: "text-foreground",
    bg: "bg-foreground",
    countKey: "scanned",
  },
  {
    key: "passedClassifier",
    label: "passed classifier",
    icon: Filter,
    color: "text-blue-600",
    bg: "bg-blue-600",
    countKey: "passedClassifier",
  },
  {
    key: "drafterSkipped",
    label: "drafter skipped",
    icon: SkipForward,
    color: "text-amber-600",
    bg: "bg-amber-600",
    countKey: "drafterSkipped",
  },
  {
    key: "drafterError",
    label: "drafter error",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-600",
    countKey: "drafterError",
  },
  {
    key: "drafted",
    label: "drafted",
    sub: "ready to review",
    icon: FileEdit,
    color: "text-violet-600",
    bg: "bg-violet-600",
    countKey: "drafted",
  },
  {
    key: "approved",
    label: "approved",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-600",
    countKey: "approved",
  },
  {
    key: "published",
    label: "published",
    icon: Send,
    color: "text-emerald-700",
    bg: "bg-emerald-700",
    countKey: "published",
  },
];

interface DraftEmbed {
  id: string;
  reviewStatus: string | null;
  status: string;
  postType: string;
  content: string;
  publishedAt: string | null;
  externalId: string | null;
  agentConfidence: number | null;
  triggerTopic: string | null;
  inReplyToUser: string | null;
  inReplyToId: string | null;
  quotedTweetId: string | null;
  createdAt: string;
}

interface TweetItem {
  id: string;
  text: string;
  authorScreenName: string;
  authorName: string;
  authorBio: string;
  authorFollowers: number;
  authorProfileImageUrl: string | null;
  tweetCreatedAt: string;
  replyCount: number;
  retweetCount: number;
  likeCount: number;
  quoteCount: number;
  draftStatus: string | null;
  draftError: string | null;
  draftAttempts: number;
  classifications: {
    score: number;
    intent: string;
    reason: string;
    topic: { id: string; name: string; domain: string };
  }[];
  draft: DraftEmbed | null;
}

interface ListResp {
  items: TweetItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function tweetUrl(authorScreenName: string | null, tweetId: string) {
  // Universal URL works even without a handle; X redirects to the canonical
  // {handle}/status/{id} URL. Avoids broken links when authorScreenName is
  // empty (deleted account, missing data, etc.).
  if (!authorScreenName) return `https://x.com/i/web/status/${tweetId}`;
  return `https://x.com/${authorScreenName}/status/${tweetId}`;
}

function deriveStage(t: TweetItem): {
  label: string;
  color: string;
  bg: string;
} {
  if (t.draft?.status === "published")
    return {
      label: "published",
      color: "text-emerald-700",
      bg: "bg-emerald-100 dark:bg-emerald-950/40",
    };
  if (t.draft?.reviewStatus === "approved")
    return {
      label: "approved",
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-950/40",
    };
  if (
    t.draft &&
    (t.draft.reviewStatus === "pending" ||
      t.draft.reviewStatus === "recommended")
  )
    return {
      label: "drafted",
      color: "text-violet-600",
      bg: "bg-violet-100 dark:bg-violet-950/40",
    };
  if (t.draftStatus === "error")
    return {
      label: "drafter error",
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-950/40",
    };
  if (t.draftStatus === "skipped")
    return {
      label: "drafter skipped",
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-950/40",
    };
  return {
    label: "queued",
    color: "text-slate-600",
    bg: "bg-slate-100 dark:bg-slate-800",
  };
}

function SocialFunnelPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stage = (searchParams.get("stage") as StageKey) || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [list, setList] = useState<ListResp | null>(null);
  const [loadingFunnel, setLoadingFunnel] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reloadFunnel = useCallback(() => {
    setLoadingFunnel(true);
    socialsFetch("/v1/replies/funnel")
      .then(setFunnel)
      .catch(() => setFunnel(null))
      .finally(() => setLoadingFunnel(false));
  }, []);

  const reloadList = useCallback(() => {
    setLoadingList(true);
    socialsFetch(`/v1/replies/funnel/${stage}?page=${page}&pageSize=25`)
      .then(setList)
      .catch(() => setList(null))
      .finally(() => setLoadingList(false));
  }, [stage, page]);

  useEffect(reloadFunnel, [reloadFunnel]);
  useEffect(reloadList, [reloadList]);

  function setStage(next: StageKey) {
    const sp = new URLSearchParams();
    if (next !== "all") sp.set("stage", next);
    router.push(`/dashboard/social/funnel${sp.size ? `?${sp}` : ""}`);
  }

  function setPage(next: number) {
    const sp = new URLSearchParams(searchParams);
    sp.set("page", String(next));
    router.push(`/dashboard/social/funnel?${sp}`);
  }

  async function setDraftStatus(
    tweetId: string,
    next: "skipped" | "error" | null,
  ) {
    setBusyId(tweetId);
    try {
      await socialsFetch(`/v1/replies/funnel/discovered/${tweetId}`, {
        method: "PATCH",
        body: JSON.stringify({ draftStatus: next }),
      });
      reloadFunnel();
      reloadList();
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/social"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold">Pipeline funnel</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Counts at each stage from discovery through publish.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            reloadFunnel();
            reloadList();
          }}
          disabled={loadingFunnel || loadingList}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${loadingList ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stage summary cards */}
      {loadingFunnel && !funnel ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : funnel ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {stages
            .filter((s) => s.key !== "all")
            .map((s) => {
              const v = s.countKey ? funnel[s.countKey] : 0;
              const active = stage === s.key;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setStage(s.key)}
                  className={`text-left rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/60 ${
                    active
                      ? "border-foreground bg-muted"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                    <span className="capitalize truncate">{s.label}</span>
                  </div>
                  <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{v}</p>
                </button>
              );
            })}
        </div>
      ) : null}

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">filter:</span>
        {stages.map((s) => {
          const active = stage === s.key;
          const count = s.countKey && funnel ? funnel[s.countKey] : null;
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setStage(s.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:bg-muted/60"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="capitalize">{s.label}</span>
              {count !== null && (
                <span
                  className={`tabular-nums ${
                    active ? "opacity-80" : "text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Card feed */}
      {loadingList && !list ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : !list || list.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tweets at this stage.
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Showing {list.items.length} of {list.total}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {list.items.map((t) => (
              <TweetCard
                key={t.id}
                tweet={t}
                busy={busyId === t.id}
                onSetStatus={(s) => setDraftStatus(t.id, s)}
              />
            ))}
          </div>
        </>
      )}

      {list && list.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {list.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= list.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function TweetCard({
  tweet,
  busy,
  onSetStatus,
}: {
  tweet: TweetItem;
  busy: boolean;
  onSetStatus: (next: "skipped" | "error" | null) => void;
}) {
  const cls = tweet.classifications[0];
  const stageInfo = deriveStage(tweet);

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
        {/* Header: avatar + author + actions */}
        <div className="flex items-start gap-2">
          {tweet.authorProfileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tweet.authorProfileImageUrl}
              alt={tweet.authorScreenName}
              className="h-7 w-7 rounded-full shrink-0"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
          )}
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1 text-xs min-w-0">
              <span className="font-medium truncate">
                {tweet.authorName}
              </span>
              <span className="text-muted-foreground truncate">
                @{tweet.authorScreenName}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {tweet.authorFollowers.toLocaleString()} followers ·{" "}
              {formatDateTime(tweet.tweetCreatedAt)}
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 h-5 ${stageInfo.bg} ${stageInfo.color} border-0 shrink-0`}
          >
            {stageInfo.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                disabled={busy}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a
                  href={tweetUrl(tweet.authorScreenName, tweet.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open on X
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetStatus(null)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Re-queue for drafter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetStatus("skipped")}>
                <SkipForward className="h-4 w-4 mr-2" />
                Mark skipped
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetStatus("error")}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Mark error
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tweet body */}
        <p className="text-xs whitespace-pre-wrap line-clamp-4 leading-snug">
          {tweet.text}
        </p>

        {/* Engagement + classifier inline */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
          <span>♥ {tweet.likeCount.toLocaleString()}</span>
          <span>↻ {tweet.retweetCount.toLocaleString()}</span>
          <span>💬 {tweet.replyCount.toLocaleString()}</span>
          {cls && (
            <>
              <span className="text-border">|</span>
              <span className="truncate max-w-[120px]" title={cls.topic.name}>
                {cls.topic.name}
              </span>
              <span>{cls.score.toFixed(2)}</span>
              <span className="truncate max-w-[80px]" title={cls.intent}>
                {cls.intent}
              </span>
            </>
          )}
          {tweet.draftAttempts > 0 && (
            <span className="text-amber-600">
              {tweet.draftAttempts} attempts
            </span>
          )}
        </div>

        {tweet.draftError && (
          <p className="text-[10px] text-red-600 bg-red-50 dark:bg-red-950/30 rounded px-1.5 py-1 line-clamp-2">
            {tweet.draftError}
          </p>
        )}

        {/* Embedded draft preview */}
        {tweet.draft && (
          <div className="border-l-2 border-violet-400 pl-2 py-1 bg-muted/30 rounded-r mt-auto">
            <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-muted-foreground">
              <span className="capitalize">{tweet.draft.postType}</span>
              <span>·</span>
              <span>{tweet.draft.reviewStatus ?? "unset"}</span>
              {tweet.draft.externalId && (
                <a
                  href={`https://x.com/i/web/status/${tweet.draft.externalId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-emerald-600 hover:underline inline-flex items-center gap-0.5"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  Live
                </a>
              )}
            </div>
            <p className="text-xs whitespace-pre-wrap line-clamp-3 leading-snug">
              {tweet.draft.content}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SocialFunnelPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-muted-foreground">
        Loading funnel...
      </div>
    }>
      <SocialFunnelPageContent />
    </Suspense>
  );
}
