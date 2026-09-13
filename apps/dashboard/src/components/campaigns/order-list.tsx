"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDownToLine,
  ChevronDown,
  ChevronUp,
  CircleMinus,
  CirclePlus,
  GripVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/campaigns/status-chip";
import type { Bucket } from "@/lib/campaign-order";
import type { CampaignRow } from "@/lib/campaigns";
import { cn } from "@/lib/utils";

/**
 * The two sortable columns of the rail-order page. Pointer drags and the
 * explicit move buttons are two front-ends onto the same three callbacks, so
 * anything reachable with a mouse is reachable with a keyboard alone — dnd-kit's
 * KeyboardSensor covers the handle, and the buttons cover the people who never
 * find it.
 */

export interface ColumnCallbacks {
  /** One step within the row's own column. */
  onNudge: (id: string, dir: -1 | 1) => void;
  /** Send a row to `index` of `bucket` (indexed after removal — see moveTo). */
  onMove: (id: string, bucket: Bucket, index: number) => void;
}

/** The card itself, with no drag wiring — also what the DragOverlay renders. */
export function TicketCardBody({
  row,
  rank,
  dragHandle,
  actions,
  className,
}: {
  row: CampaignRow;
  /** 1-based rail position; null in the unranked column. */
  rank: number | null;
  dragHandle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const thumb = row.media?.[0]?.url ?? null;
  const acronym = row.party?.acronym ?? row.partyAcronym;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card p-2.5",
        className,
      )}
    >
      {dragHandle}
      <span
        className={cn(
          "w-6 shrink-0 text-center text-sm font-medium tabular-nums",
          rank === null && "text-muted-foreground/50",
        )}
        aria-hidden={rank === null}
      >
        {rank ?? "—"}
      </span>
      {thumb ? (
        // alt="" — the candidate's name is right beside it; a screen reader
        // announcing the poster as well says the same thing twice.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          width={32}
          height={44}
          loading="lazy"
          className="h-11 w-8 shrink-0 rounded-sm border border-border object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="h-11 w-8 shrink-0 rounded-sm border border-border bg-muted"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{row.candidateName}</div>
        {row.runningMateName ? (
          <div className="truncate text-xs text-muted-foreground">{row.runningMateName}</div>
        ) : null}
      </div>
      {acronym ? (
        <Badge variant="secondary" className="shrink-0 text-xs">
          {acronym}
        </Badge>
      ) : null}
      <StatusChip
        status={row.status}
        reviewStatus={row.reviewStatus}
        reviewRequestedAt={row.reviewRequestedAt}
      />
      {actions}
    </div>
  );
}

function SortableCard({
  row,
  bucket,
  index,
  total,
  disabled,
  callbacks,
}: {
  row: CampaignRow;
  bucket: Bucket;
  index: number;
  total: number;
  disabled: boolean;
  callbacks: ColumnCallbacks;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled,
  });
  const ranked = bucket === "ranked";
  const label = row.candidateName;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      // The original keeps its space in the list but goes ghost; the
      // DragOverlay draws the card that follows the cursor.
      className={isDragging ? "opacity-40" : undefined}
    >
      <TicketCardBody
        row={row}
        rank={ranked ? index + 1 : null}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={disabled}
            aria-label={`Drag ${label}`}
            className="shrink-0 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
        actions={
          <div className="flex shrink-0 items-center gap-0.5">
            {ranked ? (
              <>
                <IconButton
                  label={`Move ${label} up`}
                  disabled={disabled || index === 0}
                  onClick={() => callbacks.onNudge(row.id, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={`Move ${label} down`}
                  disabled={disabled || index === total - 1}
                  onClick={() => callbacks.onNudge(row.id, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={`Rank ${label} last`}
                  disabled={disabled || index === total - 1}
                  onClick={() => callbacks.onMove(row.id, "ranked", total - 1)}
                >
                  <ArrowDownToLine className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={`Move ${label} to unranked`}
                  disabled={disabled}
                  // Appended, not inserted at the top: a demoted card lands in
                  // one predictable place instead of jumping to wherever its
                  // name would sort.
                  onClick={() => callbacks.onMove(row.id, "unranked", Number.MAX_SAFE_INTEGER)}
                >
                  <CircleMinus className="h-4 w-4" />
                </IconButton>
              </>
            ) : (
              <IconButton
                label={`Add ${label} to the rail`}
                disabled={disabled}
                // Appended, not inserted: a promotion must never silently
                // demote whatever already holds a rank.
                onClick={() => callbacks.onMove(row.id, "ranked", Number.MAX_SAFE_INTEGER)}
              >
                <CirclePlus className="h-4 w-4" />
              </IconButton>
            )}
          </div>
        }
      />
    </li>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="h-7 w-7"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function OrderColumn({
  bucket,
  title,
  hint,
  rows,
  disabled,
  emptyHint,
  callbacks,
}: {
  bucket: Bucket;
  title: string;
  hint: string;
  rows: CampaignRow[];
  disabled: boolean;
  emptyHint: string;
  callbacks: ColumnCallbacks;
}) {
  // The column itself is a drop target ONLY while its list is empty, because
  // otherwise there would be nothing to drop onto. Registering it permanently
  // is a trap: its rectangle covers the whole column, so `closestCorners` picks
  // it over the card actually under the cursor and every mid-list drop gets
  // appended to the end instead.
  const { setNodeRef, isOver } = useDroppable({ id: bucket, disabled: disabled || rows.length > 0 });
  const headingId = `order-${bucket}-heading`;

  return (
    <section aria-labelledby={headingId} className="min-w-0 flex-1 space-y-2">
      <div>
        <h2 id={headingId} className="font-heading text-sm font-semibold">
          {title}{" "}
          <span className="font-sans font-normal text-muted-foreground">({rows.length})</span>
        </h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-24 rounded-lg border border-dashed border-border p-2 transition-colors",
          isOver && "border-primary bg-primary/5",
        )}
      >
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {rows.map((row, index) => (
              <SortableCard
                key={row.id}
                row={row}
                bucket={bucket}
                index={index}
                total={rows.length}
                disabled={disabled}
                callbacks={callbacks}
              />
            ))}
          </ul>
        </SortableContext>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyHint}</p>
        ) : null}
      </div>
    </section>
  );
}
