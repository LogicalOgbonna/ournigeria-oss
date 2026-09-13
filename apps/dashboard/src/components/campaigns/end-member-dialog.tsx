"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { END_REASONS, END_REASON_LABEL, REASON_MAX, type EndReason } from "@/lib/campaign-council";
import { errorMessage, type CouncilMember } from "@/lib/campaigns";

/** The body `POST /:id/council/:memberId/end` takes. */
export interface EndMemberInput {
  endReason: EndReason;
  endDate?: string;
  reason: string;
}

/**
 * End one membership.
 *
 * Unlike every other council write, the audit reason here is required on a
 * DRAFT too (`endMemberSchema.reason` is `min(1)` and `endMember` never looks
 * at the ticket status), so it is collected in this dialog rather than taken
 * from the tab session — the session reason merely seeds the box, and the tab
 * adopts whatever is typed here once the end succeeds.
 */
export function EndMemberDialog({
  member,
  defaultReason,
  onOpenChange,
  onConfirm,
}: {
  /** The member being ended, or null when the dialog is closed. */
  member: CouncilMember | null;
  defaultReason: string;
  onOpenChange: (v: boolean) => void;
  onConfirm: (member: CouncilMember, body: EndMemberInput) => Promise<void>;
}) {
  const fieldId = useId();
  const [endReason, setEndReason] = useState<EndReason>("resigned");
  const [endDate, setEndDate] = useState("");
  const [why, setWhy] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Re-seed on each open without an effect: the member identity IS the key.
  // Clearing on close covers EVERY exit (confirm, Cancel, Esc, backdrop) —
  // resetting inside one handler would leave the others stale.
  const [seeded, setSeeded] = useState<string | null>(null);
  if (!member && seeded !== null) setSeeded(null);
  if (member && seeded !== member.id) {
    setSeeded(member.id);
    setEndReason("resigned");
    setEndDate("");
    setWhy(defaultReason);
    setError(null);
  }

  const errorId = `${fieldId}-error`;
  const trimmed = why.trim();
  const valid = trimmed.length >= 1;

  async function confirm() {
    if (!member || !valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(member, {
        endReason,
        ...(endDate ? { endDate } : {}),
        reason: trimmed,
      });
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={member !== null} onOpenChange={(v) => (busy ? undefined : onOpenChange(v))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End this membership?</DialogTitle>
          <DialogDescription>
            {member ? `${member.name} — ${member.role.label}.` : ""} The row stays on the
            ticket, muted, with the reason they left.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${fieldId}-reason`}>Why did they leave</Label>
            <Select
              value={endReason}
              disabled={busy}
              onValueChange={(v) => setEndReason(v as EndReason)}
            >
              <SelectTrigger id={`${fieldId}-reason`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {END_REASONS.map((code) => (
                  <SelectItem key={code} value={code}>
                    {END_REASON_LABEL[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${fieldId}-date`}>End date</Label>
            <Input
              id={`${fieldId}-date`}
              type="date"
              disabled={busy}
              aria-describedby={`${fieldId}-date-hint`}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <p id={`${fieldId}-date-hint`} className="text-xs text-muted-foreground">
              Leave empty for today.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={`${fieldId}-note`}>
                Audit reason <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {why.length}/{REASON_MAX}
              </span>
            </div>
            <Textarea
              id={`${fieldId}-note`}
              rows={3}
              maxLength={REASON_MAX}
              disabled={busy}
              placeholder="Recorded in the audit log."
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
            />
          </div>

          {error ? (
            <p id={errorId} role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={busy || !valid}>
            {busy ? "Working…" : "End membership"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
