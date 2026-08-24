type Props = {
  socials: any;
};

export function OfficialSocials({ socials }: Props) {
  if (!socials || !Object.values(socials).some(Boolean)) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-heading">
        Official Channels
      </h3>
      <div className="flex flex-wrap gap-2">
        {[
          { label: "X", href: socials.twitter },
          { label: "Facebook", href: socials.facebook },
          { label: "Instagram", href: socials.instagram },
          { label: "YouTube", href: socials.youtube },
          { label: "News", href: socials.news },
        ]
          .filter((s) => s.href)
          .map((s) => (
            <a
              key={s.label}
              href={s.href as string}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md border border-border bg-card text-xs font-sans hover:border-emerald-500/50 hover:text-emerald-600 transition-colors"
            >
              {s.label}
            </a>
          ))}
      </div>
    </div>
  );
}
