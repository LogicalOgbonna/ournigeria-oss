import Link from "next/link";

export function WardHero({
  stateName,
  lgaName,
  wardName,
  stateSlug,
  lgaSlug,
}: {
  stateName: string;
  lgaName: string;
  wardName: string;
  stateSlug: string;
  lgaSlug: string;
}) {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-sans text-muted-foreground flex-wrap">
          <Link href={`/states/${stateSlug}`} className="hover:text-foreground transition-colors">
            {stateName}
          </Link>
          <span>/</span>
          <Link href={`/states/${stateSlug}/${lgaSlug}`} className="hover:text-foreground transition-colors">
            {lgaName}
          </Link>
          <span>/</span>
          <span className="text-foreground">{wardName}</span>
        </div>
        <h1 className="font-serif text-5xl md:text-6xl text-foreground mt-4">
          {wardName} Ward
        </h1>
      </div>
    </section>
  );
}
