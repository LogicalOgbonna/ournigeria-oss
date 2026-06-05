"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, HelpCircle, ArrowRight } from "lucide-react";
import { SourceEvidence } from "./source-evidence";
import { ReviewNoteDialog } from "./review-note-dialog";
import { STATUS_STYLES, formatValue, formatDate } from "@/app/dashboard/enrichment/lib";
import type { ChangeProposal } from "@/app/dashboard/enrichment/types";

export function ProposalCard({
  proposal, onApprove, onReject, onRequestMore, busy,
}: {
  proposal: ChangeProposal;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  onRequestMore: (id: string, note: string) => Promise<void>;
  busy: boolean;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const isCorrection = proposal.changeKind === "correction";
  const reviewable = proposal.status === "pending" || proposal.status === "needs_human";

  async function approve() {
    if (isCorrection && !confirm("This OVERWRITES an existing value. Approve the correction?")) return;
    await onApprove(proposal.id);
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm">{proposal.targetTable}.{proposal.targetField}</span>
          <Badge className={isCorrection ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}>
            {proposal.changeKind}
          </Badge>
          <Badge className={STATUS_STYLES[proposal.status]}>{proposal.status}</Badge>
          <span className="text-xs text-muted-foreground">confidence: {proposal.confidence}</span>
          <span className="ml-auto text-xs text-muted-foreground">{formatDate(proposal.createdAt)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-muted-foreground line-through">{formatValue(proposal.currentValue)}</span>
          <ArrowRight className="size-4 text-muted-foreground" />
          <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">{formatValue(proposal.proposedValue)}</span>
        </div>

        {proposal.reasoning && <p className="text-sm text-muted-foreground">{proposal.reasoning}</p>}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {proposal.sources.length} source{proposal.sources.length === 1 ? "" : "s"}
          </p>
          {proposal.sources.map((s) => <SourceEvidence key={s.id} source={s} />)}
        </div>

        {reviewable && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={approve} disabled={busy}>
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
        {proposal.reviewNote && (
          <p className="text-xs text-muted-foreground">Note: {proposal.reviewNote}</p>
        )}

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
