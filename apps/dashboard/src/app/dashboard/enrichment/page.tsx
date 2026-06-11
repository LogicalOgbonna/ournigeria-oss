"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useQueryState, parseAsStringEnum, parseAsArrayOf } from "nuqs";
import { toast } from "sonner";
import { Check, X, HelpCircle, FilterX, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ProposalCard } from "@/components/enrichment/proposal-card";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import { ReviewNoteDialog } from "@/components/enrichment/review-note-dialog";
import { enrichmentFetch } from "./lib";
import type { ChangeProposal } from "./types";

const STATUSES = ["pending", "needs_human", "needs_more_sources", "approved", "rejected"] as const;
type Status = (typeof STATUSES)[number];

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

type BulkAction = "approve" | "reject" | "request-more";

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

/** Which bulk actions a tab permits. Approve only where the backend can apply. */
function bulkActionsFor(status: string): BulkAction[] {
  if (status === "pending" || status === "needs_human") return ["approve", "reject", "request-more"];
  if (status === "needs_more_sources") return ["reject", "request-more"];
  return [];
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
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-64 w-full" />)}
      </div>
    </div>
  );
}

function EnrichmentView() {
  const [proposals, setProposals] = useState<ChangeProposal[]>([]);
  const [status, setStatus] = useQueryState(
    "status", parseAsStringEnum<Status>([...STATUSES]).withDefault("pending"),
  );
  const [action, setAction] = useQueryState(
    "action", parseAsArrayOf(parseAsStringEnum<ActionFilter>([...ACTION_VALUES])).withDefault([]),
  );
  const [entity, setEntity] = useQueryState(
    "entity", parseAsArrayOf(parseAsStringEnum<EntityFilter>([...ENTITY_VALUES])).withDefault([]),
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProposals(await enrichmentFetch(`/proposals?status=${status}`));
      setSelected(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  // Action/entity narrow the loaded status list client-side (no refetch). Each is a multi-select
  // OR within itself, ANDed across the two; an empty selection means "all". Clear selection on
  // filter change so a bulk action can never touch a proposal hidden by the current filter.
  const filtersActive = action.length > 0 || entity.length > 0;
  const filtered = useMemo(
    () => proposals.filter(
      (p) => (action.length === 0 || action.includes(p.changeKind as ActionFilter)) &&
             (entity.length === 0 || entity.includes((p.entityRole ?? "unknown") as EntityFilter)),
    ),
    [proposals, action, entity],
  );
  useEffect(() => { setSelected(new Set()); }, [action, entity]);

  function clearFilters() { setAction([]); setEntity([]); }

  async function act(fn: () => Promise<void>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const approve = (id: string) =>
    act(async () => { await enrichmentFetch(`/proposals/${id}/approve`, { method: "POST" }); }, "Applied to live data");
  const reject = (id: string, note: string) =>
    act(async () => { await enrichmentFetch(`/proposals/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }); }, "Rejected");
  const requestMore = (id: string, note: string) =>
    act(async () => { await enrichmentFetch(`/proposals/${id}/request-more`, { method: "POST", body: JSON.stringify({ note }) }); }, "Sent back to agent");

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id))));
  }

  async function runBulk(action: BulkAction, note?: string) {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (ids.length > 100) { toast.error("Select 100 or fewer proposals at a time."); return; }
    setActing(true);
    try {
      const { results } = await enrichmentFetch("/proposals/bulk", {
        method: "POST",
        body: JSON.stringify({ ids, action, note }),
      });
      const ok = (results as Array<{ status: string }>).filter((r) => r.status === "ok").length;
      const failed = results.length - ok;
      const verb = action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Sent back";
      if (failed === 0) toast.success(`${verb} ${ok} proposal${ok === 1 ? "" : "s"}`);
      else if (ok > 0) toast.warning(`${verb} ${ok}, ${failed} failed`);
      else toast.error(`All ${failed} failed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk action failed");
    } finally {
      setActing(false);
      await load();
    }
  }

  const actions = bulkActionsFor(status);
  const selectable = actions.length > 0;
  const sel = filtered.filter((p) => selected.has(p.id));
  const corrections = sel.filter((p) => p.changeKind === "correction").length;
  const creates = sel.filter((p) => p.changeKind === "create").length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Enrichment Proposals</h1>
        <p className="text-sm text-muted-foreground">Agent-proposed data with corroborated sources. Approving writes to live data.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button key={s} size="sm" variant={s === status ? "default" : "outline"} onClick={() => setStatus(s)}>
            {s}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
        {!loading && filtersActive && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {proposals.length}
          </span>
        )}
      </div>

      {selectable && !loading && filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="rounded"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleAll}
            />
            Select all
          </label>
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-2">
              <span className="px-1 text-sm font-medium">{selected.size} selected</span>
              {actions.includes("approve") && (
                <Button size="sm" onClick={() => setBulkAction("approve")} disabled={busy || acting}>
                  <Check className="size-4" /> Approve
                </Button>
              )}
              {actions.includes("reject") && (
                <Button size="sm" variant="destructive" onClick={() => setBulkAction("reject")} disabled={busy || acting}>
                  <X className="size-4" /> Reject
                </Button>
              )}
              {actions.includes("request-more") && (
                <Button size="sm" variant="outline" onClick={() => setBulkAction("request-more")} disabled={busy || acting}>
                  <HelpCircle className="size-4" /> Request more
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : proposals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {status} proposals.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No proposals match these filters.</p>
      ) : (
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProposalCard key={p.id} proposal={p} busy={busy || acting}
              onApprove={approve} onReject={reject} onRequestMore={requestMore}
              selectable={selectable} selected={selected.has(p.id)} onToggleSelect={toggleSelect} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={bulkAction === "approve"}
        onOpenChange={(v) => { if (!v) setBulkAction(null); }}
        title={`Approve ${selected.size} proposal${selected.size === 1 ? "" : "s"}?`}
        description={
          <>
            This writes to live data.
            {corrections + creates > 0
              ? ` Includes ${corrections} correction${corrections === 1 ? "" : "s"} (overwrites existing values) and ${creates} new record${creates === 1 ? "" : "s"}.`
              : ""}
          </>
        }
        confirmLabel={`Approve ${selected.size}`}
        destructive={corrections + creates > 0}
        onConfirm={async () => { await runBulk("approve"); setBulkAction(null); }}
      />
      <ReviewNoteDialog
        open={bulkAction === "reject"}
        onOpenChange={(v) => { if (!v) setBulkAction(null); }}
        title={`Reject ${selected.size} proposal${selected.size === 1 ? "" : "s"}`}
        description="Optionally say why. All selected proposals will be marked rejected."
        confirmLabel="Reject" destructive
        onConfirm={async (note) => { await runBulk("reject", note); setBulkAction(null); }}
      />
      <ReviewNoteDialog
        open={bulkAction === "request-more"}
        onOpenChange={(v) => { if (!v) setBulkAction(null); }}
        title={`Request more for ${selected.size} proposal${selected.size === 1 ? "" : "s"}`}
        description="Bounce all selected back to the agent queue with a note."
        confirmLabel="Request more"
        onConfirm={async (note) => { await runBulk("request-more", note); setBulkAction(null); }}
      />
    </div>
  );
}
