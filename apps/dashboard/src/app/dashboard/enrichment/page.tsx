"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryState, parseAsStringEnum, parseAsArrayOf } from "nuqs";
import { toast } from "sonner";
import { ChevronDown, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import { ReviewNoteDialog } from "@/components/enrichment/review-note-dialog";
import { enrichmentFetch } from "./lib";
import type { ChangeProposal } from "./types";
import { ProposalPanel, sortByConfidence, tableLabel } from "./_component";

const TABS = ["pending", "needs_human", "needs_more_sources", "approved", "rejected"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  pending: "Pending",
  needs_human: "Needs human",
  needs_more_sources: "Needs more sources",
  approved: "Approved",
  rejected: "Rejected",
};

// Action-type filter — mirrors ChangeProposal.changeKind. Multi-select; empty = all.
const ACTION_VALUES = ["fill", "correction", "create"] as const;
type ActionFilter = (typeof ACTION_VALUES)[number];
const ACTION_LABELS: Record<ActionFilter, string> = {
  fill: "Fill", correction: "Correction", create: "Create",
};

// Entity filter — fixed bucket set, matches the backend's normalized entityRole. Multi-select; empty = all.
const ENTITY_VALUES = [
  "governor", "senator", "representative", "mha", "lga_chairman", "councilor", "unknown",
] as const;
type EntityFilter = (typeof ENTITY_VALUES)[number];
const ENTITY_LABELS: Record<EntityFilter, string> = {
  governor: "Governor", senator: "Senator", representative: "Representative",
  mha: "MHA", lga_chairman: "LGA Chairman", councilor: "Councilor", unknown: "Unknown",
};

type DialogState = { type: "approve" | "reject" | "request-more"; id: string } | null;

/** A group of proposals rendered under a section header in the evidence-first stack. */
type ProposalGroup = { label: string; items: ChangeProposal[] };

/** A compact checkbox dropdown for multi-selecting filter values. Empty selection = "all". */
function MultiSelectFilter<T extends string>({
  allLabel, values, labels, selected, onChange,
}: {
  allLabel: string;
  values: readonly T[];
  labels: Record<T, string>;
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  const toggle = (v: T) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {allLabel}
          {selected.length > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-xs">{selected.length}</Badge>
          )}
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {values.map((v) => (
          <DropdownMenuCheckboxItem
            key={v}
            checked={selected.includes(v)}
            onCheckedChange={() => toggle(v)}
            onSelect={(e) => e.preventDefault()}
          >
            {labels[v]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function EnrichmentPage() {
  // nuqs' useQueryState reads useSearchParams(), which Next requires under a Suspense
  // boundary or static prerender of this page fails (CSR bailout).
  return (
    <Suspense fallback={<EnrichmentSkeleton />}>
      <EnrichmentView />
    </Suspense>
  );
}

function EnrichmentSkeleton() {
  return (
    <div className="-m-6 flex h-[calc(100vh-3rem)] flex-col gap-4 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="flex flex-1 flex-col gap-5 overflow-hidden">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 w-full" />)}
      </div>
    </div>
  );
}

const LIMIT = 30;

/** The backend status a tab pulls from — one per tab, matching production. */
const ACTIVE_STATUSES: Record<Tab, readonly string[]> = {
  pending: ["pending"],
  needs_human: ["needs_human"],
  needs_more_sources: ["needs_more_sources"],
  approved: ["approved"],
  rejected: ["rejected"],
};

function EnrichmentView() {
  const [tab, setTab] = useQueryState("tab", parseAsStringEnum<Tab>([...TABS]).withDefault("pending"));
  const [action, setAction] = useQueryState(
    "action", parseAsArrayOf(parseAsStringEnum<ActionFilter>([...ACTION_VALUES])).withDefault([]),
  );
  const [entity, setEntity] = useQueryState(
    "entity", parseAsArrayOf(parseAsStringEnum<EntityFilter>([...ENTITY_VALUES])).withDefault([]),
  );

  const [items, setItems] = useState<ChangeProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Per-status keyset cursor (status → next cursor, or null when that status is exhausted).
  const [cursors, setCursors] = useState<Record<string, string | null>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const statuses = ACTIVE_STATUSES[tab];
  const hasMore = statuses.some((s) => Boolean(cursors[s]));
  const filtersActive = action.length > 0 || entity.length > 0;

  const extraParams = useMemo(() => {
    const p = new URLSearchParams();
    if (action.length) p.set("action", action.join(","));
    if (entity.length) p.set("entity", entity.join(","));
    return p.toString();
  }, [action, entity]);

  // Page 1: fetch the first page of every active status in parallel (needs_review pulls
  // needs_human + pending), seed the item list and each status's cursor. Re-runs on
  // tab/filter change (fresh list + cursors).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const extra = extraParams ? `&${extraParams}` : "";
        const results = await Promise.all(
          statuses.map((s) =>
            enrichmentFetch(`/proposals?status=${s}&limit=${LIMIT}${extra}`).then((r) => ({ s, r })),
          ),
        );
        if (cancelled) return;
        const nextItems: ChangeProposal[] = [];
        const nextCursors: Record<string, string | null> = {};
        for (const { s, r } of results) {
          nextItems.push(...r.items);
          nextCursors[s] = r.nextCursor ?? null;
        }
        setItems(nextItems);
        setCursors(nextCursors);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load proposals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // `statuses` is a stable const keyed by `tab`, so `tab` covers it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, extraParams]);

  // Load the next page. Walk statuses in priority order (needs_human before pending) and
  // page the first one that still has a cursor — so the queue fills top-down. A ref guards
  // against the observer firing a second load before the first resolves.
  const loadingMoreRef = useRef(false);
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    const status = statuses.find((s) => cursors[s]);
    if (!status) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const extra = extraParams ? `&${extraParams}` : "";
      const { items: more, nextCursor } = await enrichmentFetch(
        `/proposals?status=${status}&limit=${LIMIT}&cursor=${cursors[status]}${extra}`,
      );
      setItems((prev) => [...prev, ...more]);
      setCursors((prev) => ({ ...prev, [status]: nextCursor ?? null }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [statuses, cursors, extraParams]);

  // Infinite scroll: auto-load the next page when the bottom sentinel nears the viewport
  // of the scroll container. Re-arms whenever cursors change (a new page landed).
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    const root = scrollRef.current;
    if (!el || !root || !hasMore || loading) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) void loadMore(); },
      { root, rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadMore]);

  const groups: ProposalGroup[] = useMemo(
    () => [{ label: TAB_LABELS[tab], items: sortByConfidence(items) }],
    [tab, items],
  );

  const totalCount = useMemo(() => groups.reduce((n, g) => n + g.items.length, 0), [groups]);

  const dialogProposal = dialog ? items.find((p) => p.id === dialog.id) ?? null : null;

  function requestApprove(id: string) {
    const p = items.find((x) => x.id === id);
    if (!p) return;
    if (p.changeKind === "fill") { void runAction(id, "approve"); return; }
    setDialog({ type: "approve", id });
  }

  async function runAction(id: string, kind: "approve" | "reject" | "request-more", note?: string) {
    setBusyId(id);
    try {
      if (kind === "approve") {
        await enrichmentFetch(`/proposals/${id}/approve`, { method: "POST" });
      } else if (kind === "reject") {
        await enrichmentFetch(`/proposals/${id}/reject`, { method: "POST", body: JSON.stringify({ note: note ?? "" }) });
      } else {
        await enrichmentFetch(`/proposals/${id}/request-more`, { method: "POST", body: JSON.stringify({ note: note ?? "" }) });
      }
      setItems((prev) => prev.filter((p) => p.id !== id));
      toast.success(
        kind === "approve" ? "Applied to live data" : kind === "reject" ? "Rejected" : "Sent back to agent",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  function clearFilters() { setAction([]); setEntity([]); }

  const headerCount = `${items.length} loaded${hasMore ? "+" : ""}`;

  return (
    <div className="-m-6 flex h-[calc(100vh-3rem)] flex-col overflow-hidden">
      {/* Topbar: title + counts + tab chips */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-card px-6 py-3">
        <h1 className="font-heading text-lg font-extrabold tracking-tight">Approval Queue</h1>
        <span className="font-mono text-xs text-muted-foreground">{!loading && headerCount}</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={t === tab ? "default" : "outline"}
              className={t === tab ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={() => setTab(t)}
            >
              {TAB_LABELS[t]}
            </Button>
          ))}
        </div>
      </div>

      {/* Secondary filter row */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-card px-6 py-2.5">
        <MultiSelectFilter
          allLabel="Actions" values={ACTION_VALUES} labels={ACTION_LABELS}
          selected={action} onChange={setAction}
        />
        <MultiSelectFilter
          allLabel="Entities" values={ENTITY_VALUES} labels={ENTITY_LABELS}
          selected={entity} onChange={setEntity}
        />
        {filtersActive && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            <FilterX className="size-4" /> Clear filters
          </Button>
        )}
      </div>

      {/* Evidence-first single-column stack */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-background">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-6 py-6">
          {loading ? (
            <div className="flex flex-col gap-5">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
          ) : totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
              No proposals match this filter.
            </div>
          ) : (
            groups.map((g) => g.items.length === 0 ? null : (
              <div key={g.label} className="flex flex-col gap-4">
                <div className="sticky top-0 z-10 -mt-1 self-start rounded-full border border-border bg-muted/90 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground backdrop-blur">
                  {g.label} · {g.items.length}
                </div>
                <div className="flex flex-col gap-5">
                  {g.items.map((p) => (
                    <ProposalPanel
                      key={p.id}
                      proposal={p}
                      busy={busyId === p.id}
                      onApprove={() => requestApprove(p.id)}
                      onReject={() => setDialog({ type: "reject", id: p.id })}
                      onRequestMore={() => setDialog({ type: "request-more", id: p.id })}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
          {/* Infinite-scroll sentinel: auto-loads the next page as it nears the viewport.
              The button below is the explicit-pagination fallback. */}
          {!loading && hasMore && (
            <div ref={sentinelRef} className="flex flex-col items-center gap-5 pb-2">
              {loadingMore ? (
                [0, 1].map((i) => <Skeleton key={i} className="h-56 w-full" />)
              ) : (
                <Button variant="outline" size="sm" onClick={() => void loadMore()}>
                  Load more
                </Button>
              )}
            </div>
          )}
          {!loading && !hasMore && totalCount > 0 && (
            <p className="py-2 text-center font-mono text-[11px] text-muted-foreground">
              End of queue · {totalCount} loaded
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={dialog?.type === "approve"}
        onOpenChange={(v) => { if (!v) setDialog(null); }}
        title={dialogProposal?.changeKind === "create" ? "Create new record?" : "Approve correction?"}
        description={
          dialogProposal?.changeKind === "create"
            ? `This CREATES a new ${dialogProposal ? tableLabel(dialogProposal.targetTable) : "record"} in live data (with its sources as evidence).`
            : "This OVERWRITES an existing value in live data."
        }
        confirmLabel="Approve" destructive
        onConfirm={async () => { if (dialog) await runAction(dialog.id, "approve"); setDialog(null); }}
      />
      <ReviewNoteDialog
        open={dialog?.type === "reject"}
        onOpenChange={(v) => { if (!v) setDialog(null); }}
        title="Reject proposal" description="Optionally say why. The proposal will be marked rejected."
        confirmLabel="Reject" destructive
        onConfirm={async (note) => { if (dialog) await runAction(dialog.id, "reject", note); setDialog(null); }}
      />
      <ReviewNoteDialog
        open={dialog?.type === "request-more"}
        onOpenChange={(v) => { if (!v) setDialog(null); }}
        title="Request more sources" description="Bounce this back to the agent queue with a note."
        confirmLabel="Request more"
        onConfirm={async (note) => { if (dialog) await runAction(dialog.id, "request-more", note); setDialog(null); }}
      />
    </div>
  );
}
