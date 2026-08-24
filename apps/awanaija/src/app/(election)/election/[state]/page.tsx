import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HomeContent } from "@/components/pages/HomeContent";
import { getElectionGate } from "@/lib/election-gate";
import { officeYearsForState } from "@/lib/election-ballot";
import { getElectionBallot } from "@/lib/api";
import type { BallotRace } from "@/lib/election-ballot";

export const revalidate = 300;

// Internal variant reached only via a proxy rewrite — never index it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

type Props = { params: Promise<{ state: string }> };

export default async function ElectionStatePage({ params }: Props) {
  const { state } = await params;
  const gate = await getElectionGate();
  const officeYears = officeYearsForState(gate, state, new Date());
  if (officeYears.length === 0) redirect("/"); // not lit / invalid state

  const stateLevel = officeYears.filter((o) => o.office === "president" || o.office === "governor");
  let races: BallotRace[] = [];
  try {
    ({ races } = await getElectionBallot({ state, offices: stateLevel }, { next: { revalidate: 300 } } as RequestInit));
  } catch {
    races = []; // ballot endpoint down — render tracker with empty state-level (client can still personalize)
  }

  return (
    <HomeContent
      electionActive
      electionState={state}
      initialBallot={races}
      officeYears={officeYears}
    />
  );
}
