import { Metadata } from "next";
import Link from "next/link";
import { Search, Filter, User, ChevronDown, ArrowLeft } from "lucide-react";
import { getOfficials, type Official } from "@/lib/api";
import { Leaderboard } from "@/components/civic/Leaderboard";
import { ActivityFeed } from "@/components/civic/ActivityFeed";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { OfficialsClientContent } from "./OfficialsClientContent";

export const metadata: Metadata = {
  title: "Nigerian Officials Directory | Our Nigeria",
  description: "Browse the directory of Nigerian government officials. Help complete their profiles with verified public information.",
  alternates: {
    canonical: "https://ournigeria.ng/officials",
  },
  openGraph: {
    title: "Nigerian Officials Directory",
    description: "Browse the directory of Nigerian government officials.",
    url: "https://ournigeria.ng/officials",
  }
};

export default async function OfficialsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; party?: string; page?: string }>;
}) {
  const { search = "", role = "", party = "", page = "1" } = await searchParams;

  const params: Record<string, string> = { page, limit: "24" };
  if (search) params.search = search;
  if (role) params.role = role;
  if (party) params.party = party;
  
  const res = await getOfficials(params);

  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)]">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-1">
                Nigerian Officials
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                {res.total.toLocaleString()} officials across all levels of government.
                Help complete their profiles.
              </p>

              <OfficialsClientContent 
                initialSearch={search} 
                initialRole={role} 
                currentPage={parseInt(page, 10)} 
                officials={res.data} 
                totalPages={res.pages} 
              />
            </div>

            {/* Sidebar: leaderboard + activity */}
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

