"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { PartySeatsByZone } from "@/lib/api";

const ZONE_ROLE_LABELS: Record<string, string> = {
  governor: "Governors",
  senator: "Senators",
  rep: "Reps",
  mha: "Assembly",
  lga_chairman: "LGA Chairmen",
};

export function RegionalStrongholds({ data }: { readonly data: PartySeatsByZone }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!data?.zones?.length) return null;
  return (
    <div className="mt-6">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-400">
        Regional strongholds
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Share of each zone&apos;s elected seats the party holds.
      </p>
      <div className="mt-3 space-y-2.5">
        {data.zones.map((z) => {
          const strongest = z.zoneName === data.strongestZone;
          const isOpen = open === z.zoneCode;
          return (
            <div key={z.zoneCode} className="group relative">
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{z.zoneName}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${strongest ? "bg-emerald-600" : "bg-emerald-400/70"}`}
                    style={{ width: `${z.pct}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {z.pct}%
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : z.zoneCode)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-emerald-600"
                  aria-label={`How ${z.zoneName}'s ${z.pct}% is derived`}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Breakdown: desktop hover (md:group-hover) or tap the info icon (mobile). */}
              <div
                className={`absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-border bg-popover p-3 text-xs shadow-lg md:group-hover:block ${isOpen ? "block" : "hidden"}`}
              >
                <div className="mb-1.5 font-medium text-foreground">
                  {z.zoneName}: holds {z.held.toLocaleString()} of {z.total.toLocaleString()} zone seats ({z.pct}%)
                </div>
                <div className="space-y-0.5 font-mono text-muted-foreground">
                  {z.byRole.map((r) => (
                    <div key={r.role} className="flex justify-between gap-3">
                      <span>{ZONE_ROLE_LABELS[r.role] ?? r.role}</span>
                      <span>
                        {r.held}/{r.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
