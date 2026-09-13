"use client";

import { useMemo } from "react";
import { Show } from "@/components/ui/Show";
import { buildPartySlates, hasBallotContent, racesForViewer, type HomeRace } from "@/lib/home-ballot";
import { usePersistedLocation } from "@/hooks/usePersistedLocation";
import { AskHero } from "./AskHero";
import { CandidatesHero } from "./CandidatesHero";
import { HeroBackdrop } from "./HeroBackdrop";
import { PartiesHero } from "./PartiesHero";
import { useHomeFilters } from "./useHomeFilters";

/**
 * Picks the hero the URL asks for and hands it its data. The only stateful
 * piece of the homepage — everything below it is presentational.
 *
 * `races` arrive unfiltered (the page is one ISR snapshot for every visitor);
 * geo-scoped races are hidden here, client-side, unless they cover the
 * viewer's persisted location — an Adamawa viewer never sees the Osun
 * governorship, an Osun viewer sees it appear the moment their location
 * hydrates or changes. The party slates pivot from the same visible races,
 * so the parties view respects the viewer's ballot too.
 */
export function HomeHero({
  races,
  years,
  electionYear,
}: {
  readonly races: readonly HomeRace[];
  readonly years: readonly number[];
  /** The cycle the posters link into — see `racesOnOffer()` in `app/page`. */
  readonly electionYear: number;
}) {
  const { location } = usePersistedLocation();
  const visibleRaces = useMemo(
    () => racesForViewer(races, { stateCode: location?.stateCode, lgaCode: location?.lgaCode }),
    [races, location?.stateCode, location?.lgaCode],
  );
  const slates = useMemo(() => buildPartySlates(visibleRaces), [visibleRaces]);

  const filters = useHomeFilters({
    defaultYear: years[0] ?? new Date().getFullYear(),
    defaultParty: slates[0]?.party.acronym ?? "",
  });

  const slate = slates.find((s) => s.party.acronym === filters.party) ?? slates[0];

  // The server picks this hero when SOME viewer has ballot content, but THIS
  // viewer's geo filter can still leave only candidate-less races (e.g. the
  // gate carries one state's race and the presidential field is empty) — an
  // election hero with zero cards reads as broken, so they get the pitch.
  if (!hasBallotContent(visibleRaces)) return <AskHero withLocationSlot />;

  return (
    <div className="relative">
      <HeroBackdrop />

      <Show when={!filters.parties}>
        <CandidatesHero
          races={visibleRaces}
          raceId={filters.race}
          onRaceChange={filters.setRace}
          // year={filters.year}
          // years={years}
          // onYearChange={filters.setYear}
          electionYear={electionYear}
        />
      </Show>

      <Show when={filters.parties && Boolean(slate)}>
        <PartiesHero
          slate={slate}
          parties={slates.map((s) => s.party)}
          year={filters.year}
          years={years}
          onPartyChange={filters.setParty}
          onYearChange={filters.setYear}
        />
      </Show>
    </div>
  );
}
