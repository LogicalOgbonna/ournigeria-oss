import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { StateOfficialsAccordion } from "@/components/civic/StateOfficialsAccordion";

type Props = {
  governor: any;
  constituencies: any;
};

export function WhoGovernsYou({ governor, constituencies }: Props) {
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

      <div className="space-y-4">
        {/* Governor Card */}
        <Link
          href={`/officials/${governor?.slug ?? governor?.id ?? 'unknown'}`}
          className="bg-card border border-border rounded-[10px] p-4 flex items-start gap-3 group hover:border-emerald-500/50 transition-colors cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
            <OfficialAvatar
              src={governor?.image}
              alt={governor?.name ?? "Governor"}
              px={48}
              imgClassName="w-full h-full object-cover"
              fallback={<Users className="w-6 h-6 text-muted-foreground" />}
            />
          </div>
          <div className="space-y-1 flex-1">
            <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Governor
            </p>
            <h3 className="font-heading text-base font-semibold leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {governor?.name || "Information Unavailable"}
            </h3>
            <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
              <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
                {governor?.party || "N/A"}
              </span>
              <span>•</span>
              <span>{governor?.term || "N/A"}</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
        </Link>

        <StateOfficialsAccordion constituencies={constituencies} />
      </div>
    </div>
  );
}
