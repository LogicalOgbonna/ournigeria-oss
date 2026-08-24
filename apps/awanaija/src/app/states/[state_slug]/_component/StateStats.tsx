type Props = {
  profile: any;
  economy: any;
  lgaCount: number;
  year?: string;
};

export function StateStats({ profile, economy, lgaCount, year }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-heading">
          State Stats {year && `(${year})`}
        </h3>
      </div>

      <div className="bg-card border border-border rounded-[10px] divide-y divide-border">
        <div className="p-4 flex items-center justify-between">
          <span className="font-sans text-sm text-muted-foreground">Created</span>
          <span className="font-mono text-sm font-semibold text-foreground">{profile?.dateCreated || "N/A"}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="font-sans text-sm text-muted-foreground">Land Area</span>
          <span className="font-mono text-sm font-semibold text-foreground">{profile?.landAreaSqKm ? `${profile.landAreaSqKm.toLocaleString()} km²` : "N/A"}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="font-sans text-sm text-muted-foreground">LGAs</span>
          <span className="font-mono text-sm font-semibold text-foreground">{lgaCount}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="font-sans text-sm text-muted-foreground">Est. Population</span>
          <span className="font-mono text-sm font-semibold text-foreground">{economy?.population || "N/A"}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="font-sans text-sm text-muted-foreground">GDP</span>
          <span className="font-mono text-sm font-semibold text-foreground">{economy?.gdp || "N/A"}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="font-sans text-sm text-muted-foreground">Domestic Debt</span>
          <span className="font-mono text-sm font-semibold text-foreground">{economy?.domesticDebt || "N/A"}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="font-sans text-sm text-muted-foreground">External Debt</span>
          <span className="font-mono text-sm font-semibold text-foreground">{economy?.externalDebt || "N/A"}</span>
        </div>
      </div>
    </div>
  );
}
