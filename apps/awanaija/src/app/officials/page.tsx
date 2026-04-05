"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, User, ChevronDown, ArrowLeft } from "lucide-react";
import { getOfficials, type Official } from "@/lib/api";
import { Leaderboard } from "@/components/civic/Leaderboard";
import { ActivityFeed } from "@/components/civic/ActivityFeed";

const ROLES = [
  { value: "", label: "All Roles" },
  { value: "governor", label: "Governors" },
  { value: "senator", label: "Senators" },
  { value: "rep", label: "Federal Reps" },
  { value: "mha", label: "State House Members" },
  { value: "lga_chairman", label: "LGA Chairmen" },
  { value: "councilor", label: "Councilors" },
];

const PARTY_COLORS: Record<string, string> = {
  APC: "#059669",
  PDP: "#ef4444",
  LP: "#0891b2",
  NNPP: "#d97706",
  APGA: "#65a30d",
  YPP: "#7c3aed",
  SDP: "#e11d48",
  ADC: "#0284c7",
};

export default function OfficialsDirectoryPage() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "24" };
      if (search) params.search = search;
      if (role) params.role = role;
      const res = await getOfficials(params);
      setOfficials(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      console.error("Failed to load officials:", err);
    } finally {
      setLoading(false);
    }
  }, [search, role, page]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, role]);

  return (
    <main className="min-h-screen bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)]">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-1">
              Nigerian Officials
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {total.toLocaleString()} officials across all levels of government.
              Help complete their profiles.
            </p>

            {/* Search + filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="appearance-none w-full sm:w-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Officials grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : officials.length === 0 ? (
              <div className="text-center py-16">
                <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  {search ? `No officials found for "${search}"` : "No officials found"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {officials.map((official) => (
                    <OfficialDirectoryCard key={official.id} official={official} />
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-500">
                      Page {page} of {pages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
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
  );
}

function OfficialDirectoryCard({ official }: { official: Official }) {
  const [imgError, setImgError] = useState(false);
  const position = official.positions?.[0];
  const partyColor = position?.party ? PARTY_COLORS[position.party] || "#94a3b8" : "#94a3b8";
  const completeness = Math.round(official.completenessScore * 100);
  const location = position?.constituency || position?.lga || position?.state || "";
  const showImage = official.imageUrl && !imgError;

  return (
    <Link
      href={`/officials/${official.id}`}
      className="flex gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all"
      style={{ borderLeftWidth: "3px", borderLeftColor: partyColor }}
    >
      {/* Photo */}
      <div className="shrink-0">
        {showImage ? (
          <img src={official.imageUrl!} alt={official.name} className="w-14 h-14 rounded-lg object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <User className="w-6 h-6 text-slate-300 dark:text-slate-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
          {official.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          {position?.role || "Official"}
          {location && ` · ${location}`}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {position?.party && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: partyColor }}
            >
              {position.party}
            </span>
          )}
          {/* Completeness bar */}
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400">{completeness}%</span>
        </div>
      </div>
    </Link>
  );
}
