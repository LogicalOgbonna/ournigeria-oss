import Link from "next/link";
import { Leaderboard } from "@/components/civic/Leaderboard";
import { ActivityFeed } from "@/components/civic/ActivityFeed";

export function OfficialsSidebar() {
  return (
    <div className="w-full lg:w-72 shrink-0 space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Completeness
          </h3>
          <Link href="/leaderboard" className="text-xs text-emerald-600 hover:underline">
            Full list →
          </Link>
        </div>
        <Leaderboard limit={10} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Recent Activity
          </h3>
          <Link href="/activity" className="text-xs text-emerald-600 hover:underline">
            See all →
          </Link>
        </div>
        <ActivityFeed limit={5} />
      </div>
    </div>
  );
}
