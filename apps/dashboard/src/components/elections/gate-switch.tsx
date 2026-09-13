"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import { publicFetch } from "@/lib/api";
import { electionsApi, errorMessage } from "@/lib/elections";
import { useResource } from "@/lib/hooks/use-resource";
import { usePermissions } from "@/lib/permissions";

/**
 * The master kill switch (plan 68 D10.8): one SystemSetting,
 * `elections.gate_enabled`, read back through the PUBLIC gate endpoint (the
 * same thing awanaija reads, so what this switch shows is what the homepage
 * sees) and written only through POST /api/admin/elections/gate.
 *
 * Both directions confirm first — this is the whole public election surface,
 * not one row, and the toggle is audited (`election.gate_toggled`).
 */
export function GateSwitch() {
  const { loading: permsLoading, can } = usePermissions();
  const canToggle = !permsLoading && can("campaigns.review");
  const [pendingTo, setPendingTo] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchGate = useCallback(
    () => publicFetch("/api/election/gate") as Promise<{ enabled: boolean }>,
    [],
  );
  const { data, loading, error, refetch, setData } = useResource(fetchGate, []);

  if (loading && !data) return <Skeleton className="h-9 w-56 rounded-md" />;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
      <Switch
        id="gate-switch"
        checked={data?.enabled ?? false}
        // The dialog owns the actual write; the switch only proposes.
        onCheckedChange={(next) => setPendingTo(next)}
        disabled={!canToggle || busy || !data}
        aria-label="Election gate kill switch"
      />
      <Label htmlFor="gate-switch" className="text-sm">
        Public gate{" "}
        <span className="text-muted-foreground">
          {data ? (data.enabled ? "on" : "OFF — nothing is public") : "unknown"}
        </span>
      </Label>
      {error ? (
        <button
          type="button"
          className="text-xs text-destructive underline underline-offset-2"
          onClick={refetch}
        >
          Retry
        </button>
      ) : null}

      <ConfirmDialog
        open={pendingTo !== null}
        onOpenChange={(v) => setPendingTo(v ? pendingTo : null)}
        title={pendingTo ? "Turn the election gate ON" : "Turn the election gate OFF"}
        description={
          pendingTo
            ? "Published events go back onto the public gate (propagation ≤ ~2–3 min)."
            : "EVERY election surface goes dark for the public — homepage, ballots, countdowns — regardless of what is published. The toggle is audited."
        }
        confirmLabel={pendingTo ? "Turn on" : "Turn off"}
        destructive={!pendingTo}
        onConfirm={async () => {
          if (pendingTo === null) return;
          setBusy(true);
          try {
            const res = await electionsApi.setGate(pendingTo);
            setData({ enabled: res.enabled });
            toast.success(res.enabled ? "Gate enabled" : "Gate disabled");
            setPendingTo(null);
          } catch (err) {
            toast.error(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
