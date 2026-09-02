"use client";

import { FileText, MessageCircle, MessagesSquare, Sparkles } from "lucide-react";
import { QueueTile } from "@/components/dashboard/overview/queue-tile";
import { SessionsPanel, type SessionsCounts } from "@/components/dashboard/overview/sessions-panel";
import { adminFetch, proposalsFetch, socialsFetch } from "@/lib/api";
import { enrichmentFetch } from "@/app/dashboard/enrichment/lib";
import { useResource } from "@/lib/hooks/use-resource";
import { usePermissions } from "@/lib/permissions";

interface ProposalStats {
  total: number;
  pending: number;
}
interface EnrichmentStats {
  total: number;
  open: number;
  pending: number;
  needsHuman: number;
  needsMoreSources: number;
}
interface FeedbackStats {
  total: number;
  new: number;
}
interface ReplyStats {
  pending: number;
  publishedToday: number;
}
interface SessionsResponse {
  counts: SessionsCounts;
}

export default function OverviewPage() {
  // Tiles are permission-gated: a scoped role must not land on a wall of 403
  // error tiles for queues it can't touch. Fetchers stay dormant until the
  // permission is confirmed held.
  const { can, loading: permsLoading } = usePermissions();
  const canProposals = can("proposals.review");
  const canEnrichment = can("enrichment.review");
  const canFeedback = can("feedback.read");
  const canReplies = can("socials.review");
  const canSessions = can("socials.sessions");

  const proposals = useResource<ProposalStats | null>(
    () => (canProposals ? proposalsFetch("/admin/stats") : Promise.resolve(null)),
    [canProposals],
  );
  const enrichment = useResource<EnrichmentStats | null>(
    () => (canEnrichment ? enrichmentFetch("/proposals/stats") : Promise.resolve(null)),
    [canEnrichment],
  );
  const feedback = useResource<FeedbackStats | null>(
    () => (canFeedback ? adminFetch("/feedback/stats") : Promise.resolve(null)),
    [canFeedback],
  );
  const replies = useResource<ReplyStats | null>(
    () => (canReplies ? socialsFetch("/v1/replies/stats") : Promise.resolve(null)),
    [canReplies],
  );
  const sessions = useResource<SessionsResponse | null>(
    () => (canSessions ? socialsFetch("/v1/sessions") : Promise.resolve(null)),
    [canSessions],
  );

  const sc = sessions.data?.counts;
  const sessionsTotal = sc ? sc.idle + sc.working + sc.auth_failed : 0;
  const anyTile = canProposals || canEnrichment || canFeedback || canReplies;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your review queues</p>
      </div>

      {!permsLoading && !anyTile && (
        <p className="text-sm text-muted-foreground">
          No review queues for your current roles. Use the sidebar for the
          sections you have access to.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canProposals && (
        <QueueTile
          label="Proposals"
          icon={FileText}
          accent="green"
          href="/dashboard/proposals"
          cta="Review queue"
          hero={proposals.data?.pending ?? 0}
          heroSuffix="pending"
          meta={<span className="font-mono tabular-nums">{(proposals.data?.total ?? 0).toLocaleString()} all-time</span>}
          loading={proposals.loading}
          error={proposals.error}
        />
        )}

        {canEnrichment && (
        <QueueTile
          label="Enrichments"
          icon={Sparkles}
          accent="orange"
          href="/dashboard/enrichment"
          cta="Review queue"
          hero={enrichment.data?.open ?? 0}
          heroSuffix="open"
          meta={
            <span className="font-mono tabular-nums">
              {enrichment.data?.pending ?? 0} pending
              {" · "}
              <span className="font-semibold text-foreground">
                {enrichment.data?.needsHuman ?? 0} human
              </span>
              {" · "}
              {enrichment.data?.needsMoreSources ?? 0} sources
            </span>
          }
          loading={enrichment.loading}
          error={enrichment.error}
        />
        )}

        {canFeedback && (
        <QueueTile
          label="Feedback"
          icon={MessageCircle}
          accent="green"
          href="/dashboard/feedback"
          cta="Triage"
          hero={feedback.data?.new ?? 0}
          heroSuffix="new"
          meta={<span className="font-mono tabular-nums">{(feedback.data?.total ?? 0).toLocaleString()} all-time</span>}
          loading={feedback.loading}
          error={feedback.error}
        />
        )}

        {canReplies && (
        <QueueTile
          label="Queued replies"
          icon={MessagesSquare}
          accent="orange"
          href="/dashboard/social"
          cta="Approve"
          hero={replies.data?.pending ?? 0}
          heroSuffix="to approve"
          meta={<span className="font-mono tabular-nums">{replies.data?.publishedToday ?? 0} posted today</span>}
          loading={replies.loading}
          error={replies.error}
        />
        )}
      </div>

      {canSessions && (
        <SessionsPanel
          counts={sc}
          total={sessionsTotal}
          loading={sessions.loading}
          error={sessions.error}
        />
      )}
    </div>
  );
}
