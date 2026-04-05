"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { getOfficialsByLocation, type ChainEntry } from "@/lib/api";
import { OfficialCard } from "@/components/civic/OfficialCard";
import { LocationPicker } from "@/components/civic/LocationPicker";

// LOCAL-FIRST ordering: councilor at top, governor at bottom
const ROLE_ORDER = ["councilor", "lga_chairman", "mha", "rep", "representative", "senator", "governor"];

export default function RepresentativesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)]" />}>
      <RepresentativesContent />
    </Suspense>
  );
}

function RepresentativesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [unknownsExpanded, setUnknownsExpanded] = useState(false);

  // Read initial location from URL params
  useEffect(() => {
    const state = searchParams.get("state");
    if (state) {
      handleLocationSelect({
        stateCode: state,
        stateName: searchParams.get("stateName") || "",
        lgaCode: searchParams.get("lga") || undefined,
        lgaName: searchParams.get("lgaName") || undefined,
        wardCode: searchParams.get("ward") || undefined,
        wardName: searchParams.get("wardName") || undefined,
      });
    }
  }, []);

  async function handleLocationSelect(loc: {
    stateCode: string;
    stateName: string;
    lgaCode?: string;
    lgaName?: string;
    wardCode?: string;
    wardName?: string;
  }) {
    const params = new URLSearchParams();
    params.set("state", loc.stateCode);
    if (loc.stateName) params.set("stateName", loc.stateName);
    if (loc.lgaCode) params.set("lga", loc.lgaCode);
    if (loc.lgaName) params.set("lgaName", loc.lgaName);
    if (loc.wardCode) params.set("ward", loc.wardCode);
    if (loc.wardName) params.set("wardName", loc.wardName);
    router.replace(`/representatives?${params.toString()}`);

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

  // Sort chain by local-first order
  const sortedChain = [...chain].sort((a, b) => {
    const aIdx = ROLE_ORDER.indexOf(a.role);
    const bIdx = ROLE_ORDER.indexOf(b.role);
    return aIdx - bIdx;
  });

  const knownCount = sortedChain.filter((e) => e.official).length;
  const unknownEntries = sortedChain.filter((e) => !e.official);
  const knownEntries = sortedChain.filter((e) => e.official);

  // On mobile, collapse unknowns by default
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const breadcrumb = [
    location?.stateName,
    location?.lgaName,
    location?.wardName,
  ]
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
    <main className="min-h-screen bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)]">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading">
          Your Representatives
        </h1>

        {location ? (
          <div className="mt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {breadcrumb || location.stateName}
            </p>
            {chain.length > 0 && (
              <p className="text-sm font-medium text-emerald-600 mt-1">
                {knownCount}/{sortedChain.length} identified
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Select your location to see who represents you
          </p>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* Location picker if no location yet */}
        {!location && (
          <div className="mb-6">
            <LocationPicker onLocationSelect={handleLocationSelect} />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white dark:bg-slate-900 rounded-lg animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        )}

        {/* Chain */}
        {!loading && chain.length > 0 && (
          <div className="space-y-3">
            {/* Mobile: collapsed unknowns summary */}
            {unknownEntries.length > 0 && (
              <button
                onClick={() => setUnknownsExpanded(!unknownsExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-sm md:hidden"
              >
                <span className="text-slate-600 dark:text-slate-300">
                  {unknownsExpanded ? (
                    <ChevronUp className="inline w-4 h-4 mr-1" />
                  ) : (
                    <ChevronDown className="inline w-4 h-4 mr-1" />
                  )}
                  {unknownEntries.length} position{unknownEntries.length !== 1 ? "s" : ""} unidentified
                </span>
                <span className="text-emerald-600 font-medium">
                  Help fill them in →
                </span>
              </button>
            )}

            {/* Mobile: show unknowns only if expanded */}
            <div className="md:hidden">
              {unknownsExpanded &&
                unknownEntries.map((entry, i) => (
                  <div key={`unknown-${i}`} className="mb-3">
                    <OfficialCard
                      official={null}
                      position={entry.position}
                      role={entry.role}
                      scope={buildScope(entry.scope)}
                    />
                  </div>
              ))}
            </div>

            {/* Desktop: show all in order */}
            <div className="hidden md:block space-y-3">
              {sortedChain.map((entry, i) => (
                <OfficialCard
                  key={`chain-${i}`}
                  official={entry.official}
                  position={entry.position}
                  role={entry.role}
                  scope={buildScope(entry.scope)}
                />
              ))}
            </div>

            {/* Mobile: known officials always visible */}
            <div className="md:hidden space-y-3">
              {knownEntries.map((entry, i) => (
                <OfficialCard
                  key={`known-${i}`}
                  official={entry.official}
                  position={entry.position}
                  role={entry.role}
                  scope={buildScope(entry.scope)}
                />
              ))}
            </div>

            {/* Share CTA */}
            <div className="mt-6 text-center">
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                <Share2 className="w-4 h-4" />
                Share My Representatives
              </button>
            </div>

            {/* Change location */}
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setLocation(null);
                  setChain([]);
                  router.replace("/representatives");
                }}
                className="text-sm text-slate-500 hover:text-emerald-600 underline"
              >
                Explore other areas
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && location && chain.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">
              No officials found for this location.
            </p>
            <button
              onClick={() => {
                setLocation(null);
                setChain([]);
                router.replace("/representatives");
              }}
              className="mt-4 text-sm text-emerald-600 hover:underline"
            >
              Try a different location
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
