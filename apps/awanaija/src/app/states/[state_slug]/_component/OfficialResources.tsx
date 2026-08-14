import { ChevronRight } from "lucide-react";

type Props = {
  links: any;
};

export function OfficialResources({ links }: Props) {
  if (!links || !Object.values(links).some(Boolean)) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-heading">
        Official Resources
      </h3>
      <div className="bg-card border border-border rounded-[10px] divide-y divide-border">
        {[
          { label: "State Government", href: links.official },
          { label: "Ministry of Finance", href: links.financeMinistry },
          { label: "House of Assembly", href: links.assembly },
          { label: "State Electoral Commission", href: links.stateElectoral },
          { label: "INEC (Electoral)", href: links.inec },
        ]
          .filter((l) => l.href)
          .map((l) => (
            <a
              key={l.label}
              href={l.href as string}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 flex items-center justify-between group hover:bg-muted/50 transition-colors"
            >
              <span className="font-sans text-sm text-foreground">{l.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
            </a>
          ))}
      </div>
    </div>
  );
}
