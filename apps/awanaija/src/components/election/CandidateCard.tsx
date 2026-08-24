import Link from "next/link";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { partyColor } from "@/lib/partyColors";
import type { BallotCandidate } from "@/lib/election-ballot";

const OFFICE_LABEL: Record<string, string> = {
  president: "PRESIDENT",
  governor: "GOVERNOR",
  senate: "SENATE",
  hor: "HOUSE OF REPS",
  state_assembly: "STATE ASSEMBLY",
  lga_chairman: "LGA CHAIRMAN",
  councillor: "COUNCILLOR",
};

export function CandidateCard({ office, candidate }: { office: string; candidate: BallotCandidate }) {
  const color = partyColor(candidate.partyAcronym);
  const inner = (
    <div className="w-64 shrink-0 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold"
        style={{ color }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {candidate.partyAcronym ?? "IND"}
      </span>
      <div className="my-3 grid place-items-center">
        <OfficialAvatar
          src={candidate.imageUrl}
          alt={candidate.name}
          px={96}
          imgClassName="h-24 w-24 rounded-2xl object-cover"
          initial={candidate.name.charAt(0).toUpperCase()}
          initialClassName="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted text-2xl font-bold text-muted-foreground"
        />
      </div>
      <p className="text-lg font-bold">{candidate.name}</p>
      <p className="text-sm text-muted-foreground">{candidate.partyName ?? candidate.partyAcronym}</p>
      <p className="mt-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wide text-primary">
        For {OFFICE_LABEL[office] ?? office}
      </p>
      {candidate.slug && <p className="mt-2 text-xs font-semibold text-emerald-600">See their record →</p>}
    </div>
  );
  return candidate.slug ? (
    <Link href={`/officials/${candidate.slug}`} aria-label={`See ${candidate.name}'s record`}>
      {inner}
    </Link>
  ) : (
    inner
  );
}
