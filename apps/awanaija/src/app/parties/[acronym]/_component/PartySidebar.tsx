import { PartyOfficeholdersAccordion } from "@/components/civic/PartyOfficeholdersAccordion";
import { SeatShareBand } from "./SeatShareBand";
import type { PartyDetail } from "@/lib/api";

export function PartySidebar({ party }: { readonly party: PartyDetail }) {
  const byRole = party.footprint?.byRole ?? {};
  return (
    <div className="w-full shrink-0 lg:w-80">
      <div className="lg:sticky lg:top-24">
        <SeatShareBand share={party.seatShare} />
        <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Elected officials
        </h2>
        <PartyOfficeholdersAccordion acronym={party.acronym} byRole={byRole} />
      </div>
    </div>
  );
}
