"use client";

import { useCallback, useState } from "react";
import { Show } from "@/components/ui/Show";
import type { HomeRace } from "@/lib/mock-home-ballot";
import { CandidateRail } from "./CandidateRail";
import { HeroHeading } from "./HeroHeading";
import { LocationChip } from "./LocationChip";
import { OfficeSelect } from "./OfficeSelect";
import { RailDots } from "./RailDots";
import { useRailAutoplay } from "./useRailAutoplay";
import { YearSelect } from "./YearSelect";

/**
 * `?parties=false` — the whole ballot for one contest, as a rail of posters.
 * Figma 132:1515 (desktop) / 132:8094 (mobile).
 */
export function CandidatesHero({
  races,
  location,
  year,
  years,
  onYearChange,
  onLocationChange,
  electionYear,
}: {
  readonly races: readonly HomeRace[];
  readonly location: string;
  readonly year: number;
  readonly years: readonly number[];
  readonly onYearChange?: (year: number) => void;
  readonly onLocationChange?: () => void;
  /**
   * The cycle the posters link into. Comes from the gate's presidential race
   * via `app/page`, falling back to 2027 while the gate carries no `president`
   * race — see `racesOnOffer()`. Deliberately not the `year` filter above:
   * that one picks which contest the rail shows, and its options are still
   * fixture data.
   */
  readonly electionYear: number;
}) {
  const [office, setOffice] = useState(races[0]?.office ?? "");
  const [page, setPage] = useState(0);

  const race = races.find((r) => r.office === office) ?? races[0];

  // A page is a position the rail can reach, not a poster. The trailing posters
  // are already on screen when the rail runs out of travel, so they don't get
  // pages of their own — counting posters here would advance the dots twice
  // over a rail that cannot move. Only the rail can measure this, and only
  // after layout, so it reports upward. Poster count is the ceiling and the
  // right answer for a rail that doesn't overflow.
  const [pageCount, setPageCount] = useState(race?.candidates.length ?? 0);

  // A wider viewport fits more posters and so needs fewer pages. Clamp as the
  // new count arrives rather than reacting to it afterwards, so the rail is
  // never asked for a page that stopped existing. Stable identity: the rail
  // holds this in an effect and a ResizeObserver.
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
      className="relative mx-auto w-full max-w-7xl px-6 pt-28 lg:px-8 lg:pt-40"
    >
      <LocationChip label={location} onChange={onLocationChange} />

      <HeroHeading
        className="mt-6 lg:mt-8"
        kicker="know the running candidates"
        kickerAccent="the"
        title="Who is running?"
      />

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-10">
        <div className="flex items-center gap-2">
          <YearSelect value={year} options={years} onChange={onYearChange} />
          <OfficeSelect
            value={race?.office ?? ""}
            dropdownOptions={races.map((r) => ({ value: r.office, label: r.label }))}
            onChange={(next) => {
              setOffice(next);
              setPage(0);
            }}
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
          href={(item) => `/elections/${electionYear}/${item.party.acronym}`}
        />
      </Show>
    </section>
  );
}
