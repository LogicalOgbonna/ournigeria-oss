"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTimeFull } from "@/lib/format";

/** One event from GET /api/admin/audit — mirrors the API's AuditEventView. */
export interface AuditEventView {
  seq: number;
  id: string;
  occurredAt: string;
  epoch: number;
  actorType: string;
  actorId: string | null;
  ip: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  /** May contain { __erased: true } markers for privacy-erased fields. */
  diff: { before?: unknown; after?: unknown } | null;
  /** May contain `pathway`. */
  metadata: Record<string, unknown> | null;
  hash: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True for the crypto-erasure marker { __erased: true } (exactly). */
function isErasedMarker(value: unknown): boolean {
  return (
    isPlainObject(value) &&
    Object.keys(value).length === 1 &&
    value.__erased === true
  );
}

/** True for the permission-redaction marker { __redacted: true } (exactly). */
function isRedactedMarker(value: unknown): boolean {
  return (
    isPlainObject(value) &&
    Object.keys(value).length === 1 &&
    value.__redacted === true
  );
}

/** Recursively replace erasure markers with a readable placeholder string. */
function replaceErased(value: unknown): unknown {
  if (isErasedMarker(value)) return "[erased — privacy]";
  if (isRedactedMarker(value)) return "[encrypted — you lack permission to view]";
  if (Array.isArray(value)) return value.map(replaceErased);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, replaceErased(v)]),
    );
  }
  return value;
}

function pretty(value: unknown): string {
  if (value === undefined) return "—";
  return JSON.stringify(replaceErased(value), null, 2);
}

/** Top-level keys whose values differ between before and after (cheap diff). */
function changedKeys(before: unknown, after: unknown): string[] {
  if (!isPlainObject(before) || !isPlainObject(after)) return [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys]
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .sort();
}

export function DiffViewerDialog({
  event,
  open,
  onOpenChange,
}: {
  event: AuditEventView | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const diff = event?.diff ?? null;
  const changed = diff ? changedKeys(diff.before, diff.after) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        {event && (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-base">
                {event.action}
              </DialogTitle>
              <DialogDescription>
                {event.actorType}
                {event.actorId ? ` ${event.actorId}` : ""} ·{" "}
                {formatDateTimeFull(event.occurredAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-xs">
                    seq {event.seq}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs">
                    epoch {event.epoch}
                  </Badge>
                  {event.ip && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {event.ip}
                    </Badge>
                  )}
                </div>
                <code
                  className="block truncate rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground"
                  title={event.hash}
                >
                  {event.hash}
                </code>
              </div>

              {diff ? (
                <div className="space-y-2">
                  {changed.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        Changed:
                      </span>
                      {changed.map((key) => (
                        <Badge
                          key={key}
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Before
                      </p>
                      <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap break-words">
                        {pretty(diff.before)}
                      </pre>
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        After
                      </p>
                      <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap break-words">
                        {pretty(diff.after)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No field changes recorded
                </p>
              )}

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Metadata
                </p>
                {event.metadata ? (
                  <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap break-words">
                    {pretty(event.metadata)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
