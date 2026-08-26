"use client";

import { useState } from "react";
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
}: {
  readonly races: readonly HomeRace[];
  readonly location: string;
  readonly year: number;
  readonly years: readonly number[];
  readonly onYearChange?: (year: number) => void;
  readonly onLocationChange?: () => void;
}) {
  const [office, setOffice] = useState(races[0]?.office ?? "");
  const [page, setPage] = useState(0);

  const race = races.find((r) => r.office === office) ?? races[0];

  // Advances the rail on its own. Pauses on hover/focus anywhere in the hero;
  // any deliberate interaction below stops it for good.
  const autoplay = useRailAutoplay({
    count: race?.candidates.length ?? 0,
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
          count={race?.candidates.length ?? 0}
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
          partyHref={(acronym) => `/?parties=true&party=${acronym}`}
          href={() => "/election"}
        />
      </Show>
    </section>
  );
}
