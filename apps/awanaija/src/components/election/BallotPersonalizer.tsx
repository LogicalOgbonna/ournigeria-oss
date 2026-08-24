"use client";

/**
 * BallotPersonalizer — the interactive core of the by-party candidate tracker.
 *
 * Renders the SSR'd `initialBallot` (president + governor, fetched server-side
 * for the state) immediately, then layers in down-ballot races (senate, HOR,
 * state assembly, LGA chairman, councillor) once the viewer's LGA + ward are
 * known, either from a persisted location or picked live via `LocationPicker`.
 *
 * "Selected location wins": if the persisted location points at a different
 * state than the one this page was rendered for, we redirect to that state's
 * tracker instead of silently fetching mismatched data.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePersistedLocation } from "@/hooks/usePersistedLocation";
import { LocationPicker } from "@/components/civic/LocationPicker";
import { CandidateCard } from "@/components/election/CandidateCard";
import { getElectionBallot } from "@/lib/api";
import { pivotByParty, type BallotRace, type PartySlate } from "@/lib/election-ballot";
import { partyColor } from "@/lib/partyColors";

const DOWN_BALLOT_OFFICES = ["senate", "hor", "state_assembly", "lga_chairman", "councillor"];
const FULL_OFFICE_SET = [
  "president",
  "governor",
  "senate",
  "hor",
  "state_assembly",
  "lga_chairman",
  "councillor",
];
const OFFICE_SHORT_LABEL: Record<string, string> = {
  president: "President",
  governor: "Governor",
  senate: "Senate",
  hor: "HOR",
  state_assembly: "Assembly",
  lga_chairman: "Chairman",
  councillor: "Councillor",
};

interface BallotPersonalizerProps {
  state: string;
  initialBallot: BallotRace[];
  officeYears: { office: string; year: number }[];
}

export function BallotPersonalizer({ state, initialBallot, officeYears }: BallotPersonalizerProps) {
  const router = useRouter();
  const { location, hydrated, setLocation } = usePersistedLocation();

  const [activeParty, setActiveParty] = useState<string | null>(
    () => pivotByParty(initialBallot)[0]?.acronym ?? null,
  );
  const [downBallot, setDownBallot] = useState<BallotRace[]>([]);
  const [fetching, setFetching] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const reqIdRef = useRef(0);

  const downOffices = useMemo(
    () => officeYears.filter((o) => DOWN_BALLOT_OFFICES.includes(o.office)),
    [officeYears],
  );

  // Selected-location-wins: a persisted location for a different state takes
  // priority over whatever state this page was rendered for.
  useEffect(() => {
    if (hydrated && location?.stateCode && location.stateCode !== state) {
      router.replace(`/election/${location.stateCode}`);
    }
  }, [hydrated, location?.stateCode, state, router]);

  // Down-ballot fetch, keyed on LGA + ward. Cached in sessionStorage so
  // re-visiting the same location within a tab doesn't re-fetch.
  useEffect(() => {
    if (!hydrated) return;
    if (location?.stateCode !== state) return;
    if (!location?.lgaCode || !location?.wardCode) {
      setDownBallot([]);
      return;
    }
    if (downOffices.length === 0) return;

    const cacheKey = `election-ballot:${state}:${location.lgaCode}:${location.wardCode}:${downOffices
      .map((o) => o.office + o.year)
      .join(",")}`;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setDownBallot(JSON.parse(cached) as BallotRace[]);
        return;
      }
    } catch {
      // sessionStorage unavailable/corrupt — fall through to fetch
    }

    const myId = ++reqIdRef.current;
    const controller = new AbortController();
    setFetching(true);

    getElectionBallot(
      { state, lga: location.lgaCode, ward: location.wardCode, offices: downOffices },
      { signal: controller.signal },
    )
      .then((res) => {
        if (myId !== reqIdRef.current) return;
        setDownBallot(res.races);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(res.races));
        } catch {
          // quota or storage unavailable — non-fatal
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Failed to fetch down-ballot races", err);
      })
      .finally(() => {
        if (myId === reqIdRef.current) setFetching(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, location?.lgaCode, location?.wardCode, state]);

  // Merge SSR'd initial races with any fetched down-ballot races, pivoted by
  // party. Keep a stable tab order: parties present initially keep their
  // order; parties that only show up from the down-ballot are appended.
  const orderedParties = useMemo<PartySlate[]>(() => {
    const initialOrder = pivotByParty(initialBallot).map((p) => p.acronym);
    const merged = pivotByParty([...initialBallot, ...downBallot]);
    const byAcronym = new Map(merged.map((p) => [p.acronym, p] as const));
    const ordered = initialOrder
      .map((a) => byAcronym.get(a))
      .filter((p): p is PartySlate => Boolean(p));
    const extra = merged.filter((p) => !initialOrder.includes(p.acronym));
    return [...ordered, ...extra];
  }, [initialBallot, downBallot]);

  const currentActiveParty = activeParty ?? orderedParties[0]?.acronym ?? null;
  const activeSlate = orderedParties.find((p) => p.acronym === currentActiveParty)?.slate ?? [];

  const coveredOffices = useMemo(() => new Set(activeSlate.map((item) => item.office as string)), [activeSlate]);
  const missingOffices = FULL_OFFICE_SET.filter((o) => !coveredOffices.has(o));

  const locationLabel = [location?.stateName ?? state, location?.lgaName, location?.wardName]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      {/* Location header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Your ballot</span> &middot; {locationLabel}
        </p>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
        >
          Change / use my location
        </button>
      </div>

      {showPicker && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <LocationPicker
            onLocationSelect={(loc) => {
              setLocation({ ...loc });
              setShowPicker(false);
            }}
            initialLocation={location ?? null}
          />
        </div>
      )}

      {/* Party tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {orderedParties.map((p) => {
          const isActive = p.acronym === currentActiveParty;
          const color = partyColor(p.acronym);
          return (
            <button
              key={p.acronym}
              onClick={() => setActiveParty(p.acronym)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={
                isActive
                  ? { background: color, color: "#fff" }
                  : {
                      color,
                      background: `color-mix(in srgb, ${color} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                    }
              }
            >
              {p.name}
              <span
                className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                style={
                  isActive
                    ? { background: "rgba(255,255,255,0.25)" }
                    : { background: `color-mix(in srgb, ${color} 18%, transparent)` }
                }
              >
                {p.slate.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active party's slate */}
      <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
        {activeSlate.map((item) => (
          <CandidateCard
            key={`${item.office}-${item.candidate.officialId}`}
            office={item.office}
            candidate={item.candidate}
          />
        ))}
      </div>

      {/* Not-yet-available offices for the active party */}
      {!location ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <span>Set your location to see your local races</span>
          <button
            onClick={() => setShowPicker(true)}
            className="shrink-0 text-xs font-semibold text-emerald-600 hover:underline"
          >
            Set location
          </button>
        </div>
      ) : fetching ? (
        <div className="flex gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-3">
          {DOWN_BALLOT_OFFICES.map((o) => (
            <div key={o} className="h-6 w-20 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      ) : missingOffices.length > 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {missingOffices.map((o) => OFFICE_SHORT_LABEL[o] ?? o).join(" · ")} &mdash; candidates coming soon
        </div>
      ) : null}
    </div>
  );
}
