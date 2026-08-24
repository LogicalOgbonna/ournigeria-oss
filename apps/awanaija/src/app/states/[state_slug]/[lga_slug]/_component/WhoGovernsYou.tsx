import Link from "next/link";
import { Users, ChevronRight, AlertCircle } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { LgaOfficialsAccordion } from "@/components/civic/LgaOfficialsAccordion";
import { Show } from "@/components/ui/Show";

type Props = {
  lga: any;
};

export function WhoGovernsYou({ lga }: Props) {
  const { stateName, name: lgaName, chairman, senator, houseMembers, stateAssemblyMembers, councilors, wards } = lga;

  const renderOfficialCard = (official: any, roleLabel: string, subLabel?: string) => {
    if (!official) return null;
    return (
      <Link
        key={official.id}
        href={`/officials/${official.slug ?? official.id}`}
        className="bg-card border border-border rounded-[10px] p-4 flex items-start gap-3 group hover:border-emerald-500/50 transition-colors cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
          <OfficialAvatar
            src={official.image}
            alt={official.name}
            px={48}
            imgClassName="w-full h-full object-cover"
            fallback={<Users className="w-6 h-6 text-muted-foreground" />}
          />
        </div>
        <div className="space-y-1 flex-1">
          <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {roleLabel}
          </p>
          <h3 className="font-heading text-base font-semibold leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {official.name || "Information Unavailable"}
          </h3>
          <Show when={!!official.proposed}>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-3 h-3" />
              Proposed · unverified
            </span>
          </Show>
          <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
              {official.party || "N/A"}
            </span>
            <Show when={!!subLabel}>
              <>
                <span>•</span>
                <span className="truncate max-w-[120px]" title={subLabel}>{subLabel}</span>
              </>
            </Show>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-heading">
          Who Governs You?
        </h3>
        <Link href="/officials" className="text-xs text-emerald-600 hover:underline">
          See all →
        </Link>
      </div>

      {/* Chairman Card */}
      {chairman ? renderOfficialCard(chairman, "LGA Chairman", chairman.term) : (
        <Link
          href={`/proposals/new?role=lga_chairman&stateCode=${lga.stateCode || ""}&lgaCode=${lga.code}&stateName=${encodeURIComponent(stateName)}&lgaName=${encodeURIComponent(lgaName)}`}
          className="block bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-[10px] p-4 flex items-start gap-3 group hover:border-amber-400 dark:hover:border-amber-700 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-amber-500" />
          </div>
          <div className="space-y-1 flex-1">
            <p className="font-heading text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
              LGA Chairman
            </p>
            <h3 className="font-heading text-base font-semibold leading-tight text-foreground">
              Help identify this person
            </h3>
            <p className="font-sans text-xs text-amber-700 dark:text-amber-400 font-medium">
              We don&apos;t know who holds this seat yet →
            </p>
          </div>
        </Link>
      )}

      {/* Senator */}
      {senator && renderOfficialCard(senator, "Senator", senator.constituency)}

      {/* House of Reps */}
      {houseMembers?.map((member: any) =>
        renderOfficialCard(member, "House of Reps", member.constituency)
      )}

      {/* State Assembly */}
      {stateAssemblyMembers?.map((member: any) =>
        renderOfficialCard(member, "State Assembly", member.constituency)
      )}

      {/* Legislature Summary */}
      <LgaOfficialsAccordion
        councilors={councilors || []}
        wardCount={wards.length}
        wards={wards || []}
        lgaCode={lga.code}
        lgaName={lgaName}
        stateCode={lga.stateCode || ""}
        stateName={stateName}
      />
    </div>
  );
}
