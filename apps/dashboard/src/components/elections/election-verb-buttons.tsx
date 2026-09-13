"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  EyeOff,
  Flag,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import { ReasonDialog } from "@/components/campaigns/reason-dialog";
import {
  electionsApi,
  errorMessage,
  type ElectionRow,
  type ElectionVerb,
} from "@/lib/elections";
import { usePermissions } from "@/lib/permissions";

/**
 * The event state machine as buttons (plan 68 §6 + D5). Only what the API
 * would accept is rendered, so a click is never a guaranteed 409:
 *
 *   publish    !published, scheduled|postponed   (campaigns.review)
 *   unpublish  published                          (campaigns.review)
 *   conclude   scheduled|postponed                (campaigns.review)
 *   cancel     scheduled|postponed                (campaigns.review)
 *   delete     never published (no reviewedBy)    (elections.write)
 *
 * Permission gating here is UX only — the API's PermissionsGuard is the wall.
 */
interface VerbSpec {
  label: string;
  icon: LucideIcon;
  variant?: "default" | "outline" | "destructive";
  destructive?: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Toast on success. */
  done: string;
}

const VERBS: Record<ElectionVerb, VerbSpec> = {
  publish: {
    label: "Publish",
    icon: CheckCircle2,
    variant: "default",
    title: "Publish this election event",
    description:
      "The event goes onto the public election gate within a minute or two — the homepage, ballots and countdowns read it.",
    confirmLabel: "Publish",
    done: "Published",
  },
  unpublish: {
    label: "Unpublish",
    icon: EyeOff,
    variant: "outline",
    destructive: true,
    title: "Unpublish this election event",
    description:
      "It drops off the public gate immediately (propagation ≤ ~2–3 min). Publish again to put it back.",
    confirmLabel: "Unpublish",
    done: "Unpublished",
  },
  conclude: {
    label: "Conclude",
    icon: Flag,
    variant: "outline",
    title: "Conclude this election",
    description:
      "The poll has been held. A concluded event drops off the gate automatically without an unpublish.",
    confirmLabel: "Conclude",
    done: "Concluded",
  },
  cancel: {
    label: "Cancel",
    icon: Ban,
    variant: "destructive",
    destructive: true,
    title: "Cancel this election",
    description:
      "The poll is not happening. A cancelled event drops off the gate automatically.",
    confirmLabel: "Cancel event",
    done: "Cancelled",
  },
};

export function ElectionVerbButtons({
  election,
  onDone,
  onDeleted,
  className,
}: {
  election: ElectionRow;
  /** Called after any successful transition — the page refetches. */
  onDone: () => void;
  /** Called after a successful DELETE (the row is gone; navigate away). */
  onDeleted?: () => void;
  className?: string;
}) {
  const { can } = usePermissions();
  const [dialog, setDialog] = useState<ElectionVerb | "delete" | null>(null);

  const canWrite = can("elections.write");
  const canReview = can("campaigns.review");

  const upcoming = election.status === "scheduled" || election.status === "postponed";
  // remove(): never published AND never reviewed — a row that was live once
  // keeps its audit trail (it is unpublished/cancelled, not deleted).
  const canDelete = !election.published && !election.reviewedBy;

  const spec = dialog && dialog !== "delete" ? VERBS[dialog] : null;

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      {canReview && !election.published && upcoming ? (
        <Button size="sm" variant="default" onClick={() => setDialog("publish")}>
          <CheckCircle2 className="mr-1 h-4 w-4" />
          Publish
        </Button>
      ) : null}
      {canReview && election.published ? (
        <Button size="sm" variant="outline" onClick={() => setDialog("unpublish")}>
          <EyeOff className="mr-1 h-4 w-4" />
          Unpublish
        </Button>
      ) : null}
      {canReview && upcoming ? (
        <>
          <Button size="sm" variant="outline" onClick={() => setDialog("conclude")}>
            <Flag className="mr-1 h-4 w-4" />
            Conclude
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDialog("cancel")}>
            <Ban className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        </>
      ) : null}
      {canWrite && canDelete ? (
        <Button size="sm" variant="destructive" onClick={() => setDialog("delete")}>
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      ) : null}

      {/* One dialog for all four reason verbs. `verb` is awaited WITHOUT a
          catch: ReasonDialog shows a rejection inline and stays open, so the
          typed reason survives a 409 instead of vanishing behind a toast. */}
      {spec && dialog !== "delete" && dialog ? (
        <ReasonDialog
          open
          onOpenChange={(v) => (v ? undefined : setDialog(null))}
          title={spec.title}
          description={spec.description}
          confirmLabel={spec.confirmLabel}
          destructive={spec.destructive}
          onConfirm={async (reason) => {
            await electionsApi.verb(election.id, dialog, { reason });
            toast.success(spec.done);
            onDone();
          }}
        />
      ) : null}

      {/* DELETE carries no body (the controller parses none), so this is a
          plain confirmation rather than a reason prompt. */}
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(v) => setDialog(v ? "delete" : null)}
        title="Delete this draft event"
        description="The event is removed. Only an event that was never published can be deleted; attached campaigns or results block it (detach them first)."
        confirmLabel="Delete draft"
        destructive
        onConfirm={async () => {
          try {
            await electionsApi.remove(election.id);
            toast.success("Draft deleted");
            onDeleted?.();
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      />
    </div>
  );
}
