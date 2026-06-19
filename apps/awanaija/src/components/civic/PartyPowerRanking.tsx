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
              <span className="w-4 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                {i + 1}
              </span>
              <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                <OfficialAvatar
                  src={p.logoUrl}
                  alt={p.name}
                  px={28}
                  imgClassName="w-7 h-7 object-contain"
                  fallback={<Building2 className="h-3.5 w-3.5 text-slate-400" />}
                />
              </div>
              <span className="w-12 shrink-0 font-heading text-[13px] font-semibold text-foreground">
                {p.acronym}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <span className="w-11 shrink-0 text-right font-mono text-[11px] font-semibold text-foreground">
                {p.seats.toLocaleString()}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
