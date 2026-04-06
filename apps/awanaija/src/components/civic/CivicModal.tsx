"use client";

import { useState } from "react";
import { X, MapPin, Trophy, Activity, ArrowLeft } from "lucide-react";
import { LocationPicker } from "./LocationPicker";
import { Leaderboard } from "./Leaderboard";
import { ActivityFeed } from "./ActivityFeed";
import { OfficialCard } from "./OfficialCard";
import { getOfficialsByLocation, type ChainEntry } from "@/lib/api";

const ROLE_ORDER = ["councilor", "lga_chairman", "mha", "rep", "representative", "senator", "governor"];

type Tab = "reps" | "leaderboard" | "activity";

export function CivicModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("reps");
  const [chain, setChain] = useState<ChainEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{
    stateCode: string;
    stateName: string;
    lgaCode?: string;
    lgaName?: string;
    wardCode?: string;
    wardName?: string;
  } | null>(null);

  async function handleLocationSelect(loc: {
    stateCode: string;
    stateName: string;
    lgaCode?: string;
    lgaName?: string;
    wardCode?: string;
    wardName?: string;
  }) {
    setLocation(loc);
    setLoading(true);
    try {
      const result = await getOfficialsByLocation({
        state: loc.stateCode,
        lga: loc.lgaCode,
        ward: loc.wardCode,
      });
      setChain(result.chain);
    } catch (err) {
      console.error("Failed to load representatives:", err);
    } finally {
      setLoading(false);
    }
  }

  const sortedChain = [...chain].sort((a, b) => {
    return ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
  });

  const knownCount = sortedChain.filter((e) => e.official).length;

  const breadcrumb = [location?.stateName, location?.lgaName, location?.wardName]
    .filter(Boolean)
    .join(" > ");

  function buildScope(scope?: Record<string, string>) {
    return {
      ...(scope || {}),
      ...(location?.stateCode ? { stateCode: scope?.stateCode || location.stateCode } : {}),
      ...(location?.stateName ? { stateName: location.stateName } : {}),
      ...(location?.lgaCode ? { lgaCode: scope?.lgaCode || location.lgaCode } : {}),
      ...(location?.lgaName ? { lgaName: location.lgaName } : {}),
      ...(location?.wardCode ? { wardCode: scope?.wardCode || location.wardCode } : {}),
      ...(location?.wardName ? { wardName: location.wardName } : {}),
    };
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95"
      >
        <MapPin className="w-5 h-5" />
        <span className="hidden sm:inline">Who Governs You?</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal panel */}
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                {location && (
                  <button
                    onClick={() => { setLocation(null); setChain([]); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                    Who Governs You?
                  </h2>
                  {location && (
                    <p className="text-sm text-slate-500 mt-0.5">{breadcrumb}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
              <TabButton active={tab === "reps"} onClick={() => setTab("reps")} icon={<MapPin className="w-4 h-4" />} label="Representatives" />
              <TabButton active={tab === "leaderboard"} onClick={() => setTab("leaderboard")} icon={<Trophy className="w-4 h-4" />} label="Leaderboard" />
              <TabButton active={tab === "activity"} onClick={() => setTab("activity")} icon={<Activity className="w-4 h-4" />} label="Activity" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {tab === "reps" && (
                <div>
                  {/* Location picker */}
                  {!location && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Select your location to see who represents you
                      </p>
                      <LocationPicker onLocationSelect={handleLocationSelect} />
                    </div>
                  )}

                  {/* Loading */}
                  {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  )}

                  {/* Chain */}
                  {!loading && chain.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-emerald-600">
                          {knownCount}/{sortedChain.length} identified
                        </p>
                        <button
                          onClick={() => { setLocation(null); setChain([]); }}
                          className="text-xs text-slate-500 hover:text-emerald-600 underline"
                        >
                          Change location
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {sortedChain.map((entry, i) => (
                          <OfficialCard
                            key={i}
                            official={entry.official}
                            position={entry.position}
                            role={entry.role}
                            scope={buildScope(entry.scope)}
                            onClick={() => setOpen(false)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty after location selected */}
                  {!loading && location && chain.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-500">No officials found for this location.</p>
                      <button
                        onClick={() => { setLocation(null); setChain([]); }}
                        className="mt-3 text-sm text-emerald-600 hover:underline"
                      >
                        Try a different location
                      </button>
                    </div>
                  )}
                </div>
              )}

              {tab === "leaderboard" && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Which states have the most complete official data?
                  </p>
                  <Leaderboard limit={37} highlightState={location?.stateCode} />
                </div>
              )}

              {tab === "activity" && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Recent contributions from citizens
                  </p>
                  <ActivityFeed limit={20} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "text-emerald-600 border-b-2 border-emerald-600"
          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
