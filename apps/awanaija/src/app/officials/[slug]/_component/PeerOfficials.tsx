import type { ChainEntry, Official } from "@/lib/api";
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
  // ChainEntry.official is nullable (vacant seats in the raw by-location chain);
  // filter here so the component is safe even if a caller skips getPeers's filter.
  const filled = peers.filter(
    (entry): entry is ChainEntry & { official: Official } => entry.official !== null,
  );
  if (!filled.length) return null;

  return (
    <section data-testid="peer-officials" className="mt-10">
      <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-ink-bright mb-4">
        Other representatives for {areaLabel}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filled.map((entry) => (
          <OfficialGridCard
            key={entry.official.id}
            official={entry.official}
            position={entry.position}
            role={entry.role}
            partyLogos={partyLogos}
          />
        ))}
      </div>
    </section>
  );
}
