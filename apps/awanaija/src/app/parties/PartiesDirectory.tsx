"use client";

import { useMemo, useState } from "react";
import { PartyCard } from "@/components/civic/PartyCard";
import { Show } from "@/components/ui/Show";
import type { PartyListItem } from "@/lib/api";

type Sort = "seats" | "name" | "governorships" | "completeness";

const COMPARATORS: Record<Sort, (a: PartyListItem, b: PartyListItem) => number> = {
  seats: (a, b) => b.seats - a.seats || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
  governorships: (a, b) => b.governorships - a.governorships || b.seats - a.seats,
  completeness: (a, b) => (b.completenessScore ?? 0) - (a.completenessScore ?? 0) || b.seats - a.seats,
};

export function PartiesDirectory({ parties }: { readonly parties: PartyListItem[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("seats");
  const [includeInactive, setIncludeInactive] = useState(false);

  const active = useMemo(
    () => parties.filter((p) => p.isActive).sort(COMPARATORS.seats),
    [parties],
  );
  const totalSeats = useMemo(() => active.reduce((a, p) => a + p.seats, 0), [active]);
  const largest = active[0];

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = parties.filter((p) => includeInactive || p.isActive);
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.acronym.toLowerCase().includes(q),
      );
    }
    return [...list].sort(COMPARATORS[sort]);
  }, [parties, search, sort, includeInactive]);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-[10px] border border-border bg-card px-5 py-4">
        <Stat label="Active parties" value={active.length.toString()} />
        <Stat label="Seats tracked" value={totalSeats.toLocaleString()} />
        {largest && <Stat label="Largest" value={largest.acronym} />}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search parties…"
          aria-label="Search parties"
          className="h-9 min-w-[180px] flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-400"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sort parties"
          className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-emerald-400"
        >
          <option value="seats">Sort: Seats</option>
          <option value="name">Sort: Name</option>
          <option value="governorships">Sort: Governorships</option>
          <option value="completeness">Sort: Completeness</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="accent-emerald-500"
          />
          Include inactive
        </label>
      </div>

      {/* Grid (already rank-ordered by the active sort) */}
      <Show when={visible.length === 0}>
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          No parties match &ldquo;{search}&rdquo;.
        </p>
      </Show>
      <Show when={visible.length !== 0}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <PartyCard key={p.acronym} party={p} />
          ))}
        </div>
      </Show>
    </div>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <div className="font-mono text-lg font-bold text-foreground">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
