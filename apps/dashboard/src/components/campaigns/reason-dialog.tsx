"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { errorMessage } from "@/lib/campaigns";

/**
 * Confirmation modal with a mandatory reason/note — the shape every campaign
 * review verb needs (`approve`, `unpublish`, `conclude`, `withdraw`, `dissolve`
 * take `reason`; `request-changes` takes `note`). Errors from onConfirm stay
 * inline and the dialog stays open so the typed reason is never lost.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  required = true,
  minLength = 3,
  maxLength = 500,
  placeholder = "Why? This is recorded in the audit log.",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  const hintId = `${reasonId}-hint`;
  const errorId = `${reasonId}-error`;
  const trimmed = reason.trim();
  const valid = !required || trimmed.length >= minLength;
  // Whitespace-only counts as typed-but-invalid: without this a box full of
  // spaces just disables Confirm with no explanation.
  const showHint = required && reason.length > 0 && !valid;
  const describedBy = [showHint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  async function confirm() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(trimmed);
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (busy ? undefined : onOpenChange(v))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={reasonId}>
              Reason {required ? <span className="text-destructive">*</span> : "(optional)"}
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {reason.length}/{maxLength}
            </span>
          </div>
          <Textarea
            id={reasonId}
            rows={3}
            autoFocus
            maxLength={maxLength}
            placeholder={placeholder}
            value={reason}
            disabled={busy}
            aria-invalid={showHint || !!error}
            aria-describedby={describedBy || undefined}
            onChange={(e) => setReason(e.target.value)}
          />
          {showHint ? (
            <p id={hintId} className="text-xs text-muted-foreground">
              At least {minLength} characters.
            </p>
          ) : null}
          {error ? (
            <p id={errorId} className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={confirm}
            disabled={busy || !valid}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
