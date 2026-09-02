"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DiffViewerDialog,
  type AuditEventView,
} from "@/components/audit/diff-viewer-dialog";
import { adminFetch, ApiError } from "@/lib/api";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatDateTimeFull } from "@/lib/format";

const PAGE_SIZE = 25;

const ACTOR_TYPES = ["staff", "member", "system", "agent"] as const;
const ACTOR_TYPE_LABELS: Record<(typeof ACTOR_TYPES)[number], string> = {
  staff: "Staff",
  member: "Member",
  system: "System",
  agent: "Agent",
};

const PATHWAYS = ["direct", "proposal", "enrichment"] as const;
const PATHWAY_LABELS: Record<(typeof PATHWAYS)[number], string> = {
  direct: "Direct",
  proposal: "Proposal",
  enrichment: "Enrichment",
};

/**
 * URL-backed filter state, shared between the table and the page shell
 * (the export button rebuilds the same query string). Must render under a
 * <Suspense> boundary — nuqs reads useSearchParams().
 */
export function useAuditFilters() {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [actorId, setActorId] = useQueryState(
    "actorId",
    parseAsString.withDefault(""),
  );
  const [actorType, setActorType] = useQueryState(
    "actorType",
    parseAsString.withDefault(""),
  );
  const [targetType, setTargetType] = useQueryState(
    "targetType",
    parseAsString.withDefault(""),
  );
  const [pathway, setPathway] = useQueryState(
    "pathway",
    parseAsString.withDefault(""),
  );
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  return {
    q,
    setQ,
    actorId,
    setActorId,
    actorType,
    setActorType,
    targetType,
    setTargetType,
    pathway,
    setPathway,
    page,
    setPage,
  };
}

/** Maps dashboard filter state onto the API's query params (q → action prefix). */
export function buildAuditFilterParams(filters: {
  q: string;
  actorId: string;
  actorType: string;
  targetType: string;
  pathway: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("action", filters.q);
  if (filters.actorId) params.set("actorId", filters.actorId);
  if (filters.actorType) params.set("actorType", filters.actorType);
  if (filters.targetType) params.set("targetType", filters.targetType);
  if (filters.pathway) params.set("pathway", filters.pathway);
  return params;
}

function actionVariant(
  action: string,
): "destructive" | "secondary" | "outline" {
  if (/deleted|denied|failed|revoked/.test(action)) return "destructive";
  if (/updated|edited/.test(action)) return "secondary";
  return "outline";
}

function truncateId(id: string | null | undefined): string {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function pathwayOf(event: AuditEventView): string | null {
  const value = event.metadata?.pathway;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function AuditTable({
  endpoint,
  onForbidden,
}: {
  endpoint: "/audit" | "/audit/mine";
  onForbidden?: () => void;
}) {
  const {
    q,
    setQ,
    actorId,
    actorType,
    setActorType,
    targetType,
    pathway,
    setPathway,
    page,
    setPage,
  } = useAuditFilters();
  const debouncedQ = useDebounce(q, 300);

  const [events, setEvents] = useState<AuditEventView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AuditEventView | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Ref so an inline onForbidden prop can't retrigger the fetch effect.
  const onForbiddenRef = useRef(onForbidden);
  onForbiddenRef.current = onForbidden;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildAuditFilterParams({
        q: debouncedQ,
        actorId,
        actorType,
        targetType,
        pathway,
      });
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      const res = await adminFetch(`${endpoint}?${params}`);
      setEvents(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && onForbiddenRef.current) {
        onForbiddenRef.current();
        return;
      }
      const message =
        err instanceof Error ? err.message : "Failed to load audit events";
      setEvents([]);
      setTotal(0);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, debouncedQ, actorId, actorType, targetType, pathway, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by action prefix…"
            value={q}
            onChange={(e) => {
              void setQ(e.target.value || null);
              void setPage(null);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={actorType || "all"}
          onValueChange={(v) => {
            void setActorType(v === "all" ? null : v);
            void setPage(null);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Actor type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actors</SelectItem>
            {ACTOR_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {ACTOR_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={pathway || "all"}
          onValueChange={(v) => {
            void setPathway(v === "all" ? null : v);
            void setPage(null);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Pathway" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pathways</SelectItem>
            {PATHWAYS.map((p) => (
              <SelectItem key={p} value={p}>
                {PATHWAY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Pathway</TableHead>
              <TableHead className="text-right">Seq</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No audit events match
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow
                  key={event.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelected(event);
                    setDialogOpen(true);
                  }}
                >
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDateTimeFull(event.occurredAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {event.actorType}
                      </Badge>
                      <span
                        className="font-mono text-xs text-muted-foreground"
                        title={event.actorId ?? undefined}
                      >
                        {truncateId(event.actorId)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={actionVariant(event.action)}
                      className="font-mono text-xs"
                    >
                      {event.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {event.targetType ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{event.targetType}</span>
                        <span
                          className="font-mono text-xs text-muted-foreground"
                          title={event.targetId ?? undefined}
                        >
                          {truncateId(event.targetId)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {pathwayOf(event) ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {event.seq}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} event{total === 1 ? "" : "s"} · page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => void setPage(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page >= totalPages}
            onClick={() => void setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DiffViewerDialog
        event={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
