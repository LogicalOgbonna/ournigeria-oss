"use client";

import React, { useState, useMemo, useDeferredValue } from "react";
import Link from "next/link";
import { MapPin, Filter } from "lucide-react";
import { Show } from "@/components/ui/Show";

interface StatesClientContentProps {
  statesData: { code: string; name: string; region: string; party: string; faac: string; faacDate?: string }[];
  partiesData: { acronym: string; name: string }[];
  regionsData: { code: string; name: string }[];
  bestYear?: number;
  bestMonth?: number;
}

export function StatesClientContent({ statesData, partiesData, regionsData, bestYear, bestMonth }: StatesClientContentProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedParty, setSelectedParty] = useState<string>("");

  const deferredRegion = useDeferredValue(selectedRegion);
  const deferredParty = useDeferredValue(selectedParty);

  const REGIONS = useMemo(() => {
    return regionsData.map(r => r.name).sort();
  }, [regionsData]);

  const PARTIES = useMemo(() => {
    return partiesData.map(p => p.acronym).sort();
  }, [partiesData]);

  const filteredStates = useMemo(() => {
    return statesData.filter((state) => {
      const matchRegion = deferredRegion ? state.region === deferredRegion : true;
      const matchParty = deferredParty ? state.party === deferredParty : true;
      return matchRegion && matchParty;
    });
  }, [statesData, deferredRegion, deferredParty]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1.5 shrink-0 bg-card border border-border p-1 rounded-md shadow-sm">
          <div className="flex items-center gap-1.5 pl-2 pr-1 border-r border-border/50 text-muted-foreground">
            <Filter className="w-3 h-3" />
          </div>
          
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-transparent border-none text-xs font-sans focus:ring-0 cursor-pointer text-foreground outline-none py-1 px-1.5"
          >
            <option value="">All Regions</option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
            className="bg-transparent border-none text-xs font-sans focus:ring-0 cursor-pointer text-foreground outline-none py-1 px-1.5"
          >
            <option value="">All Parties</option>
            {PARTIES.map((party) => (
              <option key={party} value={party}>
                {party}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Show when={filteredStates.length > 0}>
        {filteredStates.map((state, i) => {
          const stateUrl = bestYear && bestMonth 
            ? `/states/${state.name.toLowerCase().replace(/\s+/g, "-")}?year=${bestYear}&month=${bestMonth}`
            : `/states/${state.name.toLowerCase().replace(/\s+/g, "-")}`;
          
          return (
          <Link
            href={stateUrl}
            key={i}
            className="group bg-card border border-border hover:border-emerald-500/50 transition-colors rounded-[10px] p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
              <Show when={state.party !== "N/A"}>
                <span className="font-sans text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded bg-muted text-foreground">
                  {state.party}
                </span>
              </Show>
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {state.name}
              </h3>
              <div className="flex flex-col gap-1">
                <p className="font-sans text-xs text-muted-foreground">
                  {state.region}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="font-sans text-xs text-muted-foreground">
                    FAAC: <span className="font-mono text-foreground">{state.faac}</span>
                  </p>
                  <Show when={!!state.faacDate}>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold">
                      {state.faacDate}
                    </span>
                  </Show>
                </div>
              </div>
            </div>
          </Link>
          );
        })}
      </Show>
      <Show when={!(filteredStates.length > 0)}>
        <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground font-sans">No states found matching your filters.</p>
          <button
            onClick={() => { setSelectedRegion(""); setSelectedParty(""); }}
            className="mt-4 text-sm text-emerald-500 hover:text-emerald-400 font-medium"
          >
            Clear filters
          </button>
        </div>
      </Show>
      </section>
    </div>
  );
}