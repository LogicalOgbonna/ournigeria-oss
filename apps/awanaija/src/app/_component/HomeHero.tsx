"use client";

import { Show } from "@/components/ui/Show";
import type { HomePartySlate, HomeRace } from "@/lib/mock-home-ballot";
import { CandidatesHero } from "./CandidatesHero";
import { HeroBackdrop } from "./HeroBackdrop";
import { PartiesHero } from "./PartiesHero";
import { useHomeFilters } from "./useHomeFilters";

/**
 * Picks the hero the URL asks for and hands it its data. The only stateful
 * piece of the homepage — everything below it is presentational.
 */
export function HomeHero({
  races,
  slates,
  location,
  years,
  electionYear,
}: {
  readonly races: readonly HomeRace[];
  /** One per party; `?party=` picks which. The first is the default. */
  readonly slates: readonly HomePartySlate[];
  readonly location: string;
  readonly years: readonly number[];
  /** The cycle the posters link into — see `racesOnOffer()` in `app/page`. */
  readonly electionYear: number;
}) {
  const filters = useHomeFilters({
    defaultYear: years[0] ?? new Date().getFullYear(),
    defaultParty: slates[0]?.party.acronym ?? "",
  });

  const slate = slates.find((s) => s.party.acronym === filters.party) ?? slates[0];

  return (
    <div className="relative">
      <HeroBackdrop />

      <Show when={!filters.parties}>
        <CandidatesHero
          races={races}
          location={location}
          year={filters.year}
          years={years}
          onYearChange={filters.setYear}
          electionYear={electionYear}
        />
      </Show>

      <Show when={filters.parties && Boolean(slate)}>
        <PartiesHero
          slate={slate}
          parties={slates.map((s) => s.party)}
          location={location}
          year={filters.year}
          years={years}
          onPartyChange={filters.setParty}
          onYearChange={filters.setYear}
        />
      </Show>
    </div>
  );
}
