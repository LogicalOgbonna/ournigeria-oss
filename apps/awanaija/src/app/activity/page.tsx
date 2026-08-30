import { ActivityFeed } from "@/components/civic/ActivityFeed";
import { PageLayout } from "@/components/layout/PageLayout";

export const metadata = {
  title: "Recent Activity | OurNigeria",
  description: "See the latest contributions to Nigeria's civic data platform.",
  alternates: { canonical: "/activity" },
};

export default function ActivityPage() {
  return (
    <PageLayout className="bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)]" mainClassName="pt-24">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-1">
            Recent Activity
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            See how citizens are helping build Nigeria&apos;s civic data.
          </p>

          <ActivityFeed limit={50} />
        </div>
    </PageLayout>
  );
}
