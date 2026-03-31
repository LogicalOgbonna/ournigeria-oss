"use client";

const NODE_COLORS: Record<string, { color: string; label: string }> = {
  Official: { color: "#f59e0b", label: "Official" },
  State: { color: "#10b981", label: "State" },
  MDA: { color: "#3b82f6", label: "MDA" },
  Contractor: { color: "#ef4444", label: "Contractor" },
  CorruptionCase: { color: "#8b5cf6", label: "Corruption Case" },
  Payment: { color: "#06b6d4", label: "Payment" },
  FAACAllocation: { color: "#84cc16", label: "FAAC Allocation" },
  BudgetItem: { color: "#f97316", label: "Budget Item" },
};

export { NODE_COLORS };

export function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-20 rounded-xl border border-white/20 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-3 shadow-lg">
      <p className="text-[10px] font-heading font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
        Legend
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {Object.entries(NODE_COLORS).map(([type, { color, label }]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] font-sans text-slate-600 dark:text-slate-400">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
