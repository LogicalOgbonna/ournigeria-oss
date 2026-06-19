import Link from "next/link";
import { Building2 } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { partyColor } from "@/lib/partyColors";
import type { PartyListItem } from "@/lib/api";

/**
 * Horizontal seat-bar ranking of the whole field — Nigeria's balance of power at
 * a glance. Each row is a party (logo, acronym, seat bar, seats, governorships),
 * ranked by seats; the largest is tagged. Rows link to the party detail page.
 */
export function PartyPowerRanking({ parties }: { readonly parties: PartyListItem[] }) {
  if (parties.length === 0) return null;
  const max = Math.max(...parties.map((p) => p.seats), 1);

  return (
    <div className="rounded-[10px] border border-border bg-card p-3 sm:p-4">
      <div className="space-y-1">
        {parties.map((p, i) => {
          const color = partyColor(p.acronym);
          const pct = Math.max(2, Math.round((p.seats / max) * 100));
          return (
            <Link
              key={p.acronym}
              href={`/parties/${p.acronym}`}
              className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            >
              <span className="w-4 shrink-0 text-right font-mono text-xs text-muted-foreground">
                {i + 1}
              </span>
              <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                <OfficialAvatar
                  src={p.logoUrl}
                  alt={p.name}
                  px={32}
                  imgClassName="w-8 h-8 object-contain"
                  fallback={<Building2 className="h-4 w-4 text-slate-400" />}
                />
              </div>
              <div className="flex w-16 shrink-0 items-center gap-1.5">
                <span className="font-heading text-sm font-semibold text-foreground">{p.acronym}</span>
                {i === 0 && (
                  <span className="hidden rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 lg:inline">
                    Largest
                  </span>
                )}
              </div>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <span className="w-12 shrink-0 text-right font-mono text-xs font-semibold text-foreground">
                {p.seats.toLocaleString()}
              </span>
              <span className="hidden w-14 shrink-0 text-right text-[11px] text-muted-foreground sm:block">
                {p.governorships} gov
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
