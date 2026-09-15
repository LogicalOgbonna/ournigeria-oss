import Link from "next/link";
import { Building2, User } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import type { PartyListItem } from "@/lib/api";
import { Show } from "@/components/ui/Show";
import { officerRoleLabel, orderedOfficers } from "@/lib/officer-roles";

// Compact list card: top roles only — the full slate lives on the party detail page.
const MAX_CARD_OFFICERS = 3;

export function PartyCard({ party }: { readonly party: PartyListItem }) {
  const completeness =
    party.completenessScore != null ? Math.round(party.completenessScore * 100) : null;
  const officers = orderedOfficers(party.officers ?? [], MAX_CARD_OFFICERS);

  return (
    <Link
      href={`/parties/${party.acronym}`}
      className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600"
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
            <Show when={!party.isActive}>
              <span className="text-[10px] uppercase tracking-wide text-slate-400">inactive</span>
            </Show>
          </div>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{party.name}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-xl font-bold leading-none text-slate-900 dark:text-white">
            {party.seats.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">seats</div>
        </div>
      </div>

      <Show when={!!(party.governorships > 0 || party.ideology)}>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Show when={party.governorships > 0}>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Governs {party.governorships}
            </span>
          </Show>
          <Show when={!!party.ideology}>
            <span className="max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {party.ideology}
            </span>
          </Show>
        </div>
      </Show>

      <Show when={officers.length > 0}>
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          {officers.map((o) => (
            <div key={o.role} className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <OfficialAvatar
                  src={o.imageUrl}
                  alt={o.name}
                  px={32}
                  imgClassName="w-8 h-8 rounded-full object-cover"
                  fallback={<User className="h-4 w-4 text-slate-400" />}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium leading-tight text-slate-800 dark:text-slate-200">
                  {o.name}
                </div>
                <div className="text-[11px] leading-tight text-slate-400">
                  {officerRoleLabel(o.role, true)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Show>

      <Show when={officers.length === 0 && completeness != null}>
        <div className="mt-3 text-xs text-slate-400">{completeness}% profile</div>
      </Show>
    </Link>
  );
}
