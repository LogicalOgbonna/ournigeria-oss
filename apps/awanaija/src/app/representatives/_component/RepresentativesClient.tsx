"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Share2 } from "lucide-react";
import type { ChainEntry, StateDetails, LgaDetails, InitialLocation } from "../utils";
import { NarrativeView } from "@/components/representatives/NarrativeView";
import { usePersistedLocation } from "@/hooks/usePersistedLocation";
import { ShareModal } from "./ShareModal";
import { Show } from "@/components/ui/Show";
import { LocationBar } from "./LocationBar";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { RepLocationPicker } from "./RepLocationPicker";

export function RepresentativesClient({
  initialChain,
  initialLocation,
  stateDetails,
  lgaDetails,
}: {
  initialChain: ChainEntry[];
  initialLocation: InitialLocation | null;
  stateDetails?: StateDetails | null;
  lgaDetails?: LgaDetails | null;
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
        <BackButton fallbackHref="/" fallbackLabel="Home" />
      </div>

      {/* Location picker if no location yet */}
      <Show when={!initialLocation && !loading}>
        <RepLocationPicker
          onLocationSelect={handleLocationSelect}
          initialLocation={changeMode ? undefined : persistedLocation}
        />
      </Show>

      {/* Loading state */}
      <Show when={loading}>
        <LoadingSkeleton />
      </Show>

      {/* Narrative view */}
      {!loading && initialLocation && initialChain.length > 0 && (
        <>
          {/* Prominent location bar — always visible so changing area is one
              click, not a buried button at the bottom of the page. */}
          <LocationBar
            location={initialLocation}
            onChange={() => {
              setLoading(true);
              router.push("/representatives?change=1");
            }}
          />

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
          <Show when={shareModalOpen}>
            <ShareModal
              getShareText={getShareText}
              onCopyLink={handleCopyLink}
              linkCopied={linkCopied}
              onClose={() => setShareModalOpen(false)}
            />
          </Show>
        </>
      )}

      {/* Empty state */}
      <Show when={!loading && !!initialLocation && initialChain.length === 0}>
        <EmptyState onReset={() => {
          setLoading(true);
          router.push("/representatives");
        }} />
      </Show>
    </main>
  );
}
