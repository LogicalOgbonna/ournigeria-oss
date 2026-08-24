"use client";

import dynamic from "next/dynamic";
import { BudgetGoverned } from "./BudgetGoverned";
import { RegionalStrongholds } from "./RegionalStrongholds";
import { Show } from "@/components/ui/Show";
import type { PartyDetail } from "@/lib/api";

// Lazy-load the map (+ its geo data) so it stays off the initial bundle.
const NigeriaChoropleth = dynamic(
  () => import("@/components/civic/NigeriaChoropleth").then((m) => m.NigeriaChoropleth),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[5/4] w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
    ),
  },
);

export function StatesGoverned({
  party,
  color,
}: {
  readonly party: PartyDetail;
  readonly color: string;
}) {
  const statesGoverned = party["statesGoverned"] ?? [];
  const governedValues = Object.fromEntries(statesGoverned.map((c) => [c, 1]));
  return (
    <section>
      <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white">
        States governed
      </h2>
      <Show when={statesGoverned.length === 0}>
        <p className="mt-1 text-sm text-muted-foreground">Holds no governorships.</p>
      </Show>
      <Show when={statesGoverned.length !== 0}>
        <BudgetGoverned budget={party.budgetGoverned} statesGoverned={statesGoverned.length} />
        <div className="mt-4">
          <NigeriaChoropleth
            valuesByState={governedValues}
            breakdownByState={party.footprint?.seatsByStateByRole}
            color={color}
            className="mx-auto max-w-xl"
          />
        </div>
        <RegionalStrongholds data={party.seatsByZone} />
      </Show>
    </section>
  );
}
