import { ActivityFeed } from "@/components/civic/ActivityFeed";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Recent Activity | OurNigeria",
  description: "See the latest contributions to Nigeria's civic data platform.",
};

export default function ActivityPage() {
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
          Recent Activity
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          See how citizens are helping build Nigeria's civic data.
        </p>

        <ActivityFeed limit={50} />
      </div>
    </main>
  );
}
