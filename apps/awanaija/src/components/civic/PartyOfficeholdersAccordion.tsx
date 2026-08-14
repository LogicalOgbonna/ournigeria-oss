"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, User, Loader2 } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { Show } from "@/components/ui/Show";
import { getPartyOfficeholders, type PartyOfficialMini } from "@/lib/api";

const POSITIONS = [
  { role: "governor", label: "Governors" },
  { role: "senator", label: "Senators" },
  { role: "rep", label: "Representatives" },
  { role: "mha", label: "State Assembly" },
  { role: "lga_chairman", label: "LGA Chairmen" },
];

interface GroupState {
  items: PartyOfficialMini[];
  page: number;
  pages: number;
  loading: boolean;
}

/**
 * Right-column accordion of a party's elected officials, grouped by office.
 * Each group is collapsed by default and lazy-loads (paginated) on first
 * expand, so the page stays fast even for ~1,000-officeholder parties.
 */
export function PartyOfficeholdersAccordion({
  acronym,
  byRole,
}: {
  readonly acronym: string;
  readonly byRole: Record<string, number>;
}) {
  const groups = POSITIONS.filter((p) => (byRole[p.role] ?? 0) > 0);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<Record<string, GroupState>>({});

  async function loadPage(role: string, page: number) {
    setData((d) => ({
      ...d,
      [role]: { ...(d[role] ?? { items: [], page: 0, pages: 1 }), loading: true },
    }));
    try {
      const res = await getPartyOfficeholders(acronym, role, page);
      setData((d) => {
        const prev = d[role]?.items ?? [];
        return {
          ...d,
          [role]: {
            items: page === 1 ? res.data : [...prev, ...res.data],
            page: res.page,
            pages: res.pages,
            loading: false,
          },
        };
      });
    } catch {
      setData((d) => ({
        ...d,
        [role]: { ...(d[role] ?? { items: [], page: 0, pages: 1 }), loading: false },
      }));
    }
  }

  function toggle(role: string) {
    const next = !open[role];
    setOpen((o) => ({ ...o, [role]: next }));
    if (next && !data[role]) loadPage(role, 1); // fetch once on first open
  }

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">No elected officials.</p>;
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const isOpen = !!open[g.role];
        const gs = data[g.role];
        const count = byRole[g.role] ?? 0;
        return (
          <div key={g.role} className="overflow-hidden rounded-[10px] border border-border bg-card">
            <button
              onClick={() => toggle(g.role)}
              className="group flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
            >
              <span className="flex items-center gap-2">
                <span className="font-heading text-sm font-semibold text-foreground">{g.label}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {count.toLocaleString()}
                </span>
              </span>
              <Show when={isOpen}>
                <ChevronDown className="h-4 w-4 text-emerald-500" />
              </Show>
              <Show when={!isOpen}>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-emerald-500" />
              </Show>
            </button>

            <Show when={isOpen}>
              <div className="scrollbar-theme max-h-[360px] space-y-1 overflow-y-auto border-t border-border p-2">
                {!gs || (gs.loading && gs.items.length === 0) ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : (
                  <>
                    {gs.items.map((o) => (
                      <Link
                        key={o.id}
                        href={`/officials/${o.slug ?? o.id}`}
                        className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
                      >
                        <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
                          <OfficialAvatar
                            src={o.imageUrl}
                            alt={o.name}
                            px={36}
                            imgClassName="w-9 h-9 rounded-full object-cover"
                            fallback={<User className="h-4 w-4 text-slate-400" />}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-heading text-sm font-medium text-foreground">
                            {o.name}
                          </p>
                          {o.contextLabel && (
                            <p className="truncate text-[11px] text-muted-foreground">
                              {o.contextLabel}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                    {gs.page < gs.pages && (
                      <button
                        onClick={() => loadPage(g.role, gs.page + 1)}
                        disabled={gs.loading}
                        className="mt-1 w-full rounded-md py-2 text-xs font-medium text-emerald-600 hover:bg-muted/50 disabled:opacity-50 dark:text-emerald-400"
                      >
                        {gs.loading ? "Loading…" : `Load more (${gs.items.length} of ${count.toLocaleString()})`}
                      </button>
                    )}
                    <Link
                      href={`/officials?party=${acronym}&role=${g.role}`}
                      className="mt-1 block rounded-md py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-emerald-600"
                    >
                      View all in directory →
                    </Link>
                  </>
                )}
              </div>
            </Show>
          </div>
        );
      })}
    </div>
  );
}
