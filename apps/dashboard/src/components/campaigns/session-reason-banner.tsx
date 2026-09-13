"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionReason } from "@/lib/hooks/use-session-reason";

/**
 * The "why am I being asked for a reason / which reason am I using" bar that
 * sits at the top of every tab whose commits need one. Renders nothing on a
 * draft (no reason required) or for a read-only operator.
 */
export function SessionReasonBanner({
  reason,
  status,
  canWrite,
}: {
  reason: SessionReason;
  /** The ticket's status, named in the copy so the rule is not a mystery. */
  status: string;
  canWrite: boolean;
}) {
  if (!canWrite || !reason.required) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
      {reason.reason ? (
        <>
          <span className="text-muted-foreground">
            Recording every change on this tab as:
          </span>
          <span className="font-medium">“{reason.reason}”</span>
          <Button size="sm" variant="ghost" onClick={reason.clear}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Change
          </Button>
        </>
      ) : (
        <span className="text-muted-foreground">
          This ticket is {status}, so the first change asks for a reason — it is
          recorded in the audit log and sends the ticket back for review.
        </span>
      )}
    </div>
  );
}
