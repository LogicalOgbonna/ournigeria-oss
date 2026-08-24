import { Leaderboard } from "@/components/civic/Leaderboard";
import Link from "next/link";
import { PageLayout } from "@/components/layout/PageLayout";

export const metadata = {
  title: "State Completeness Leaderboard | OurNigeria",
  description: "See which Nigerian states have the most complete official data. Help fill the gaps.",
};

export default function LeaderboardPage() {
  return (
    <PageLayout className="bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 pt-32 pb-12 relative z-10">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-4 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Civic Data
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white font-heading mb-4 tracking-tight">
              State Completeness <span className="text-emerald-400">Leaderboard</span>
            </h1>
            <p className="text-base text-slate-400 leading-relaxed">
              We are tracking how many government officials have been identified by citizens across Nigeria. 
              Is your state lagging behind? Step up, find your local leaders, and help your state climb the ranks.
            </p>
          </div>
          
          <Link 
            href="/states"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            Find Your State
          </Link>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-2xl">
          <Leaderboard limit={37} />
        </div>
      </div>
    </PageLayout>
  );
}
