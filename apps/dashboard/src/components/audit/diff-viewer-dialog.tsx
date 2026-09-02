"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTimeSeconds, relativeTime } from "@/lib/format";

/** One event from GET /api/admin/audit — mirrors the API's AuditEventView. */
export interface AuditEventView {
  seq: number;
  id: string;
  occurredAt: string;
  epoch: number;
  actorType: string;
  actorId: string | null;
  /** Resolved staff name (null when unresolvable). */
  actorLabel: string | null;
  /** Staff actor email — modal only. */
  actorEmail: string | null;
  ip: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  /** Resolved target name; citizen user targets resolve only with users.read. */
  targetLabel: string | null;
  /** Admin targets' email — modal only. */
  targetEmail: string | null;
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

/**
 * Internal route for a target, when one exists. Officials link to the
 * (upcoming) official-management area — the stub detail page resolves today.
 */
function targetHref(type: string | null, id: string | null): string | null {
  if (!id) return null;
  switch (type) {
    case "official":
      return `/dashboard/officials/${id}`;
    case "user":
      return `/dashboard/users/${id}`;
    case "admin":
      return "/dashboard/admins";
    default:
      return null;
  }
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </>
  );
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
            </DialogHeader>

            <div className="space-y-4">
              <dl className="grid grid-cols-[92px_1fr] items-baseline gap-x-4 gap-y-2 rounded-lg border border-border p-3">
                <DetailRow label="Actor">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {event.actorType}
                    </Badge>
                    {event.actorLabel ? (
                      <span title={event.actorId ?? undefined}>
                        {event.actorLabel}
                        {event.actorEmail && (
                          <>
                            {" ("}
                            <span className="underline underline-offset-2">
                              {event.actorEmail}
                            </span>
                            {")"}
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {event.actorId ?? "—"}
                      </span>
                    )}
                  </span>
                </DetailRow>

                {(event.targetType || event.targetId) && (
                  <DetailRow label="Target">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {event.targetType && (
                        <Badge variant="outline" className="text-xs">
                          {event.targetType}
                        </Badge>
                      )}
                      {(() => {
                        const href = targetHref(event.targetType, event.targetId);
                        const text =
                          event.targetLabel ?? event.targetId ?? "—";
                        const labelled = Boolean(event.targetLabel);
                        return href && labelled ? (
                          <Link
                            href={href}
                            className="text-primary underline underline-offset-2"
                            title={event.targetId ?? undefined}
                          >
                            {text}
                          </Link>
                        ) : (
                          <span
                            className={
                              labelled
                                ? undefined
                                : "font-mono text-xs text-muted-foreground"
                            }
                            title={event.targetId ?? undefined}
                          >
                            {text}
                          </span>
                        );
                      })()}
                      {event.targetEmail && (
                        <span className="text-muted-foreground">
                          (
                          <span className="underline underline-offset-2">
                            {event.targetEmail}
                          </span>
                          )
                        </span>
                      )}
                    </span>
                  </DetailRow>
                )}

                <DetailRow label="Time">
                  {formatDateTimeSeconds(event.occurredAt)}
                  <span className="text-muted-foreground">
                    {" "}
                    · {relativeTime(event.occurredAt)}
                  </span>
                </DetailRow>

                {typeof event.metadata?.pathway === "string" && (
                  <DetailRow label="Pathway">
                    {String(event.metadata.pathway)}
                  </DetailRow>
                )}

                {event.ip && (
                  <DetailRow label="IP">
                    <span className="font-mono text-xs">{event.ip}</span>
                  </DetailRow>
                )}

                <DetailRow label="Chain">
                  <span className="font-mono text-xs">
                    seq {event.seq} · epoch {event.epoch}
                  </span>
                  <code
                    className="mt-1 block truncate rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground"
                    title={event.hash}
                  >
                    {event.hash}
                  </code>
                </DetailRow>
              </dl>

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
