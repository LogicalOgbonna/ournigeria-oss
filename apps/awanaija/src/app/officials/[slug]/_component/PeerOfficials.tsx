import type { ChainEntry } from "@/lib/api";
import { OfficialCard } from "@/components/civic/OfficialCard";

export function PeerOfficials({
  peers,
  areaLabel,
}: {
  peers: ChainEntry[];
  areaLabel: string;
}) {
  return (
    <section data-testid="peer-officials" className="mt-10">
      <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white mb-4">
        Other representatives for {areaLabel}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {peers.map((entry) => (
          <OfficialCard
            key={entry.official!.id}
            official={entry.official}
            position={entry.position}
            role={entry.role}
            showProposals={false}
          />
        ))}
      </div>
    </section>
  );
}
