"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProposalCard } from "@/components/enrichment/proposal-card";
import { enrichmentFetch } from "./lib";
import type { ChangeProposal } from "./types";

const STATUSES = ["pending", "needs_human", "needs_more_sources", "approved", "rejected"] as const;

export default function EnrichmentPage() {
  const [proposals, setProposals] = useState<ChangeProposal[]>([]);
  const [status, setStatus] = useState<string>("pending");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProposals(await enrichmentFetch(`/proposals?status=${status}`));
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

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : proposals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {status} proposals.</p>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} busy={busy}
              onApprove={approve} onReject={reject} onRequestMore={requestMore} />
          ))}
        </div>
      )}
    </div>
  );
}
