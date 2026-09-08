"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReasonDialog } from "@/components/campaigns/reason-dialog";
import { revertAuditEvent } from "@/lib/api";
import { revertPermission } from "@/lib/audit-revertible";
import { metaFor } from "@/lib/campaign-audit";
import type { AuditEvent } from "@/lib/campaigns";
import { formatDateTimeSeconds, relativeTime, shortId } from "@/lib/format";
import { usePermissions } from "@/lib/permissions";

/** The free-text an event carries: `reason` on most verbs, `note` on request-changes. */
function noteOf(metadata: Record<string, unknown>): string | null {
  for (const key of ["note", "reason"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** `metadata.fields` on campaign.updated — which columns the edit touched. */
function fieldsOf(metadata: Record<string, unknown>): string[] {
  const fields = metadata?.fields;
  return Array.isArray(fields)
    ? fields.filter((f): f is string => typeof f === "string")
    : [];
}

/**
 * The last 20 audit events for a ticket, newest first (the API orders them and
 * includes its media/document/council children). `GET /campaigns/:id` does not
 * select the `diff` column, so there is no before/after to show here — the full
 * diff (and the generic revert UI) lives on /dashboard/audit.
 */
export function ReviewTimeline({
  events,
  onReverted,
}: {
  events: AuditEvent[];
  onReverted: () => void;
}) {
  const { can, adminId } = usePermissions();
  const [reverting, setReverting] = useState<AuditEvent | null>(null);

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No audit events yet — every edit, upload and review lands here.
      </p>
    );
  }

  return (
    <>
      <ol className="space-y-3">
        {events.map((event) => {
          const meta = metaFor(event.action);
          const Icon = meta.icon;
          const note = noteOf(event.metadata);
          const fields = fieldsOf(event.metadata);
          // The API decides what a revert needs; the map is only there to keep
          // the button off screen when the click would 403 (or 400).
          const permission = revertPermission(event.action);
          const revertible = Boolean(permission && can(permission));
          return (
            <li
              key={event.seq}
              className="flex gap-3 rounded-lg border border-border p-3"
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${meta.tone ?? "text-muted-foreground"}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">{meta.label}</span>
                  <span
                    className="text-xs text-muted-foreground"
                    title={`${event.actorId ?? "system"} · seq ${event.seq}`}
                  >
                    by {event.actorId ? shortId(event.actorId) : "system"}
                    {event.actorId && event.actorId === adminId ? " (you)" : ""}
                  </span>
                  <time
                    dateTime={event.occurredAt}
                    className="text-xs text-muted-foreground"
                    title={formatDateTimeSeconds(event.occurredAt)}
                  >
                    · {relativeTime(event.occurredAt)}
                  </time>
                </div>
                {fields.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {fields.map((f) => (
                      <Badge key={f} variant="secondary" className="font-mono text-xs">
                        {f}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {note ? (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    &ldquo;{note}&rdquo;
                  </p>
                ) : null}
              </div>
              {revertible ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setReverting(event)}
                >
                  <Undo2 className="mr-1 h-3.5 w-3.5" />
                  Revert
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>

      <ReasonDialog
        open={reverting !== null}
        onOpenChange={(v) => setReverting(v ? reverting : null)}
        // The human label, not the raw action key: "Revert: Ticket edited"
        // reads as an instruction, "Revert campaign.updated" as a log line.
        title={`Revert: ${reverting ? metaFor(reverting.action).label : ""}`}
        description="The previous values are written back as a NEW attributed chain event — history is never rewritten. The API requires a reason when the action was another admin's."
        confirmLabel="Revert"
        destructive
        required={false}
        onConfirm={async (reason) => {
          if (!reverting) return;
          await revertAuditEvent(reverting.seq, reason || undefined);
          toast.success(`Reverted seq ${reverting.seq}`);
          setReverting(null);
          onReverted();
        }}
      />
    </>
  );
}
