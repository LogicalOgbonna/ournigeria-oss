import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";

type Props = {
  lgas: any[];
  stateSlug: string;
  year?: string;
  month?: string;
};

export function LocalGovernments({ lgas, stateSlug, year, month }: Props) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold">
          Local Governments
        </h2>
        <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
          {lgas.length} LGAs
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto scrollbar-theme pr-2 pb-2">
        {lgas.map((lga: { name: string; faac: string }, i: number) => {
          const lgaUrl = year && month
            ? `/states/${stateSlug}/${lga.name.toLowerCase().replace(/\s+/g, '-')}?year=${year}&month=${month}`
            : `/states/${stateSlug}/${lga.name.toLowerCase().replace(/\s+/g, '-')}`;

          return (
          <Link
            href={lgaUrl}
            key={i}
            className="group bg-card border border-border hover:border-emerald-500/50 transition-colors rounded-[10px] p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {lga.name}
              </h3>
              <p className="font-sans text-xs text-muted-foreground">
                FAAC: <span className="font-mono">{lga.faac}</span>
              </p>
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
