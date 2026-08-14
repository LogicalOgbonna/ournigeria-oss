/**
 * CandidateTracker — server-rendered shell for the by-party candidate tracker.
 *
 * Renders the static header, then `BallotPersonalizer` (a client component)
 * whose first render is seeded with `initialBallot` (president + governor,
 * fetched server-side), so those tabs are already in the initial HTML — no
 * flash of empty state while the client hydrates.
 */

import { BallotPersonalizer } from "@/components/election/BallotPersonalizer";
import type { BallotRace } from "@/lib/election-ballot";

interface CandidateTrackerProps {
  state: string;
  initialBallot: BallotRace[];
  officeYears: { office: string; year: number }[];
}

export function CandidateTracker({ state, initialBallot, officeYears }: CandidateTrackerProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32">
      <div className="mb-10 max-w-2xl">
        <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
          Know who&apos;s running,{" "}
          <span
            className="italic"
            style={{
              fontFamily: "var(--font-serif)",
              background: "linear-gradient(90deg,#047857,#059669,#6ee7b7)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            before you vote.
          </span>
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          Every candidate, every party. Pick a party to see their full slate for you.
        </p>
      </div>

      <BallotPersonalizer state={state} initialBallot={initialBallot} officeYears={officeYears} />
    </section>
  );
}
