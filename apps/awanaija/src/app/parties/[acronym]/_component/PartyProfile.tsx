"use client";

import { BackButton } from "@/components/ui/BackButton";
import { partyColor } from "@/lib/partyColors";
import { PartyIdentity } from "./PartyIdentity";
import { PartyLeadership } from "./PartyLeadership";
import { StatesGoverned } from "./StatesGoverned";
import { PrimaryWinners } from "./PrimaryWinners";
import { PartySidebar } from "./PartySidebar";
import type { PartyDetail } from "@/lib/api";

export function PartyProfile({ party }: { readonly party: PartyDetail }) {
  const color = partyColor(party.acronym, party.color);

  return (
    <main className="container mx-auto max-w-6xl flex-1 px-4 pb-20 pt-24">
      <BackButton fallbackHref="/parties" fallbackLabel="Parties" className="mb-8" />

      <div className="flex flex-col gap-10 lg:flex-row">
        {/* ---------- LEFT: the party's story ---------- */}
        <div className="min-w-0 flex-1 space-y-12">
          <PartyIdentity party={party} color={color} />
          <PartyLeadership party={party} />
          <StatesGoverned party={party} color={color} />
          <PrimaryWinners party={party} color={color} />
        </div>

        {/* ---------- RIGHT: elected officials by position ---------- */}
        <PartySidebar party={party} />
      </div>
    </main>
  );
}
