"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Forbidden } from "@/components/layout/forbidden";
import {
  TicketTable,
  type TicketColumn,
} from "@/components/campaigns/ticket-table";
import { campaignsApi } from "@/lib/campaigns";
import { formatDateTimeFull, relativeTime } from "@/lib/format";
import { useResource } from "@/lib/hooks/use-resource";
import { usePermissions } from "@/lib/permissions";

const QUEUE_COLUMNS: TicketColumn[] = [
  {
    key: "waiting",
    header: "Waiting since",
    className: "align-top text-sm text-muted-foreground",
    // The row-link overlay sits on top of this cell, so a `title` tooltip would
    // never fire on hover — the exact timestamp is printed instead.
    render: (row) =>
      row.reviewRequestedAt ? (
        <time dateTime={row.reviewRequestedAt}>
          {relativeTime(row.reviewRequestedAt)}
          <span className="block text-xs text-muted-foreground/80">
            {formatDateTimeFull(row.reviewRequestedAt)}
          </span>
        </time>
      ) : (
        "-"
      ),
  },
];

/**
 * Everything waiting on a reviewer, oldest request first (the API orders by
 * reviewRequestedAt asc). No filters and no poster column on purpose: this is a
 * worklist, and `queue()` does not return media.
 */
export default function ReviewQueuePage() {
  const { loading: permsLoading, can } = usePermissions();
  const canReview = can("campaigns.review");
  const denied = !permsLoading && !canReview;

  const { data, loading, error, refetch } = useResource(
    () => campaignsApi.queue(),
    [],
    // Nothing is requested until the RBAC answer is in.
    { enabled: !permsLoading && canReview },
  );

  if (denied) return <Forbidden permission="campaigns.review" />;

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/campaigns"
          aria-label="Back to election tickets"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold">Review Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading
              ? "Loading…"
              : `${rows.length} ticket${rows.length === 1 ? "" : "s"} waiting`}
            {" · oldest request first"}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-border p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : (
        <TicketTable
          rows={rows}
          loading={loading}
          renderUnderName={(row) =>
            // Only "request changes" writes a note, and it is the one thing a
            // reviewer needs to see without opening the ticket.
            row.reviewStatus === "disputed" && row.reviewNote ? (
              <p className="mt-1 max-w-[280px] text-xs text-amber-700 dark:text-amber-400">
                {row.reviewNote}
              </p>
            ) : null
          }
          extraColumns={QUEUE_COLUMNS}
          emptyState="Nothing waiting for review."
        />
      )}
    </div>
  );
}
