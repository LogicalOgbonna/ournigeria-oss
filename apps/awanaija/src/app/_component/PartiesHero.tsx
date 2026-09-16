"use client";

import { CandidateTicket, type TicketParty, type TicketPerson } from "@/components/civic/CandidateTicket";
import type { HomePartySlate } from "@/lib/home-ballot";
import { VoteHeading } from "./VoteHeading";
import { HeroLocationSlot } from "./HeroLocationSlot";
import { OfficeSelect } from "./OfficeSelect";
import { PartyPill } from "./PartyPill";
import { PartySlatePanel } from "./PartySlatePanel";
import { YearSelect } from "./YearSelect";

/**
 * `?parties=true` — one party's slate for this location: the presidential
 * ticket large on the left, everyone else on the right.
 * Figma 132:6494 (desktop) / 132:9078 (mobile — same two columns, not stacked).
 */
export function PartiesHero({
  slate,
  parties,
  year,
  years,
  onPartyChange,
  onYearChange,
}: {
  readonly slate: HomePartySlate;
  readonly parties: readonly TicketParty[];
  readonly year: number;
  readonly years: readonly number[];
  readonly onPartyChange?: (acronym: string) => void;
  readonly onYearChange?: (year: number) => void;
}) {
  const { candidate, mate, party } = slate.featured;

  return (
    <section className="relative mx-auto w-full max-w-7xl px-6 pt-28 lg:px-8 lg:pt-28">
      <VoteHeading className="text-center lg:text-left" />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 lg:mt-10">
        <PartyPill party={slate.party} options={parties} onChange={onPartyChange} />
        <HeroLocationSlot className="min-h-[50px] basis-full lg:basis-auto" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
        <YearSelect
          value={year}
          options={years}
          onChange={onYearChange}
          suffix="elections tailored to your location"
        />
        {/* No dropdownOptions — the same control renders as plain text here. */}
        <OfficeSelect
          value={`The following candidates are running under the ${slate.party.acronym} party.`}
        />
      </div>

      {/* Desktop: the left column is Figma's 436px panel — exactly the 404px
          ticket plus its padding — and the slate takes the rest. (Figma draws
          the right panel at 838px but only fills 529 of it; filling it is the
          sane reading.) Mobile keeps two columns — 132:9078 does not stack. */}
      <div className="mt-5 grid grid-cols-[41fr_53fr] gap-[10px] lg:mt-8 lg:grid-cols-[436px_minmax(0,1fr)] lg:gap-[28px]">
        <div className="rounded-[14px] border border-border bg-card/40 p-2 lg:p-4">
          <CandidateTicket
            size="hero"
            candidate={candidate}
            mate={mate}
            party={party}
          />
          <div className="mt-3 lg:mt-5">
            <TicketByline person={candidate} fallbackOffice="President" />
            {mate ? (
              <TicketByline person={mate} fallbackOffice="Vice President" className="mt-1" />
            ) : null}
          </div>
        </div>

        <div className="rounded-[14px] border border-border bg-card/40 p-2 lg:p-6">
          <PartySlatePanel rows={slate.rows} />
        </div>
      </div>
    </section>
  );
}

/** Name + office beneath the featured ticket — Figma 132:7189 / 132:7191. */
function TicketByline({
  person,
  fallbackOffice,
  className,
}: {
  readonly person: TicketPerson;
  readonly fallbackOffice: string;
  readonly className?: string;
}) {
  return (
    <div className={className}>
      <p className="break-words font-sans text-[10px] font-bold leading-[13px] text-emerald-600 dark:text-emerald-400 lg:text-[14px] lg:leading-[22px]">
        {person.name}
      </p>
      <p className="font-sans text-[9px] leading-[12px] text-muted-foreground lg:text-[14px] lg:leading-[21px]">
        {person.office ?? fallbackOffice}
      </p>
    </div>
  );
}
