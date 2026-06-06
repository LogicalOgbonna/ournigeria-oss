"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProposalCard } from "@/components/enrichment/proposal-card";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import { ReviewNoteDialog } from "@/components/enrichment/review-note-dialog";
import { enrichmentFetch } from "./lib";
import type { ChangeProposal } from "./types";

const STATUSES = ["pending", "needs_human", "needs_more_sources", "approved", "rejected"] as const;

type BulkAction = "approve" | "reject" | "request-more";

/** Which bulk actions a tab permits. Approve only where the backend can apply. */
function bulkActionsFor(status: string): BulkAction[] {
  if (status === "pending" || status === "needs_human") return ["approve", "reject", "request-more"];
  if (status === "needs_more_sources") return ["reject", "request-more"];
  return [];
}

export default function EnrichmentPage() {
  const [proposals, setProposals] = useState<ChangeProposal[]>([]);
  const [status, setStatus] = useState<string>("pending");
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
    setSelected((prev) => (prev.size === proposals.length ? new Set() : new Set(proposals.map((p) => p.id))));
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
  const sel = proposals.filter((p) => selected.has(p.id));
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

      {selectable && !loading && proposals.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="rounded"
              checked={selected.size === proposals.length && proposals.length > 0}
              onChange={toggleAll}
            />
            Select all
          </label>
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-2">
              <span className="px-1 text-sm font-medium">{selected.size} selected</span>
              {actions.includes("approve") && (
                <Button size="sm" onClick={() => setBulkAction("approve")} disabled={acting}>
                  <Check className="size-4" /> Approve
                </Button>
              )}
              {actions.includes("reject") && (
                <Button size="sm" variant="destructive" onClick={() => setBulkAction("reject")} disabled={acting}>
                  <X className="size-4" /> Reject
                </Button>
              )}
              {actions.includes("request-more") && (
                <Button size="sm" variant="outline" onClick={() => setBulkAction("request-more")} disabled={acting}>
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
      ) : (
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((p) => (
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
