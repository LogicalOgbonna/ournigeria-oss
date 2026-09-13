import { Suspense } from "react";
import { StructuredData } from "@/app/_seo/structured-data";
import { WelcomeModalWrapper } from "@/components/civic/WelcomeModalWrapper";
import { PageLayout } from "@/components/layout/PageLayout";
import { PersonalizedData } from "@/components/sections/PersonalizedData";
import { getElectionGate } from "@/lib/election-gate";
import { buildHomeRaces, hasBallotContent } from "@/lib/home-ballot";
import { getCampaigns, toRailCandidate } from "@/lib/campaigns";
import { presidentialTickets } from "./(election)/_lib";
import { HomeHero } from "./_component/HomeHero";
import { AskHero } from "./_component/AskHero";
import { Show } from "@/components/ui/Show";

// ISR: the homepage's initial (pre-personalization) snapshot is cached and
// revalidated every 5 min instead of re-running the SSR API waterfall on every
// request. Per-user personalization stays fully live (client-side fetches in
// PersonalizedDataClient hit the DB in real time and are never cached).
//
// The hero's `?parties` / `?year` / `?party` filters are read on the client
// (see `_component/useHomeFilters`) so this page stays statically rendered.
export const revalidate = 300;

// Canonical for the site root (from main).
export const metadata = {
  alternates: { canonical: "/" },
};

/**
 * Which contests the rail offers, per `GET /api/election/gate`.
 *
 * The gate's payload IS the dropdown: every upcoming race it carries gets an
 * entry, state-scoped ones included (the homepage is national, and an
 * off-cycle governorship is national news even if only one state votes in
 * it). Candidates are real — the presidential field from `GET /api/campaigns`,
 * down-ballot fields from `GET /api/election/ballot` per scoped state.
 *
 * Gate semantics (decision C): an explicit `enabled:false` is the kill
 * switch — zero races, no hero. An UNREACHABLE gate (null) or an enabled
 * gate with nothing published falls back to the presidential race: the
 * field is live and going out, and an API blip must never blank the page.
 */
async function racesOnOffer() {
  // The gate module owns its fetch policy (Next data cache, 60s revalidate),
  // which composes with this page's 5-minute ISR window.
  const gate = await getElectionGate();
  return buildHomeRaces(gate, {
    presidential: presidentialTickets,
    // Down-ballot rails read public campaign tickets — the same source (and
    // the same poster/mate media) the presidential rail already renders.
    tickets: async (params) => (await getCampaigns(params)).map(toRailCandidate),
  });
}

export default async function Home() {
  const { races, year: electionYear, years } = await racesOnOffer();

  return (
    <PageLayout>
      <StructuredData />
      <WelcomeModalWrapper />

      {/* The hero follows the election gate. Gate ON (any race live): the
          candidates rail — races and years off the gate payload; geo-scoped
          races ship unfiltered in this ISR snapshot and HomeHero hides them
          per-viewer, client-side. Gate OFF (kill switch, decision C): the ask
          pitch takes the hero position instead — same page, different lead. */}

      <Show when={hasBallotContent(races)}>
        <Suspense fallback={<div className="h-225" />}>
          <HomeHero races={races} years={years} electionYear={electionYear} />
        </Suspense>
      </Show>

      <Show when={!hasBallotContent(races)}>
        <AskHero />
      </Show>

      <PersonalizedData heroWillMount={hasBallotContent(races)} />
    </PageLayout>
  );
}
