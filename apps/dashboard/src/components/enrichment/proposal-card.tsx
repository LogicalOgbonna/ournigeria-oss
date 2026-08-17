"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, HelpCircle, User, ExternalLink, ChevronRight } from "lucide-react";
import { SourceEvidence } from "./source-evidence";
import { ReviewNoteDialog } from "./review-note-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { STATUS_STYLES, formatValue } from "@/app/dashboard/enrichment/lib";
import { formatDateTime } from "@/lib/format";
import type { ChangeProposal, CouncilorProposedEntity } from "@/app/dashboard/enrichment/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ournigeria.ng";

/** "official_education" → "education record" — human label for a create payload. */
function tableLabel(targetTable: string): string {
  return `${targetTable.replace(/^official_/, "").replace(/_/g, " ").replace(/s$/, "")} record`;
}

/**
 * Generic renderer for Plan-45 structured create payloads (education, elections,
 * careers, …): a key/value grid of the proposed row. Unknown/non-object payloads
 * fall back to raw JSON so the reviewer always sees exactly what will be written.
 */
function StructuredCreatePayload({ targetTable, payload }: { targetTable: string; payload: unknown }) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
        <p className="font-medium">New {tableLabel(targetTable)}</p>
        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    );
  }
  const entries = Object.entries(payload as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
      <p className="font-medium">New {tableLabel(targetTable)}</p>
      <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {k.replace(/([A-Z])/g, " $1").toLowerCase()}
            </dt>
            <dd className="break-all font-mono text-xs">
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ProposalCard({
  proposal, onApprove, onReject, onRequestMore, busy,
  selectable, selected, onToggleSelect,
}: {
  proposal: ChangeProposal;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  onRequestMore: (id: string, note: string) => Promise<void>;
  busy: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const isCorrection = proposal.changeKind === "correction";
  const isCreate = proposal.changeKind === "create";
  const entity =
    isCreate &&
    proposal.proposedValue &&
    typeof proposal.proposedValue === "object" &&
    "official" in proposal.proposedValue &&
    "position" in proposal.proposedValue
      ? (proposal.proposedValue as CouncilorProposedEntity)
      : null;
  const reviewable = proposal.status === "pending" || proposal.status === "needs_human";

  // Whose data is changing. create carries the new name in its payload (no public page yet);
  // fill/correction resolve to an existing official id the server attached.
  const officialName = isCreate ? (entity?.official.name ?? proposal.officialName ?? null) : (proposal.officialName ?? null);
  const officialId = isCreate ? null : (proposal.officialId ?? null);

  // fill is a low-risk additive write — approve straight away, no confirm (prior behaviour).
  // correction/create touch live data, so they go through the modal instead of window.confirm.
  function requestApprove() {
    if (isCorrection || isCreate) { setApproveOpen(true); return; }
    void onApprove(proposal.id);
  }

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-3 py-6">
        {/* WHO — the official whose data is changing, linked to their public page */}
        <div className="flex items-start gap-2">
          {selectable && (
            <input
              type="checkbox"
              className="mt-1 rounded"
              checked={!!selected}
              onChange={() => onToggleSelect?.(proposal.id)}
              aria-label="Select proposal"
            />
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            {officialName ? (
              officialId ? (
                <a
                  href={`${SITE_URL}/officials/${officialId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                  title={`Open ${officialName}'s published page`}
                >
                  <User className="size-4 shrink-0" />
                  <span className="truncate">{officialName}</span>
                  <ExternalLink className="size-3 shrink-0 opacity-60" />
                </a>
              ) : (
                <span className="inline-flex max-w-full items-center gap-1.5 font-medium">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{officialName}</span>
                  {isCreate && <span className="text-xs font-normal text-muted-foreground">(new)</span>}
                </span>
              )
            ) : (
              <span className="text-sm text-muted-foreground">Unknown official</span>
            )}

            {/* WHAT — the field + classification */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {isCreate ? `new · ${proposal.targetTable}` : proposal.targetField}
              </span>
              <Badge className={isCorrection
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                : isCreate
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}>
                {proposal.changeKind}
              </Badge>
              <Badge className={STATUS_STYLES[proposal.status]}>{proposal.status}</Badge>
              <span className="text-xs text-muted-foreground">confidence: {proposal.confidence}</span>
            </div>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(proposal.createdAt)}</span>
        </div>

        {/* CHANGE — before → after */}
        {isCreate && entity ? (
          <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
            <p className="font-medium">New councilor: {entity.official.name}</p>
            <p className="text-muted-foreground">
              {entity.meta?.ward ?? entity.position.wardCode}
              {entity.meta?.lga ? ` · ${entity.meta.lga}` : ""}
              {entity.meta?.state ? ` · ${entity.meta.state}` : ""}
            </p>
            <p className="text-muted-foreground">
              Party: {entity.position.partyAcronym ?? "—"} · term start: {entity.position.startDate}
            </p>
          </div>
        ) : isCreate ? (
          <StructuredCreatePayload targetTable={proposal.targetTable} payload={proposal.proposedValue} />
        ) : (
          <div className="space-y-1 rounded-md bg-muted/40 p-2 text-sm">
            <div className="flex items-baseline gap-2">
              <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Before</span>
              <span className="break-all font-mono text-muted-foreground line-through">{formatValue(proposal.currentValue)}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">After</span>
              <span className="break-all font-mono font-medium text-emerald-700 dark:text-emerald-400">{formatValue(proposal.proposedValue)}</span>
            </div>
          </div>
        )}

        {proposal.reasoning && <p className="text-sm text-muted-foreground">{proposal.reasoning}</p>}

        <details className="group space-y-2">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground">
            <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
            {proposal.sources.length} source{proposal.sources.length === 1 ? "" : "s"}
          </summary>
          <div className="space-y-2 pt-2">
            {proposal.sources.map((s) => <SourceEvidence key={s.id} source={s} />)}
          </div>
        </details>

        {proposal.reviewNote && (
          <p className="text-xs text-muted-foreground">Note: {proposal.reviewNote}</p>
        )}

        {reviewable && (
          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={requestApprove} disabled={busy}>
              <Check className="size-4" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} disabled={busy}>
              <X className="size-4" /> Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMoreOpen(true)} disabled={busy}>
              <HelpCircle className="size-4" /> Request more
            </Button>
          </div>
        )}

        <ConfirmDialog open={approveOpen} onOpenChange={setApproveOpen}
          title={isCreate ? "Create new record?" : "Approve correction?"}
          description={isCreate
            ? entity
              ? "This CREATES a new official + position in live data."
              : `This CREATES a new ${tableLabel(proposal.targetTable)} in live data (with its sources as evidence).`
            : "This OVERWRITES an existing value in live data."}
          confirmLabel="Approve" destructive onConfirm={() => onApprove(proposal.id)} />
        <ReviewNoteDialog open={rejectOpen} onOpenChange={setRejectOpen}
          title="Reject proposal" description="Optionally say why. The proposal will be marked rejected."
          confirmLabel="Reject" destructive onConfirm={(n) => onReject(proposal.id, n)} />
        <ReviewNoteDialog open={moreOpen} onOpenChange={setMoreOpen}
          title="Request more sources" description="Bounce this back to the agent queue with a note."
          confirmLabel="Request more" onConfirm={(n) => onRequestMore(proposal.id, n)} />
      </CardContent>
    </Card>
  );
}
