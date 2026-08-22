import Link from "next/link";
import { Landmark, Building2, Scale, ChevronRight, MapPin } from "lucide-react";
import { Show } from "@/components/ui/Show";
import type { WardConstituencies as WardConstituenciesData, WardConstituency } from "@/lib/api";

type Tier = {
  key: keyof WardConstituenciesData;
  label: string;
  /** What the seat actually is, in plain language. */
  seat: string;
  icon: typeof Landmark;
};

// Ordered widest-to-narrowest so the ward reads as nested inside each tier.
const TIERS: Tier[] = [
  { key: "senatorial", label: "Senatorial District", seat: "Senator", icon: Landmark },
  { key: "federal", label: "Federal Constituency", seat: "House of Reps member", icon: Building2 },
  { key: "state", label: "State Constituency", seat: "State Assembly member", icon: Scale },
];

function TierCard({ tier, constituency, wardName }: { tier: Tier; constituency: WardConstituency | null; wardName: string }) {
  const Icon = tier.icon;

  // Unreconciled INEC mapping — say so plainly rather than dropping the tier,
  // otherwise the page silently implies the ward has no state constituency.
  if (!constituency) {
    return (
      <div className="bg-muted/30 border border-border rounded-[10px] p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="space-y-1 min-w-0">
          <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {tier.label}
          </p>
          <p className="font-sans text-sm text-muted-foreground">
            We&apos;re still compiling which {tier.label.toLowerCase()} covers {wardName} Ward.
          </p>
        </div>
      </div>
    );
  }

  const rep = constituency.representatives[0];

  return (
    <Link
      href={`/constituencies/${constituency.code}`}
      className="group bg-card border border-border rounded-[10px] p-4 flex items-start gap-3 hover:border-emerald-500/50 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="space-y-1 flex-1 min-w-0">
        <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {tier.label}
        </p>
        <h3 className="font-heading text-base font-semibold leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {constituency.name}
        </h3>
        <Show when={!!rep}>
          <div className="text-xs font-sans text-muted-foreground space-y-1 pt-0.5">
            <p>{tier.seat}</p>
            <p className="flex items-center gap-2 flex-wrap">
              <span className="text-foreground font-medium">{rep?.name}</span>
              <Show when={!!rep?.party && rep?.party !== "N/A"}>
                <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
                  {rep?.party}
                </span>
              </Show>
            </p>
          </div>
        </Show>
        <Show when={!rep}>
          <p className="text-xs font-sans text-muted-foreground">
            No sitting {tier.seat.toLowerCase()} on record yet.
          </p>
        </Show>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0" />
    </Link>
  );
}

/**
 * The three legislative constituencies a ward votes in. Ward pages are the
 * deepest civic page we have, so this is where a citizen finds out which
 * senatorial district / federal constituency / state constituency they belong
 * to — and can jump to each of those pages.
 */
export function WardConstituencies({
  constituencies,
  wardName,
}: {
  constituencies: WardConstituenciesData | null | undefined;
  wardName: string;
}) {
  if (!constituencies) return null;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold">Which Constituencies Is This Ward In?</h2>
        <p className="font-sans text-sm text-muted-foreground flex items-start gap-2">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {wardName} Ward votes in these three constituencies. Each one elects a different
            representative.
          </span>
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => (
          <TierCard
            key={tier.key}
            tier={tier}
            constituency={constituencies[tier.key]}
            wardName={wardName}
          />
        ))}
      </div>
    </section>
  );
}
