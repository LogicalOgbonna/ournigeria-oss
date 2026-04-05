import { Leaderboard } from "@/components/civic/Leaderboard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "State Completeness Leaderboard | OurNigeria",
  description: "See which Nigerian states have the most complete official data. Help fill the gaps.",
};

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)]">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-1">
          State Completeness
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Which states have the most complete official data? Help your state climb the ranks.
        </p>

        <Leaderboard limit={37} />
      </div>
    </main>
  );
}
