import { OfficialMiniCard } from "./OfficialMiniCard";
import { Show } from "@/components/ui/Show";
import type { PartyDetail } from "@/lib/api";

function prettyElectionType(t: string): string {
  return t.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PrimaryWinners({
  party,
  color,
}: {
  readonly party: PartyDetail;
  readonly color: string;
}) {
  const candidates = party["candidates"] ?? [];
  return (
    <section>
      <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white">
        Flag Bearers &amp; Primary Winners
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Candidates who won {party.acronym} primaries.
      </p>
      <Show when={candidates.length === 0}>
        <p className="mt-4 text-muted-foreground">No primary winners recorded yet.</p>
      </Show>
      <Show when={candidates.length !== 0}>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {candidates.map((c, i) => (
            <OfficialMiniCard
              key={`${c.official.id}-${c.electionType}-${c.year}-${i}`}
              person={{
                id: c.official.id,
                slug: c.official.slug,
                name: c.official.name,
                imageUrl: c.official.imageUrl,
                contextLabel: `${prettyElectionType(c.electionType)} · ${c.year}${c.scopeLabel ? ` · ${c.scopeLabel}` : ""}`,
              }}
              color={color}
            />
          ))}
        </div>
      </Show>
    </section>
  );
}
