import Link from "next/link";
import { User } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import type { PartyOfficerView } from "@/lib/api";

const OFFICER_ROLE_LABELS: Record<string, string> = {
  national_chairman: "National Chairman",
  national_secretary: "National Secretary",
  party_leader: "Party Leader",
};

export function OfficerCard({ officer }: { readonly officer: PartyOfficerView }) {
  const inner = (
    <>
      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
        <OfficialAvatar
          src={officer.imageUrl}
          alt={officer.name}
          px={56}
          imgClassName="w-14 h-14 rounded-full object-cover"
          fallback={<User className="h-6 w-6 text-slate-400" />}
        />
      </div>
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{officer.name}</div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {OFFICER_ROLE_LABELS[officer.role] ?? officer.role}
        </div>
      </div>
    </>
  );

  // Link to the officer's official profile when we have one; otherwise static.
  if (officer.officialSlug) {
    return (
      <Link
        href={`/officials/${officer.officialSlug}`}
        className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-4 transition-all hover:border-emerald-400 hover:shadow-sm"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-4">
      {inner}
    </div>
  );
}
