"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/campaigns/status-chip";
import { ELECTION_TYPE_LABEL, type CampaignRow } from "@/lib/campaigns";
import { TONE_CLASS } from "@/lib/tone";

/** One caller-supplied column, appended after the built-in ones. */
export interface TicketColumn {
  key: string;
  header: string;
  /** Applied to both the <th> and the <td> so the column stays aligned. */
  className?: string;
  render: (row: CampaignRow) => ReactNode;
}

export interface TicketTableProps {
  rows: CampaignRow[];
  /** Poster thumbnail column — `list()` returns `media`, `queue()` does not. */
  showThumb?: boolean;
  extraColumns?: TicketColumn[];
  /** Extra line under the candidate/running-mate names (queue: the review note). */
  renderUnderName?: (row: CampaignRow) => ReactNode;
  /** Shown in place of rows when `rows` is empty; omit to render nothing. */
  emptyState?: ReactNode;
  /**
   * Renders placeholder rows instead of `rows`. The skeleton lives here rather
   * than beside each page so its column count is the component's own — it
   * cannot drift from the header the way a hand-passed `columns={6}` did.
   */
  loading?: boolean;
  skeletonRows?: number;
}

/**
 * The seat a ticket is scoped to. Exactly one of the three columns is set
 * (raceScopeFor in the API rejects a second), and presidential sets none.
 */
function scopeCode(row: CampaignRow): string | null {
  return row.stateCode ?? row.constituencyCode ?? row.lgaCode ?? null;
}

const CONFIDENCE_TONE = {
  high: TONE_CLASS.success,
  medium: TONE_CLASS.neutral,
  low: TONE_CLASS.warning,
} as const;

/** Candidate, Party, Race, Status, Confidence — the columns that are always drawn. */
const FIXED_COLUMNS = 5;

/**
 * The ticket list shared by /dashboard/campaigns and its review queue. The row
 * is one big link: the candidate cell holds the only anchor (so it is reachable
 * and announced by a keyboard/screen reader) and stretches over the row with an
 * ::after overlay — nothing else in a row is interactive, so the overlay costs
 * nothing and avoids nesting anchors inside a <tr>.
 */
export function TicketTable({
  rows,
  showThumb = false,
  extraColumns = [],
  renderUnderName,
  emptyState,
  loading = false,
  skeletonRows = 6,
}: TicketTableProps) {
  // One count for the empty-state colSpan AND the skeleton cells.
  const columnCount = (showThumb ? 1 : 0) + FIXED_COLUMNS + extraColumns.length;
  return (
    <div className="rounded-lg border border-border" aria-busy={loading}>
      <Table>
        <TableHeader>
          <TableRow>
            {showThumb && <TableHead className="w-[64px]">Poster</TableHead>}
            <TableHead>Candidate</TableHead>
            <TableHead className="w-[90px]">Party</TableHead>
            <TableHead>Race</TableHead>
            <TableHead className="w-[150px]">Status</TableHead>
            <TableHead className="w-[100px]">Confidence</TableHead>
            {extraColumns.map((c) => (
              <TableHead key={c.key} className={c.className}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={`skeleton-${i}`} aria-hidden="true">
                {Array.from({ length: columnCount }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const scope = scopeCode(row);
              const acronym = row.party?.acronym ?? row.partyAcronym;
              const thumb = row.media?.[0]?.url ?? null;
              return (
                <TableRow
                  key={row.id}
                  className="relative hover:bg-muted/50 focus-within:bg-muted/50"
                >
                  {showThumb && (
                    <TableCell>
                      {thumb ? (
                        // alt="" — the candidate's name is the row's accessible
                        // label right beside it; announcing the poster twice
                        // adds nothing.
                        <img
                          src={thumb}
                          alt=""
                          width={40}
                          height={56}
                          loading="lazy"
                          className="h-14 w-10 rounded-sm border border-border object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="h-14 w-10 rounded-sm border border-border bg-muted"
                        />
                      )}
                    </TableCell>
                  )}
                  <TableCell className="max-w-[280px]">
                    <Link
                      href={`/dashboard/campaigns/${row.id}`}
                      className="font-medium text-sm hover:underline after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                    >
                      {row.candidateName}
                    </Link>
                    {row.runningMateName && (
                      <div className="truncate text-xs text-muted-foreground">
                        {row.runningMateName}
                      </div>
                    )}
                    {renderUnderName?.(row)}
                  </TableCell>
                  <TableCell>
                    {acronym ? (
                      <Badge variant="secondary" className="text-xs">
                        {acronym}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span>{ELECTION_TYPE_LABEL[row.electionType] ?? row.electionType}</span>{" "}
                    <span className="text-muted-foreground">{row.year}</span>
                    {scope && (
                      <div className="font-mono text-xs text-muted-foreground">
                        {scope}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      status={row.status}
                      reviewStatus={row.reviewStatus}
                      reviewRequestedAt={row.reviewRequestedAt}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={CONFIDENCE_TONE[row.confidence]}
                    >
                      {row.confidence}
                    </Badge>
                  </TableCell>
                  {extraColumns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
