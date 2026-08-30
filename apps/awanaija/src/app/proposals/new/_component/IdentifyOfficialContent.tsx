"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import posthog from "posthog-js";
import { Loader2, CheckCircle } from "lucide-react";
import {
  useIdentifyForm, ctxFromParams, hasFullContext, roleConfig,
  AuthModal, SeatVerificationView,
} from "@/components/proposals/identify-form";
import { SeatVerifyBar } from "@/components/proposals/SeatVerifyBar";
import { OfficialProfile } from "@/app/officials/[slug]/_component/OfficialProfile";
import { Show } from "@/components/ui/Show";
import { IdentifyGate } from "./IdentifyGate";
import { IdentifyForm } from "./IdentifyForm";
import {
  getOfficialById,
  getSeatCandidates,
  claimProposal,
  type Official,
  type SeatCandidate,
} from "@/lib/api";

// ─── IDENTIFY MODE (Variant C: location gate → minimal form) ────────────────

export function IdentifyOfficialContent() {
  const searchParams = useSearchParams();
  const ctx = ctxFromParams(new URLSearchParams(searchParams.toString()));
  const locked = hasFullContext(ctx);
  const form = useIdentifyForm(ctx);
  const [passedGate, setPassedGate] = useState(locked);

  // Fetch-existing-first: once the seat (role + full location) is known, check
  // whether anyone has already proposed a name for it. If so, we show the
  // verification view (confirm / suggest-different / add-source) instead of a
  // blank form. Fails open — any fetch error falls back to the blank form.
  const [candidates, setCandidates] = useState<SeatCandidate[] | null>(null);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [forceForm, setForceForm] = useState(false);
  // Canonical official id for the seat, if one exists (populated by the same
  // /proposals/seat response that gives us `candidates`).
  const [canonicalOfficialId, setCanonicalOfficialId] = useState<string | null>(null);

  const seatReady = passedGate && !!form.role && form.locationComplete;
  const seatKey = seatReady
    ? [form.role, form.stateCode, form.lgaCode, form.wardCode, form.constituencyCode].join("|")
    : null;

  useEffect(() => {
    if (!seatKey || !form.role) {
      setCandidates(null);
      setCanonicalOfficialId(null);
      return;
    }
    let cancelled = false;
    setCandidatesLoading(true);
    getSeatCandidates({
      role: form.role,
      stateCode: form.stateCode || undefined,
      lgaCode: form.lgaCode || undefined,
      wardCode: form.wardCode || undefined,
      constituencyCode: form.constituencyCode || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setCandidates(res.candidates || []);
        setCanonicalOfficialId(res.hasCanonical && res.official?.id ? res.official.id : null);
      })
      .catch(() => {
        if (cancelled) return;
        setCandidates([]); // fail open → blank form
        setCanonicalOfficialId(null);
      })
      .finally(() => { if (!cancelled) setCandidatesLoading(false); });
    return () => { cancelled = true; };
  }, [seatKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const showVerification =
    seatReady && !forceForm && !!candidates && candidates.length > 0;

  // Seat-verify path landing on an already-proposed seat: fetch the full
  // canonical official (hero + positions + bio + contact) so we can show the
  // real profile page instead of a bare confirmation card, with the confirm
  // actions in a banner on top. Fails open — no canonical official, or a
  // failed fetch, falls back to the plain SeatVerificationView card.
  const [fullOfficial, setFullOfficial] = useState<Official | null>(null);
  const [fullOfficialLoading, setFullOfficialLoading] = useState(false);
  const [fullOfficialError, setFullOfficialError] = useState(false);

  useEffect(() => {
    if (!showVerification || !canonicalOfficialId) {
      setFullOfficial(null);
      setFullOfficialError(false);
      return;
    }
    let cancelled = false;
    setFullOfficialLoading(true);
    setFullOfficialError(false);
    getOfficialById(canonicalOfficialId)
      .then((res) => { if (!cancelled) setFullOfficial(res); })
      .catch(() => { if (!cancelled) setFullOfficialError(true); })
      .finally(() => { if (!cancelled) setFullOfficialLoading(false); });
    return () => { cancelled = true; };
  }, [showVerification, canonicalOfficialId]);

  // Revalidate the newly-created official's page so it shows the proposal.
  useEffect(() => {
    if (form.success && form.newOfficialId) {
      posthog.capture("official_identified", {
        role: form.role,
        official_id: form.newOfficialId,
        location: form.locationLabel(),
      });
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `/officials/${form.newOfficialId}` }),
      }).catch(() => {});
    }
  }, [form.success, form.newOfficialId]);

  if (form.success) {
    return (
      <main className="flex-grow pt-24 bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
        <div className="max-w-lg mx-auto px-4 pb-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-2">
            Official Identified!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            <span className="font-medium text-slate-800 dark:text-slate-200">{form.name}</span> has been
            submitted as the <span className="font-medium">{roleConfig(form.role)?.label || form.role}</span>.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Your identification is under review. Other citizens can upvote to help verify it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Show when={!!form.newOfficialId}>
              <Link
                href={`/officials/${form.newOfficialId}`}
                className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                View Profile
              </Link>
            </Show>
            <Link
              href="/representatives"
              className="inline-block px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Back to Representatives
            </Link>
          </div>
          <Show when={!!(form.isAnonymous && form.newProposalId && !form.showAuth)}>
            <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
              Want to track this contribution?{" "}
              <button
                type="button"
                onClick={() => form.setShowAuth(true)}
                className="font-medium text-emerald-600 hover:underline"
              >
                Log in
              </button>{" "}
              and we&apos;ll notify you when it&apos;s reviewed.
            </p>
          </Show>
          <Show when={!!(form.showAuth && form.newProposalId)}>
            <AuthModal
              onVerified={() => {
                form.setShowAuth(false);
                claimProposal(form.newProposalId!).catch(() => {});
                form.setIsAnonymous(false);
              }}
              onClose={() => form.setShowAuth(false)}
            />
          </Show>
        </div>
      </main>
    );
  }

  // Seat-verify-with-full-profile path: a canonical official already exists
  // for this seat, so show the real profile (hero + positions + details)
  // with the confirm/suggest-different banner on top instead of the bare
  // confirmation card. Falls back to the plain SeatVerificationView below if
  // there's no canonical official, or if the full official fetch fails.
  if (passedGate && showVerification && canonicalOfficialId && !fullOfficialError) {
    if (fullOfficialLoading || !fullOfficial) {
      return (
        <main className="flex-grow pt-24 flex items-center justify-center bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </main>
      );
    }
    return (
      <OfficialProfile
        official={fullOfficial}
        peers={[]}
        showHelpComplete={false}
        showChallenge={false}
        showProposals={false}
        showPeers={false}
        whereServeLast
        bottomSlot={
          <div className="mt-10">
            <SeatVerifyBar
              form={form}
              candidates={candidates!}
              onSuggestDifferent={() => setForceForm(true)}
            />
          </div>
        }
      />
    );
  }

  function handleContinue() {
    posthog.capture("proposal_location_confirmed", {
      role: form.role,
      location: form.locationLabel(),
    });
    setPassedGate(true);
  }

  // Back out of the current step: from the blank form (after "suggest different")
  // return to the suggestions; otherwise return to the seat gate.
  function handleChangeLocation() {
    if (forceForm) setForceForm(false);
    else setPassedGate(false);
  }

  const seatTitle = showVerification
    ? `Is this the ${roleConfig(form.role)?.label || "official"}?`
    : `Identify ${roleConfig(form.role)?.label || "official"}`;

  return (
    <main className="flex-grow pt-24 bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <div className="max-w-lg mx-auto px-4 pb-8">
        <BackButton fallbackHref="/representatives" fallbackLabel="Representatives" className="mb-6" />

        <Show when={!passedGate}>
          <IdentifyGate form={form} onContinue={handleContinue} />
        </Show>

        <Show when={passedGate}>
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
              {seatTitle}
            </h1>
            <Show when={!!form.locationLabel()}>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{form.locationLabel()}</p>
            </Show>
          </div>

          <Show when={candidatesLoading}>
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          </Show>

          <Show when={!candidatesLoading && showVerification}>
            <SeatVerificationView
              form={form}
              candidates={candidates ?? []}
              onSuggestDifferent={() => setForceForm(true)}
            />
          </Show>

          <Show when={!candidatesLoading && !showVerification}>
            {/* The change-location escape stays visible even for locked deep-link
                context: the pre-filled seat comes from ward→constituency mapping
                data that can be wrong or stale, and without this link the only
                way to correct it is editing the URL. */}
            <IdentifyForm
              form={form}
              showChangeLocation
              changeLabel={forceForm ? "Back to suggestions" : "Change position / location"}
              onChangeLocation={handleChangeLocation}
            />
          </Show>
        </Show>
      </div>
    </main>
  );
}
