import { getCompletenessRankings, type CompletenessEntry } from "@/lib/api";
import Link from "next/link";
import { Trophy, Medal, Award, ChevronRight } from "lucide-react";

interface LeaderboardProps {
  readonly limit?: number;
  readonly highlightState?: string;
}

export async function Leaderboard({ limit = 10, highlightState }: LeaderboardProps) {
  let rankings: CompletenessEntry[] = [];
  try {
    const data = await getCompletenessRankings();
    rankings = data.slice(0, limit);
  } catch (error) {
    console.error("Failed to load rankings:", error);
  }

  if (rankings.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 px-4">
        No completeness data yet.
      </p>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto font-mono">
      {/* Header */}
      <div className="flex items-center text-[10px] text-slate-500 uppercase tracking-wider mb-6 px-4">
        <div className="w-12">#</div>
        <div className="w-48">STATE</div>
        <div className="flex-1">COMPLETENESS</div>
        <div className="w-6"></div>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {rankings.map((entry, i) => {
          const pct = Math.round(entry.completeness * 100);
          const isHighlighted = entry.stateCode === highlightState;
          
          // Medals for top 3
          const isFirst = i === 0;
          const isSecond = i === 1;
          const isThird = i === 2;
          const isTop3 = isFirst || isSecond || isThird;
          
          // Colors based on rank
          let colorClass = "text-slate-300";
          let rankColorClass = "text-slate-500";
          let barColorClass = "bg-[#34d399]"; // default green
          
          if (isFirst) {
            colorClass = "text-amber-400 font-bold";
            rankColorClass = "text-amber-400";
            barColorClass = "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]";
          } else if (isSecond) {
            colorClass = "text-slate-300 font-bold";
            rankColorClass = "text-slate-300";
            barColorClass = "bg-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.5)]";
          } else if (isThird) {
            colorClass = "text-amber-700 font-bold";
            rankColorClass = "text-amber-700";
            barColorClass = "bg-amber-700 shadow-[0_0_10px_rgba(180,83,9,0.5)]";
          } else if (pct < 30) {
            barColorClass = "bg-rose-500/80"; // red for lagging states
          }

          return (
            <Link
              href={`/states/${entry.stateName.toLowerCase().replace(/\s+/g, '-')}`}
              key={entry.stateCode}
              className={`group flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-white/10 hover:bg-white/5 ${
                isHighlighted ? "bg-emerald-950/30 border-emerald-500/30" : ""
              } ${isTop3 ? "bg-white/[0.02]" : ""}`}
            >
              {/* Rank */}
              <div className={`w-12 text-sm flex items-center gap-2 ${rankColorClass}`}>
                {isFirst ? <Trophy className="w-4 h-4" /> : 
                 isSecond ? <Medal className="w-4 h-4" /> : 
                 isThird ? <Award className="w-4 h-4" /> : 
                 <span className="opacity-70">#{i + 1}</span>}
              </div>

              {/* State Name */}
              <div className={`w-48 flex items-center gap-3 ${colorClass}`}>
                <span className="truncate">{entry.stateName}</span>
                {pct < 30 && (
                  <span className="hidden md:inline-flex px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                    Needs Help
                  </span>
                )}
              </div>

              {/* Progress Bar & Percentage */}
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1 h-2 bg-[#1e293b] rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${barColorClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className={`w-12 text-right text-sm font-medium ${colorClass}`}>
                  {pct}%
                </div>
                <div className="w-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-200">
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
