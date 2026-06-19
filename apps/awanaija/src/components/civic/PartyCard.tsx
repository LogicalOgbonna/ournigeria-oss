import Link from "next/link";
import { Building2 } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { partyColor } from "@/lib/partyColors";
import type { PartyListItem } from "@/lib/api";

export function PartyCard({ party }: { readonly party: PartyListItem }) {
  const color = partyColor(party.acronym);
  const completeness =
    party.completenessScore != null ? Math.round(party.completenessScore * 100) : null;

  return (
    <Link
      href={`/parties/${party.acronym}`}
      className="group block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md dark:hover:border-emerald-600"
      style={{ borderLeftWidth: "4px", borderLeftColor: color }}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
          <OfficialAvatar
            src={party.logoUrl}
            alt={party.name}
            px={48}
            imgClassName="w-12 h-12 object-contain"
            fallback={<Building2 className="h-6 w-6 text-slate-400" />}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold text-slate-900 dark:text-white">
              {party.acronym}
            </span>
            {!party.isActive && (
              <span className="text-[10px] uppercase tracking-wide text-slate-400">inactive</span>
            )}
          </div>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{party.name}</p>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="font-mono text-2xl font-bold leading-none text-slate-900 dark:text-white">
            {party.seats.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">seats held</div>
        </div>
        {completeness != null && (
          <span className="text-xs text-slate-400">{completeness}% profile</span>
        )}
      </div>
    </Link>
  );
}
