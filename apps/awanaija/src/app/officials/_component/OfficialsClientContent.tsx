"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronDown, User } from "lucide-react";
import { Show } from "@/components/ui/Show";
import { OfficialGridCard } from "@/components/civic/OfficialGridCard";
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

export function OfficialsClientContent({
  initialSearch,
  initialRole,
  currentPage,
  officials,
  totalPages,
  partyLogos = {},
}: {
  initialSearch: string;
  initialRole: string;
  currentPage: number;
  officials: Official[];
  totalPages: number;
  partyLogos?: Record<string, string>;
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
        <Show when={officials.length === 0}>
          <div className="text-center py-16">
            <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              {search ? `No officials found for "${search}"` : "No officials found"}
            </p>
          </div>
        </Show>
        <Show when={officials.length > 0}>
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {officials.map((official) => (
                <OfficialGridCard key={official.id} official={official} partyLogos={partyLogos} />
              ))}
            </div>

            {/* Pagination */}
            <Show when={totalPages > 1}>
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || isPending}
                  type="button"
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
                  type="button"
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </Show>
          </>
        </Show>
      </div>
    </>
  );
}