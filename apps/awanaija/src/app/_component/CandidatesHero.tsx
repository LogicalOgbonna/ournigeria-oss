"use client";

import { useCallback, useEffect, useState } from "react";
import { Show } from "@/components/ui/Show";
import type { HomeRace } from "@/lib/home-ballot";
import { CandidateRail } from "./CandidateRail";
import { VoteHeading } from "./VoteHeading";
import { HeroLocationSlot } from "./HeroLocationSlot";
import { OfficeSelect } from "./OfficeSelect";
import { RailDots } from "./RailDots";
import { useRailAutoplay } from "./useRailAutoplay";
// import { YearSelect } from "./YearSelect";

export function CandidatesHero({
  races,
  raceId,
  onRaceChange,
  // year,
  // years,
  // onYearChange,
  electionYear,
}: {
  readonly races: readonly HomeRace[];
  /** Selected race id from the URL (`?race=`), null = first race on offer. */
  readonly raceId: string | null;
  readonly onRaceChange: (id: string) => void;
  // readonly year: number;
  // readonly years: readonly number[];
  // readonly onYearChange?: (year: number) => void;
  readonly electionYear: number;
}) {
  const [page, setPage] = useState(0);

  // Keyed on race id, not office — two governorships in different states are
  // different contests. The id lives in the URL (useHomeFilters) so the pick
  // survives a reload; an id that no longer resolves (gate changed, viewer
  // moved out of a scoped race's geo) falls back to the first race on offer.
  const race = races.find((r) => r.id === raceId) ?? races[0];

  // A selection change from ANY source (dropdown, back/forward, geo fallback)
  // starts the rail from its first page.
  useEffect(() => setPage(0), [race?.id]);

  const [pageCount, setPageCount] = useState(race?.candidates.length ?? 0);
  
  const handlePageCount = useCallback((count: number) => {
    setPageCount(count);
    setPage((current) =>
      count > 0 && current > count - 1 ? count - 1 : current,
    );
  }, []);

  // Advances the rail on its own. Pauses while focus is anywhere in the hero,
  // but not on hover; any deliberate interaction below stops it for good.
  const autoplay = useRailAutoplay({
    count: pageCount,
    page,
    onAdvance: setPage,
  });

  return (
    <section
      {...autoplay.handlers}
      className="relative mx-auto w-full max-w-7xl px-6 pt-28 lg:px-8 lg:pt-28"
    >
      {/* "You are viewing … [Change] [Month]" — the real row, portalled here
          from PersonalizedDataClient (see HeroLocationSlot). */}
      <HeroLocationSlot />

      <VoteHeading className="mt-6 lg:mt-4" />

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-10">
        <div className="flex items-center gap-2">
          {/* <YearSelect value={year} options={years} onChange={onYearChange} /> */}
          <OfficeSelect
            value={race?.id ?? ""}
            dropdownOptions={races.map((r) => ({ value: r.id, label: r.label }))}
            onChange={onRaceChange}
          />
        </div>

        <RailDots
          count={pageCount}
          active={page}
          onSelect={(i) => {
            autoplay.stop();
            setPage(i);
          }}
        />
      </div>

      <Show when={Boolean(race)}>
        <CandidateRail
          className="mt-6 lg:mt-8"
          items={race?.candidates ?? []}
          page={page}
          onPageChange={(next) => {
            autoplay.stop();
            setPage(next);
          }}
          onPageCountChange={handlePageCount}
          partyHref={(acronym) => `/?parties=true&party=${acronym}`}
          // Each poster opens its own ticket page (keyed on the ticket slug —
          // a party can field rival slates) for the cycle the gate says is live,
          // not the `year` filter above, which the picker can set to a cycle we
          // have no content for. Only the presidential race is real data; the
          // down-ballot fixtures carry synthetic ids (g1, s2…) that no route
          // resolves, so those posters are not links.
          href={(item) =>
            race?.office === "president" ? `/elections/${electionYear}/${item.id}` : undefined
          }
        />
      </Show>
    </section>
  );
}
