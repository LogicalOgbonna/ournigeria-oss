"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, ChevronDown, ChevronUp, Check, X, Link2 } from "lucide-react";
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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const getShareText = useCallback(() => {
    const loc = location
      ? [location.stateName, location.lgaName, location.wardName].filter(Boolean).join(", ")
      : "";
    return loc
      ? `See who represents ${loc} on OurNigeria`
      : "See who represents you on OurNigeria";
  }, [location]);

  const handleShare = useCallback(async () => {
    const url = globalThis.location.href;
    const text = getShareText();

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
        return;
      } catch {
        // user cancelled — fall through
      }
    }

    setShareModalOpen(true);
  }, [getShareText]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(globalThis.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, []);

  // Read initial location from URL params — only load reps if ward is specified
  useEffect(() => {
    const state = searchParams.get("state");
    const ward = searchParams.get("ward");
    if (state && ward) {
      handleLocationSelect({
        stateCode: state,
        stateName: searchParams.get("stateName") || "",
        lgaCode: searchParams.get("lga") || undefined,
        lgaName: searchParams.get("lgaName") || undefined,
        wardCode: ward,
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
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share My Representatives
              </button>
            </div>

            {/* Desktop share modal */}
            {shareModalOpen && (
              <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShareModalOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShareModalOpen(false);
                }}
              >
                <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Share
                    </h3>
                    <button
                      onClick={() => setShareModalOpen(false)}
                      className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-5">
                    {/* X (Twitter) */}
                    <a
                      href={`https://x.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(globalThis.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                        <svg className="w-5 h-5 text-slate-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">X</span>
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(globalThis.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                        <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Facebook</span>
                    </a>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(getShareText() + " " + globalThis.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                        <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">WhatsApp</span>
                    </a>

                    {/* Copy Link */}
                    <button
                      onClick={handleCopyLink}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                        {linkCopied ? (
                          <Check className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Link2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {linkCopied ? "Copied!" : "Copy Link"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

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
