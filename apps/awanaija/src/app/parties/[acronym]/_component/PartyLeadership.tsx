import { OfficerCard } from "./OfficerCard";
import type { PartyDetail, PartyOfficerView } from "@/lib/api";

const OFFICER_ORDER = ["national_chairman", "national_secretary", "party_leader"];

function orderedOfficers(officers: PartyOfficerView[]): PartyOfficerView[] {
  return [...officers].sort(
    (a, b) =>
      (OFFICER_ORDER.indexOf(a.role) + 1 || 99) - (OFFICER_ORDER.indexOf(b.role) + 1 || 99),
  );
}

export function PartyLeadership({ party }: { readonly party: PartyDetail }) {
  const officers = orderedOfficers(party["officers"] ?? []);
  if (officers.length === 0) return null;
  return (
    <section>
      <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white">
        Party leadership
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {officers.map((o) => (
          <OfficerCard key={o.role} officer={o} />
        ))}
      </div>
    </section>
  );
}
