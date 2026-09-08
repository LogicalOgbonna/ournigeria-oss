"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  EyeOff,
  Flag,
  Loader2,
  Send,
  Trash2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import { ReasonDialog } from "@/components/campaigns/reason-dialog";
import {
  campaignsApi,
  errorMessage,
  isPublicStatus,
  type CampaignDetail,
} from "@/lib/campaigns";
import { usePermissions } from "@/lib/permissions";

/**
 * The ticket state machine as buttons (admin-campaigns.service §"State machine").
 * Only what the API would actually accept is rendered, so a click is never a
 * guaranteed 409:
 *
 *   submit            draft (write)
 *   request-changes   draft, already submitted (review)
 *   approve           draft submitted -> active | suspended -> active |
 *                     active/concluded whose reviewStatus slipped -> confirm
 *   conclude          active (write)
 *   unpublish         active | concluded (review)
 *   withdraw/dissolve active | concluded | suspended (review)
 *   delete            draft that was never published (write)
 *
 * Permission gating here is UX only — the API's PermissionsGuard is the wall.
 */
type Verb =
  | "approve"
  | "request-changes"
  | "conclude"
  | "unpublish"
  | "withdraw"
  | "dissolve";

interface VerbSpec {
  /** Button + dialog labels; `approve` overrides them per source status. */
  label: string;
  icon: LucideIcon;
  variant?: "default" | "outline" | "destructive";
  destructive?: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Toast on success. */
  done: string;
  /** request-changes takes a `note` (2000 chars), everything else a `reason` (500). */
  maxLength?: number;
  placeholder?: string;
  send: (id: string, text: string) => Promise<unknown>;
}

const VERBS: Record<Verb, VerbSpec> = {
  approve: {
    label: "Approve",
    icon: CheckCircle2,
    variant: "default",
    title: "Approve this ticket",
    description:
      "Publishing makes the ticket visible on ournigeria.ng (unless its confidence is low).",
    confirmLabel: "Approve",
    done: "Published",
    send: (id, reason) => campaignsApi.verb(id, "approve", { reason }),
  },
  "request-changes": {
    label: "Request changes",
    icon: Flag,
    variant: "outline",
    title: "Request changes",
    description:
      "The note is shown to the writer on the ticket and in the review queue.",
    confirmLabel: "Send back",
    done: "Changes requested",
    maxLength: 2_000,
    placeholder: "What needs to change before this can be approved?",
    send: (id, note) => campaignsApi.verb(id, "request-changes", { note }),
  },
  conclude: {
    label: "Conclude",
    icon: Flag,
    variant: "outline",
    title: "Conclude this campaign",
    description: "The ticket stays public, marked as a past campaign.",
    confirmLabel: "Conclude",
    done: "Concluded",
    send: (id, reason) => campaignsApi.verb(id, "conclude", { reason }),
  },
  unpublish: {
    label: "Unpublish",
    icon: EyeOff,
    variant: "outline",
    destructive: true,
    title: "Unpublish this ticket",
    description:
      "It disappears from the public ballot immediately. Approve later to put it back.",
    confirmLabel: "Unpublish",
    done: "Unpublished",
    send: (id, reason) => campaignsApi.verb(id, "unpublish", { reason }),
  },
  withdraw: {
    label: "Withdraw",
    icon: Undo2,
    variant: "outline",
    destructive: true,
    title: "Withdraw this ticket",
    description:
      "For a candidate who pulled out. The ticket leaves the ballot for good and its election anchor is marked withdrawn.",
    confirmLabel: "Withdraw",
    done: "Withdrawn",
    send: (id, reason) => campaignsApi.verb(id, "withdraw", { reason }),
  },
  dissolve: {
    label: "Dissolve",
    icon: Ban,
    variant: "destructive",
    destructive: true,
    title: "Dissolve this ticket",
    description:
      "For a ticket that fell apart (party split, disqualification). Same finality as withdraw.",
    confirmLabel: "Dissolve",
    done: "Dissolved",
    send: (id, reason) => campaignsApi.verb(id, "dissolve", { reason }),
  },
};

/** One button for a table-driven verb; `approve` is drawn by hand (its label moves). */
function VerbButton({ spec, onClick }: { spec: VerbSpec; onClick: () => void }) {
  return (
    <Button size="sm" variant={spec.variant ?? "outline"} onClick={onClick}>
      <spec.icon className="mr-1 h-4 w-4" />
      {spec.label}
    </Button>
  );
}

