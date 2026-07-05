"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Check, X, Link2, MapPin } from "lucide-react";
import type { ChainEntry } from "@/lib/api";
import { LocationPicker } from "@/components/civic/LocationPicker";
import { NarrativeView } from "@/components/representatives/NarrativeView";
import { usePersistedLocation } from "@/hooks/usePersistedLocation";

export function RepresentativesClient({
  initialChain,
  initialLocation,
  stateDetails,
  lgaDetails,
}: {
  initialChain: ChainEntry[];
  initialLocation: {
    stateCode: string;
    stateName: string;
    lgaCode?: string;
    lgaName?: string;
    wardCode?: string;
    wardName?: string;
  } | null;
  stateDetails?: {
    name?: string;
    economy?: { population?: string; domesticDebt?: string; externalDebt?: string; gdp?: string };
    stats?: { budget?: string; faac?: string; igr?: string; igrFiscalYear?: number; igrPeriod?: string };
  } | null;
  lgaDetails?: {
    name?: string;
    stats?: { population?: string; faac?: string; igr?: string };
  } | null;
}) {
  const router = useRouter();
  const { location: persistedLocation, setLocation: setPersistedLocation } = usePersistedLocation();
  const [loading, setLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(timeout);
  }, [initialLocation, initialChain]);

  // Seed from the persisted location when the page was reached with no URL
  // params at all — an explicit URL param always takes precedence (keeps
  // shareable links working), this only fills in the "just landed here"
  // case so the saved location shows without another manual pick.
  // Exception: `?change=1` means the user explicitly asked to pick a different
  // area, so we must NOT seed them back to their saved location — show the
  // picker instead.
  useEffect(() => {
    const wantsChange =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("change");
    if (!initialLocation && persistedLocation?.stateCode && !wantsChange) {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("state", persistedLocation.stateCode);
      if (persistedLocation.stateName) params.set("stateName", persistedLocation.stateName);
      if (persistedLocation.lgaCode) params.set("lga", persistedLocation.lgaCode);
      if (persistedLocation.lgaName) params.set("lgaName", persistedLocation.lgaName);
      if (persistedLocation.wardCode) params.set("ward", persistedLocation.wardCode);
      if (persistedLocation.wardName) params.set("wardName", persistedLocation.wardName);
      router.replace(`/representatives?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocation, persistedLocation]);

  const getShareText = useCallback(() => {
    const loc = initialLocation
      ? [initialLocation.stateName, initialLocation.lgaName, initialLocation.wardName].filter(Boolean).join(", ")
      : "";
    return loc
      ? `See who represents ${loc} on OurNigeria`
      : "See who represents you on OurNigeria";
  }, [initialLocation]);

  const handleShare = useCallback(async () => {
    const url = globalThis.location.href;
    const text = getShareText();

    // Native Web Share only on touch devices — on desktop it's unreliable
    // (some browsers expose navigator.share but hang or silently fail with no
    // share target, leaving the button doing nothing). Desktop goes straight
    // to the in-app modal (X / Facebook / WhatsApp / Copy Link).
    const isTouch =
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: coarse)").matches;
    const canNativeShare =
      isTouch &&
      typeof navigator !== "undefined" &&
      !!navigator.share &&
      (navigator.canShare ? navigator.canShare({ url }) : true);

    if (canNativeShare) {
      try {
        await navigator.share({ title: text, url });
        return;
      } catch (err) {
        // User cancelled the native sheet — don't pop the fallback modal.
        if (err instanceof Error && err.name === "AbortError") return;
        // Any other failure falls through to the in-app modal.
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

  async function handleLocationSelect(loc: {
    stateCode: string;
    stateName: string;
    lgaCode?: string;
    lgaName?: string;
    wardCode?: string;
    wardName?: string;
  }) {
    setLoading(true);

    // Write-through: persist so other surfaces (home page, civic modal) stay
    // in sync with the choice made here.
    setPersistedLocation(loc);

    const params = new URLSearchParams();
    params.set("state", loc.stateCode);
    if (loc.stateName) params.set("stateName", loc.stateName);
    if (loc.lgaCode) params.set("lga", loc.lgaCode);
    if (loc.lgaName) params.set("lgaName", loc.lgaName);
    if (loc.wardCode) params.set("ward", loc.wardCode);
    if (loc.wardName) params.set("wardName", loc.wardName);

    // Server component will handle the fetch when URL changes
    router.push(`/representatives?${params.toString()}`);
  }

  // `?change=1` = the user explicitly wants to pick a different area, so the
  // picker must start blank (state list) rather than pre-seeded to their saved
  // location.
  const changeMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("change");

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 pt-24 pb-20 w-full">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Location picker if no location yet */}
      {!initialLocation && !loading && (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-2">
            Your Representatives
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Select your location to see who represents you
          </p>
          <LocationPicker onLocationSelect={handleLocationSelect} initialLocation={changeMode ? undefined : persistedLocation} />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="h-32 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />
          <div className="h-8 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-48 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />
          <div className="h-8 w-2/3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-48 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />
        </div>
      )}

      {/* Narrative view */}
      {!loading && initialLocation && initialChain.length > 0 && (
        <>
          {/* Prominent location bar — always visible so changing area is one
              click, not a buried button at the bottom of the page. */}
          <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <MapPin className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0">
                <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  You are viewing
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {[initialLocation.stateName, initialLocation.lgaName, initialLocation.wardName]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                router.push("/representatives?change=1");
              }}
              aria-label="Change location"
              className="shrink-0 inline-flex items-center rounded-full border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 transition-colors"
            >
              <span className="sm:hidden">Change</span>
              <span className="hidden sm:inline">Change location</span>
            </button>
          </div>

          <NarrativeView
            chain={initialChain}
            location={initialLocation}
            stateDetails={stateDetails ?? null}
            lgaDetails={lgaDetails ?? null}
          />

          {/* Share + change location */}
          <div className="max-w-3xl mx-auto mt-12 text-center space-y-4">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full hover:bg-emerald-600 dark:hover:bg-emerald-400 transition-colors shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              Share My Representatives
            </button>

            <div>
              <button
                onClick={() => {
                  setLoading(true);
                  router.push("/representatives?change=1");
                }}
                className="text-sm text-slate-500 hover:text-emerald-600 underline"
              >
                Change location
              </button>
            </div>
          </div>

          {/* Share modal */}
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
        </>
      )}

      {/* Empty state */}
      {!loading && initialLocation && initialChain.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">
            No officials found for this location.
          </p>
          <button
            onClick={() => {
              setLoading(true);
              router.push("/representatives");
            }}
            className="mt-4 text-sm text-emerald-600 hover:underline"
          >
            Try a different location
          </button>
        </div>
      )}
    </main>
  );
}