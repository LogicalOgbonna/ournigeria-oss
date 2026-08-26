import { Suspense } from "react";
import { StructuredData } from "@/app/_seo/structured-data";
import { WelcomeModalWrapper } from "@/components/civic/WelcomeModalWrapper";
import { PageLayout } from "@/components/layout/PageLayout";
import { PersonalizedData } from "@/components/sections/PersonalizedData";
import { applicableRaces, getElectionGate } from "@/lib/election-gate";
import {
  MOCK_LOCATION,
  MOCK_PARTY_SLATES,
  MOCK_RACES,
  MOCK_YEARS,
} from "@/lib/mock-home-ballot";
import { AskBlock } from "./_component/AskBlock";
import { HomeHero } from "./_component/HomeHero";

// ISR: the homepage's initial (pre-personalization) snapshot is cached and
// revalidated every 5 min instead of re-running the SSR API waterfall on every
// request. Per-user personalization stays fully live (client-side fetches in
// PersonalizedDataClient hit the DB in real time and are never cached).
//
// The hero's `?parties` / `?year` / `?party` filters are read on the client
// (see `_component/useHomeFilters`) so this page stays statically rendered.
export const revalidate = 300;

/**
 * Which contests the rail offers, per the `election-gate` PostHog flag.
 *
 * The homepage is national, so races are resolved against an empty geo: a race
 * with no scope reaches every visitor, and a state-scoped one (Osun's
 * governorship, say) correctly does not.
 *
 * Falls back to the presidential race when the gate yields nothing, which today
 * it does for two independent reasons — the flag payload currently carries only
 * the Osun governorship, and local `.env.local` deliberately leaves
 * `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` unset so `getElectionGate()` fails dark.
 * The presidential race is live and going out; a blank hero would be a worse
 * failure than a stale one. Once `president` is added to the payload this
 * becomes the gate's answer rather than the fallback, with no code change.
 */
async function racesOnOffer() {
  // `getElectionGate` fetches with `cache: "no-store"`, which is right for the
  // entity pages (already dynamic) but would opt this route out of ISR and make
  // every homepage hit render on demand. Reading it on the page's own 5-minute
  // revalidate keeps `/` static; the gate's 60s in-memory cache still applies.
  const gate = await getElectionGate((url, init) =>
    fetch(url, { ...init, cache: undefined, next: { revalidate } } as RequestInit),
  );
  const live = new Set(applicableRaces(gate, {}).map((r) => r.office));
  const gated = MOCK_RACES.filter((r) => live.has(r.office as never));
  return gated.length > 0 ? gated : MOCK_RACES.filter((r) => r.office === "president");
}

export default async function Home() {
  const races = await racesOnOffer();

  return (
    <PageLayout>
      <StructuredData />
      <WelcomeModalWrapper />

      {/* The presidential field is real (see `lib/presidential-2027`); the
          down-ballot races and party slates are still fixtures. */}
      <Suspense fallback={<div className="h-225" />}>
        <HomeHero
          races={races}
          slates={MOCK_PARTY_SLATES}
          location={MOCK_LOCATION}
          years={MOCK_YEARS}
        />
      </Suspense>

      <AskBlock />
      <PersonalizedData />
    </PageLayout>
  );
}