export function VerbButtons({
  campaign,
  onDone,
  onDeleted,
  className,
}: {
  campaign: CampaignDetail;
  /** Called after any successful transition — the page refetches. */
  onDone: () => void;
  /** Called after a successful DELETE (the row is gone; navigate away). */
  onDeleted?: () => void;
  className?: string;
}) {
  const { can } = usePermissions();
  const [dialog, setDialog] = useState<Verb | "delete" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canWrite = can("campaigns.write");
  const canReview = can("campaigns.review");

  const status = campaign.status;
  const isDraft = status === "draft";
  const awaitingReview = Boolean(campaign.reviewRequestedAt);
  const changesRequested = campaign.reviewStatus === "disputed";
  const isPublic = isPublicStatus(status);
  // A public ticket edited since its last approval: `approve` confirms it.
  const needsConfirm = isPublic && campaign.reviewStatus !== "reviewed";
  const canApprove =
    (isDraft && awaitingReview) || status === "suspended" || needsConfirm;
  // Same endpoint, three jobs — the label has to say which one this is.
  const approveLabel = isDraft
    ? "Approve"
    : status === "suspended"
      ? "Republish"
      : "Confirm review";
  const approveSpec: VerbSpec = {
    ...VERBS.approve,
    label: approveLabel,
    confirmLabel: approveLabel,
    title: `${approveLabel} this ticket`,
    description: isDraft
      ? VERBS.approve.description
      : status === "suspended"
        ? "The ticket goes back on the public ballot."
        : "Confirms the edits made since the last review. The ticket stays public.",
    done:
      isDraft
        ? "Published"
        : status === "suspended"
          ? "Republished"
          : "Review confirmed",
  };
  // remove(): draft AND never reviewed (a ticket that was live once keeps its
  // audit trail — it is withdrawn, not deleted).
  const canDelete = isDraft && !campaign.reviewedBy;

  const spec =
    dialog && dialog !== "delete"
      ? dialog === "approve"
        ? approveSpec
        : VERBS[dialog]
      : null;

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await campaignsApi.verb(campaign.id, "submit");
      toast.success("Sent for review");
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      {canWrite && isDraft ? (
        <Button
          size="sm"
          onClick={() => void submit()}
          // Already waiting on a reviewer — re-submitting would only reset the
          // clock. Once changes are requested, submitting again is the point.
          disabled={submitting || (awaitingReview && !changesRequested)}
          title={
            awaitingReview && !changesRequested
              ? "Already waiting for a reviewer"
              : undefined
          }
        >
          {submitting ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-1 h-4 w-4" />
          )}
          {changesRequested ? "Resubmit" : "Submit for review"}
        </Button>
      ) : null}

      {canReview && (isDraft || isPublic || status === "suspended") ? (
        <Button
          size="sm"
          variant={canApprove ? "default" : "outline"}
          disabled={!canApprove}
          title={
            canApprove
              ? undefined
              : isDraft
                ? "Submit the draft first"
                : "Nothing to confirm — already reviewed"
          }
          onClick={() => setDialog("approve")}
        >
          <CheckCircle2 className="mr-1 h-4 w-4" />
          {approveLabel}
        </Button>
      ) : null}

      {canReview && isDraft ? (
        <Button
          size="sm"
          variant="outline"
          disabled={!awaitingReview}
          title={awaitingReview ? undefined : "Submit the draft first"}
          onClick={() => setDialog("request-changes")}
        >
          <Flag className="mr-1 h-4 w-4" />
          Request changes
        </Button>
      ) : null}

      {canWrite && status === "active" ? (
        <VerbButton spec={VERBS.conclude} onClick={() => setDialog("conclude")} />
      ) : null}
      {canReview && isPublic ? (
        <VerbButton spec={VERBS.unpublish} onClick={() => setDialog("unpublish")} />
      ) : null}
      {canReview && (isPublic || status === "suspended") ? (
        <>
          <VerbButton spec={VERBS.withdraw} onClick={() => setDialog("withdraw")} />
          <VerbButton spec={VERBS.dissolve} onClick={() => setDialog("dissolve")} />
        </>
      ) : null}

      {canWrite && canDelete ? (
        <Button size="sm" variant="destructive" onClick={() => setDialog("delete")}>
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      ) : null}

      {/* One dialog for all six reason/note verbs. `send` is awaited WITHOUT a
          catch: ReasonDialog shows a rejection inline and stays open, so the
          typed reason survives a 409 instead of vanishing behind a toast. */}
      {spec ? (
        <ReasonDialog
          open
          onOpenChange={(v) => (v ? undefined : setDialog(null))}
          title={spec.title}
          description={spec.description}
          confirmLabel={spec.confirmLabel}
          destructive={spec.destructive}
          maxLength={spec.maxLength}
          placeholder={spec.placeholder}
          onConfirm={async (text) => {
            await spec.send(campaign.id, text);
            toast.success(spec.done);
            onDone();
          }}
        />
      ) : null}

      {/* DELETE carries no body at all (the controller parses none), so this is
          a plain confirmation rather than a reason prompt. */}
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(v) => setDialog(v ? "delete" : null)}
        title="Delete this draft"
        description="The draft and its audit target are removed. Only a draft that was never published can be deleted."
        confirmLabel="Delete draft"
        destructive
        onConfirm={async () => {
          try {
            await campaignsApi.remove(campaign.id);
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
