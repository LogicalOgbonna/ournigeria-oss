type Props = {
  state: any;
  year?: string;
};

export function SectorAllocation({ state, year }: Props) {
  const sectorFallback = [
    { name: "Infrastructure", amount: "N/A", color: "bg-[#d97706]", percentage: 0 },
    { name: "Education", amount: "N/A", color: "bg-[#059669]", percentage: 0 },
    { name: "Health", amount: "N/A", color: "bg-[#0891b2]", percentage: 0 },
  ];
  const sectors =
    state.sectors?.length > 0
      ? [...state.sectors]
          .sort((a: { percentage: number }, b: { percentage: number }) => b.percentage - a.percentage)
          .slice(0, 3)
      : sectorFallback;

  return (
    <section className="space-y-6">
      <h2 className="font-heading text-2xl font-semibold">
        Sector Allocation
      </h2>
      <div className="bg-card border border-border rounded-[10px] p-6 space-y-6">
        <p className="font-sans text-sm text-muted-foreground">
          Top COFOG function groups by approved expenditure in the{" "}
          {year ? `${year} Approved Budget` : "Approved Budget"}
        </p>
          <div className="space-y-4">
            {sectors.map((sector: { name: string; amount: string; color: string; percentage: number }, i: number) => (
              <div key={i} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="font-sans font-medium">{sector.name}</span>
                <span className="font-mono font-semibold">
                  {sector.amount}
                </span>
              </div>
              {/* Progress bar visual */}
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${sector.color} rounded-full`}
                  style={{
                    width: `${sector.percentage}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
