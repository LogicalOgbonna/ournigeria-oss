import type { ChainEntry } from "@/lib/api";
import { OfficialGridCard } from "@/components/civic/OfficialGridCard";

export function PeerOfficials({
  peers,
  areaLabel,
  partyLogos = {},
}: {
  peers: ChainEntry[];
  areaLabel: string;
  partyLogos?: Record<string, string>;
}) {
  return (
    <section data-testid="peer-officials" className="mt-10">
      <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-[#e5e2e1] mb-4">
        Other representatives for {areaLabel}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {peers.map((entry) => (
          <OfficialGridCard
            key={entry.official!.id}
            official={entry.official!}
            position={entry.position}
            partyLogos={partyLogos}
          />
        ))}
      </div>
    </section>
  );
}
