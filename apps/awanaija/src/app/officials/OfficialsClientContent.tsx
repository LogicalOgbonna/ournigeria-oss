"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ChevronDown, User } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cdnAvatar } from "@/lib/img";
import type { Official } from "@/lib/api";

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

function OfficialDirectoryCard({ official }: { official: Official }) {
  const [imgError, setImgError] = useState(false);
  const position = official.positions?.[0];
  const partyColor = position?.party ? PARTY_COLORS[position.party] || "#94a3b8" : "#94a3b8";
  const completeness = Math.round(official.completenessScore * 100);
  const location = position?.constituency || position?.lga || position?.state || "";
  const showImage = official.imageUrl && !imgError;

  return (
    <Link
      href={`/officials/${official.slug ?? official.id}`}
      className="flex gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all"
      style={{ borderLeftWidth: "3px", borderLeftColor: partyColor }}
    >
      {/* Photo */}
      <div className="shrink-0">
        {showImage ? (
          <SmartImage src={cdnAvatar(official.imageUrl) ?? official.imageUrl!} alt={official.name} px={56} className="w-14 h-14 rounded-lg object-cover" onError={() => setImgError(true)} />
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

export function OfficialsClientContent({
  initialSearch,
  initialRole,
  currentPage,
  officials,
  totalPages,
}: {
  initialSearch: string;
  initialRole: string;
  currentPage: number;
  officials: Official[];
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const updateUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce the URL update for search
    const timeoutId = setTimeout(() => {
      updateUrl({ search: value, page: "1" });
    }, 400);
    
    setSearchTimeout(timeoutId);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrl({ role: e.target.value, page: "1" });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: String(newPage) });
  };

  return (
    <>
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name..."
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="relative">
          <select
            value={initialRole}
            onChange={handleRoleChange}
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
      <div className={isPending ? "opacity-50 transition-opacity" : "transition-opacity"}>
        {officials.length === 0 ? (
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || isPending}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || isPending}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}