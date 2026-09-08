"use client";

import { AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusChip } from "@/components/campaigns/status-chip";
import { ReviewTimeline } from "@/components/campaigns/review-timeline";
import { VerbButtons } from "@/components/campaigns/verb-buttons";
import { formatDateTimeFull, relativeTime, shortId } from "@/lib/format";
import type { CampaignDetail } from "@/lib/campaigns";

/**
 * Where the ticket stands with a reviewer, and how it got there. The verb bar
 * is repeated here so a reviewer working the queue never has to scroll back up
 * after reading the trail.
 */
export function ReviewTab({
  campaign,
  onChanged,
  onDeleted,
}: {
  campaign: CampaignDetail;
  onChanged: () => void;
  onDeleted?: () => void;
}) {
  const disputed = campaign.reviewStatus === "disputed";
  const awaiting = Boolean(campaign.reviewRequestedAt);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Review state
            <StatusChip {...campaign} />
          </CardTitle>
          <CardDescription>
            A ticket is public only while it is active or concluded, reviewed,
            and above low confidence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[160px_1fr]">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-mono text-xs">{campaign.status}</dd>

            <dt className="text-muted-foreground">Review status</dt>
            <dd className="font-mono text-xs">{campaign.reviewStatus}</dd>

            <dt className="text-muted-foreground">Confidence</dt>
            <dd className="font-mono text-xs">{campaign.confidence}</dd>

            <dt className="text-muted-foreground">Last reviewed by</dt>
            <dd title={campaign.reviewedBy ?? undefined} className="font-mono text-xs">
              {shortId(campaign.reviewedBy)}
            </dd>
          </dl>

          {awaiting ? (
            <p className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              Sent for review{" "}
              <time
                dateTime={campaign.reviewRequestedAt ?? undefined}
                title={formatDateTimeFull(campaign.reviewRequestedAt)}
              >
                {relativeTime(campaign.reviewRequestedAt)}
              </time>{" "}
              by{" "}
              <span
                className="font-mono text-xs"
                title={campaign.reviewRequestedBy ?? undefined}
              >
                {shortId(campaign.reviewRequestedBy)}
              </span>
            </p>
          ) : (
            <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Nothing is waiting on a reviewer.
            </p>
          )}

          {disputed && campaign.reviewNote ? (
            <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Changes requested</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {campaign.reviewNote}
                </p>
              </div>
            </div>
          ) : null}

          <VerbButtons
            campaign={campaign}
            onDone={onChanged}
            onDeleted={onDeleted}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>
            The last 20 audit events for this ticket and its artwork, documents
            and council — newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewTimeline events={campaign.audit} onReverted={onChanged} />
        </CardContent>
      </Card>
    </div>
  );
}
