"use client";

import { useMemo } from "react";
import { NODE_COLORS } from "./Legend";

interface GraphNode {
  id: string;
  name: string;
  type: string;
  state?: string;
  position?: string;
  connectionCount: number;
  amount?: number;
}

interface EntityListProps {
  nodes: GraphNode[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export function EntityList({ nodes, onSelect, selectedId }: EntityListProps) {
  // Group by type
  const grouped = useMemo(() => {
    const groups: Record<string, GraphNode[]> = {};
    for (const node of nodes) {
      (groups[node.type] ??= []).push(node);
    }
    // Sort each group by connection count descending
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => b.connectionCount - a.connectionCount);
    }
    return groups;
  }, [nodes]);

  const typeOrder = [
    "Official",
    "State",
    "MDA",
    "Contractor",
    "CorruptionCase",
    "Payment",
    "FAACAllocation",
    "BudgetItem",
  ];

  const sortedTypes = typeOrder.filter((t) => grouped[t]?.length);

  return (
    <div className="h-full overflow-y-auto pt-20 pb-20 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {sortedTypes.map((type) => {
          const color = NODE_COLORS[type]?.color ?? "#94a3b8";
          const label = NODE_COLORS[type]?.label ?? type;
          const typeNodes = grouped[type];

          return (
            <section key={type}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <h2 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-300">
                  {label} ({typeNodes.length})
                </h2>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {typeNodes.slice(0, 50).map((node) => (
                  <button
                    key={node.id}
                    onClick={() => onSelect(node.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(node.id);
                      }
                    }}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all min-h-[44px] ${
                      selectedId === node.id
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-700"
                    }`}
                    role="button"
                    aria-label={`${node.name}, ${label}, ${node.connectionCount} connections`}
                  >
                    <div
                      className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {node.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {[node.position, node.state].filter(Boolean).join(" · ")}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {node.connectionCount} connection
                        {node.connectionCount !== 1 ? "s" : ""}
                        {node.amount != null && (
                          <> · ₦{node.amount.toLocaleString()}</>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        {sortedTypes.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p className="font-heading text-lg">No entities found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
