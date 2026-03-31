"use client";

interface StatsOverlayProps {
  stats: {
    totalNodes: number;
    totalEdges: number;
    communities: number;
  };
  showing: number;
  total: number;
}

export function StatsOverlay({ stats, showing, total }: StatsOverlayProps) {
  return (
    <div className="absolute right-4 top-4 z-20 rounded-xl border border-white/20 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-3 shadow-lg">
      <div className="flex gap-4 text-center">
        <div>
          <p className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
            {stats.totalNodes.toLocaleString()}
          </p>
          <p className="text-[10px] font-sans text-slate-500 dark:text-slate-400">
            Nodes
          </p>
        </div>
        <div>
          <p className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
            {stats.totalEdges.toLocaleString()}
          </p>
          <p className="text-[10px] font-sans text-slate-500 dark:text-slate-400">
            Edges
          </p>
        </div>
        {stats.communities > 0 && (
          <div>
            <p className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
              {stats.communities}
            </p>
            <p className="text-[10px] font-sans text-slate-500 dark:text-slate-400">
              Communities
            </p>
          </div>
        )}
      </div>
      {total > showing && (
        <p className="mt-1 text-[10px] font-sans text-amber-600 dark:text-amber-400 text-center">
          Showing {showing.toLocaleString()} of {total.toLocaleString()}
        </p>
      )}
    </div>
  );
}
