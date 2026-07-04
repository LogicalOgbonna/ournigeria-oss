"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Trophy, Activity, ArrowLeft } from "lucide-react";
import { LocationPicker } from "./LocationPicker";
import { Leaderboard } from "./Leaderboard";
import { ActivityFeed } from "./ActivityFeed";
import { OfficialCard } from "./OfficialCard";
import { CivicTabSkeleton } from "./CivicTabSkeleton";
import { getOfficialsByLocation, type ChainEntry } from "@/lib/api";
import { usePersistedLocation } from "@/hooks/usePersistedLocation";

const ROLE_ORDER = ["councilor", "lga_chairman", "mha", "rep", "representative", "senator", "governor"];

type Tab = "reps" | "leaderboard" | "activity";

export function CivicModal() {
  const { location: persistedLocation, setLocation: setPersistedLocation } = usePersistedLocation();
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

  useEffect(() => {
    if (typeof globalThis.window === "undefined") return;

    const handleOpenModal = () => {
      setOpen(true);
    };
    window.addEventListener("open-civic-modal", handleOpenModal);

    return () => {
      window.removeEventListener("open-civic-modal", handleOpenModal);
    };
  }, []);

  // Pre-populate from the persisted location on open, so the modal and the
  // home page stay in sync instead of each holding its own copy.
  useEffect(() => {
    if (open && !location && persistedLocation?.stateCode) {
      handleLocationSelect({
        stateCode: persistedLocation.stateCode,
        stateName: persistedLocation.stateName,
        lgaCode: persistedLocation.lgaCode,
        lgaName: persistedLocation.lgaName,
        wardCode: persistedLocation.wardCode,
        wardName: persistedLocation.wardName,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, persistedLocation]);

  async function handleLocationSelect(loc: {
    stateCode: string;
    stateName: string;
    lgaCode?: string;
    lgaName?: string;
    wardCode?: string;
    wardName?: string;
  }) {
    setLocation(loc);
    setPersistedLocation({
      stateCode: loc.stateCode,
      stateName: loc.stateName,
      lgaCode: loc.lgaCode,
      lgaName: loc.lgaName,
      wardCode: loc.wardCode,
      wardName: loc.wardName,
    });
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

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => { setOpen(true); }}
        className="fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95"
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
            onClick={handleClose}
          />

          {/* Modal panel */}
          <div className="relative flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-300 dark:bg-slate-900 sm:h-[42rem] sm:max-h-[90vh] sm:rounded-2xl">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
              <TabButton active={tab === "reps"} onClick={() => setTab("reps")} icon={<MapPin className="w-4 h-4" />} label="Representatives" />
              <TabButton active={tab === "leaderboard"} onClick={() => setTab("leaderboard")} icon={<Trophy className="w-4 h-4" />} label="Leaderboard" />
              <TabButton active={tab === "activity"} onClick={() => setTab("activity")} icon={<Activity className="w-4 h-4" />} label="Activity" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-theme p-5">
              {tab === "reps" && (
                <div className="flex min-h-full flex-col">
                  {/* Location picker */}
                  {!location && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Select your location to see who represents you
                      </p>
                      <LocationPicker onLocationSelect={handleLocationSelect} initialLocation={persistedLocation} />
                    </div>
                  )}

                  {/* Loading */}
                  {loading && (
                    <CivicTabSkeleton variant="reps" />
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
                            onClick={handleClose}
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
                <div className="flex min-h-full flex-col">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Which states have the most complete official data?
                  </p>
                  <Leaderboard
                    limit={37}
                    highlightState={location?.stateCode}
                    loadingFallback={<CivicTabSkeleton variant="leaderboard" />}
                  />
                </div>
              )}

              {tab === "activity" && (
                <div className="flex min-h-full flex-col">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Recent contributions from citizens
                  </p>
                  <ActivityFeed
                    limit={20}
                    loadingFallback={<CivicTabSkeleton variant="activity" />}
                  />
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
