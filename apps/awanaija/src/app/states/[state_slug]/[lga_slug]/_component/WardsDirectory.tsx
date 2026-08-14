import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Props = {
  wards: any[];
  stateSlug: string;
  lgaSlug: string;
  lgaName: string;
};

export function WardsDirectory({ wards, stateSlug, lgaSlug, lgaName }: Props) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold">
          Wards in {lgaName}
        </h2>
        <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
          {wards.length} Wards
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {wards.map((ward: { name: string }, i: number) => (
          <Link
            href={`/states/${stateSlug}/${lgaSlug}/${ward.name.toLowerCase().split('/')[0].replace(/\s+/g, '-')}`}
            key={i}
            className="group bg-card border border-border hover:border-emerald-500/50 transition-colors rounded-[8px] p-4 flex items-center justify-between"
          >
            <span className="font-sans font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {ward.name}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </section>
  );
}
