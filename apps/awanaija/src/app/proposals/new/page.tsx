"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import posthog from "posthog-js";
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Upload, Link2, ImageIcon, X } from "lucide-react";
import {
  getOfficialById,
  createProposal,
  claimProposal,
  getParties,
  getSeatCandidates,
  type Official,
  type SeatCandidate,
} from "@/lib/api";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import {
  useIdentifyForm, ctxFromParams, hasFullContext, roleConfig,
  RoleField, LocationField, LocationChip, NameField, PartyField,
  OptionalDetails, SourceField, SubmitButton, ErrorBox, AuthModal,
  SeatVerificationView,
} from "@/components/proposals/identify-form";
import { SeatVerifyBar } from "@/components/proposals/SeatVerifyBar";
import { OfficialProfile } from "@/app/officials/[slug]/OfficialProfile";
import { TelegramDeepLinkLogin } from "@/components/auth/TelegramDeepLinkLogin";

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  imageUrl: "Photo URL",
  email: "Email Address",
  phoneNumber: "Phone Number",
  officeAddress: "Office Address",
  twitterHandle: "Twitter Handle",
  facebookUrl: "Facebook URL",
  education: "Education",
  biography: "Biography",
  gender: "Gender",
  dateOfBirth: "Date of Birth",
  partyAcronym: "Political Party",
  wardCode: "Ward",
  lgaCode: "LGA",
};

const FIELD_PLACEHOLDERS: Record<string, string> = {
  email: "e.g. senator@example.com",
  phoneNumber: "e.g. 08012345678",
  officeAddress: "e.g. National Assembly Complex, Abuja",
  twitterHandle: "e.g. senatoreze (without @)",
  facebookUrl: "e.g. https://facebook.com/senatoreze",
  education: "e.g. B.Sc Economics, University of Lagos",
  biography: "Brief biography of the official...",
  gender: "e.g. Male or Female",
  imageUrl: "e.g. https://example.com/photo.jpg",
  name: "Full name of the official",
};

const TEXTAREA_FIELDS = new Set(["biography", "officeAddress", "education"]);
const RELATIONAL_FIELDS = new Set(["partyAcronym", "wardCode", "lgaCode"]);

export default function NewProposalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <Navbar />
      <Suspense fallback={<div className="flex-grow pt-24" />}>
        <NewProposalContent />
      </Suspense>
      <Footer />
    </div>
  );
}

function NewProposalContent() {
  const searchParams = useSearchParams();

  const officialId = searchParams.get("officialId");

  // Existing official → propose a field change. Otherwise → identify a new official
  // (handles both deep-links with role/location context and cold no-context visits).
  if (officialId) {
    return <EditOfficialContent />;
  }

  return <IdentifyOfficialContent />;
}

// ─── IDENTIFY MODE (Variant C: location gate → minimal form) ────────────────

function IdentifyOfficialContent() {
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
            {form.newOfficialId && (
              <Link
                href={`/officials/${form.newOfficialId}`}
                className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                View Profile
              </Link>
            )}
            <Link
              href="/representatives"
              className="inline-block px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Back to Representatives
            </Link>
          </div>
          {form.isAnonymous && form.newProposalId && !form.showAuth && (
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
          )}
          {form.showAuth && form.newProposalId && (
            <AuthModal
              onVerified={() => {
                form.setShowAuth(false);
                claimProposal(form.newProposalId!).catch(() => {});
                form.setIsAnonymous(false);
              }}
              onClose={() => form.setShowAuth(false)}
            />
          )}
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

  return (
    <main className="flex-grow pt-24 bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <div className="max-w-lg mx-auto px-4 pb-8">
        <Link
          href="/representatives"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Representatives
        </Link>

        {!passedGate ? (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                Identify an official
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Tell us the seat, then the person who holds it.
              </p>
            </div>
            <div className="space-y-4">
              <RoleField form={form} />
              {form.role && <LocationField form={form} />}
              <button
                type="button"
                disabled={!form.role || !form.locationComplete}
                onClick={() => {
                  posthog.capture("proposal_location_confirmed", {
                    role: form.role,
                    location: form.locationLabel(),
                  });
                  setPassedGate(true);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                {showVerification
                  ? `Is this the ${roleConfig(form.role)?.label || "official"}?`
                  : `Identify ${roleConfig(form.role)?.label || "official"}`}
              </h1>
              {form.locationLabel() && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{form.locationLabel()}</p>
              )}
            </div>
            {candidatesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : showVerification ? (
              <SeatVerificationView
                form={form}
                candidates={candidates!}
                onSuggestDifferent={() => setForceForm(true)}
              />
            ) : (
              <div className="space-y-5">
                <LocationChip form={form} />
                {(!locked || forceForm) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (forceForm) setForceForm(false);
                      else { setForceForm(false); setPassedGate(false); }
                    }}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    ← {forceForm ? "Back to suggestions" : "Change position / location"}
                  </button>
                )}
                <NameField form={form} />
                <PartyField form={form} />
                <OptionalDetails form={form} />
                <SourceField form={form} />
                <ErrorBox message={form.error} />
                <SubmitButton form={form} label="Submit Identification" />
                <p className="text-xs text-slate-400 text-center">
                  Identifications are reviewed by admin before being published. You can submit up to 5 proposals per day.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ─── EDIT MODE (existing official) ──────────────────────────────────────────

function EditOfficialContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const officialId = searchParams.get("officialId");
  // Canonical param is `targetField` (matches the API payload + dashboard). Fall back to the
  // legacy `field` name still emitted by some links (e.g. OfficialProfile) so both work.
  const fieldParam = searchParams.get("targetField") || searchParams.get("field");

  const [official, setOfficial] = useState<Official | null>(null);
  const [loading, setLoading] = useState(true);

  const [targetField, setTargetField] = useState(fieldParam || "");
  const [parties, setParties] = useState<{ acronym: string; name: string }[]>([]);

  useEffect(() => {
    getParties().then(setParties).catch(() => {});
  }, []);

  // `useSearchParams()` is empty during the prerendered shell, so the initial
  // `useState(fieldParam || "")` above can miss the URL value and leave the
  // field on "Select a field". Re-sync on the client — prefer the reactive
  // param, but fall back to reading the live URL so a `?targetField=`/`?field=`
  // link auto-selects the field even if the hook hasn't resolved yet.
  useEffect(() => {
    if (fieldParam) {
      setTargetField(fieldParam);
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    const fromUrl = sp.get("targetField") || sp.get("field");
    if (fromUrl) setTargetField(fromUrl);
  }, [fieldParam]);
  const [proposedValue, setProposedValue] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  // Only used when correcting a name: is this the same person (wrong name) or a
  // new officeholder (previous term ended)? Drives rename-vs-new-official on approval.
  const [nameChangeKind, setNameChangeKind] = useState<"correction" | "succession">("correction");
  // Only used for a party change: wrong party recorded (correction) or a real
  // defection (add a dated affiliation record, keep history)?
  const [partyChangeKind, setPartyChangeKind] = useState<"correction" | "defection">("correction");
  // The real date a succession/defection took effect (YYYY-MM-DD).
  const [effectiveDate, setEffectiveDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    if (!officialId) {
      setLoading(false);
      return;
    }
    getOfficialById(officialId)
      .then(setOfficial)
      .catch(() => setError("Could not load official"))
      .finally(() => setLoading(false));
  }, [officialId]);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!officialId || !targetField || !proposedValue.trim()) return;

    if (RELATIONAL_FIELDS.has(targetField) && !sourceUrl.trim()) {
      setError("Source URL is required for this field type");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await createProposal({
        officialId,
        positionId: official?.positions?.[0]?.id,
        targetField,
        proposedValue: proposedValue.trim(),
        sourceUrl: sourceUrl.trim() || undefined,
        nameChangeKind: targetField === "name" ? nameChangeKind : undefined,
        partyChangeKind: targetField === "partyAcronym" ? partyChangeKind : undefined,
        effectiveDate:
          (targetField === "name" && nameChangeKind === "succession") ||
          (targetField === "partyAcronym" && partyChangeKind === "defection")
            ? effectiveDate || undefined
            : undefined,
      });
      setProposalId(result.id);
      setIsAnonymous(result.trust === "anonymous");
      posthog.capture("official_proposal_submitted", {
        official_id: officialId,
        target_field: targetField,
        has_source: !!sourceUrl.trim(),
      });
      // Revalidate the official's page cache so it shows this proposal
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `/officials/${officialId}` }),
      }).catch(() => {});
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      if (e.status === 429) {
        setError("You've submitted too many proposals recently. Please try again later.");
      } else {
        setError((e.message as string) || "Failed to submit proposal");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-grow pt-24 flex items-center justify-center bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex-grow pt-24 bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
        <div className="max-w-lg mx-auto px-4 pb-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-2">
            Proposal Submitted!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your proposal is under review. Other citizens can upvote it to help prioritize it.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            You&apos;re helping build Nigeria&apos;s civic record. Thank you.
          </p>
          {official && (
            <Link
              href={`/officials/${official.slug ?? official.id}`}
              className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Back to {official.name}&apos;s profile
            </Link>
          )}
          {isAnonymous && proposalId && !showOtp && (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              Want to track this contribution?{" "}
              <button
                type="button"
                onClick={() => setShowOtp(true)}
                className="font-medium text-emerald-600 hover:underline"
              >
                Log in
              </button>{" "}
              and we&apos;ll notify you when it&apos;s reviewed.
            </p>
          )}
          {showOtp && proposalId && (
            <OtpModal
              onVerified={() => {
                setShowOtp(false);
                claimProposal(proposalId).catch(() => {});
                setIsAnonymous(false);
              }}
              onClose={() => setShowOtp(false)}
            />
          )}
        </div>
      </main>
    );
  }

  // No officialId and no role — show error
  if (!officialId) {
    return (
      <main className="flex-grow pt-24 bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
        <div className="max-w-lg mx-auto px-4 pb-8 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Missing Context
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Navigate to a representative&apos;s profile to propose changes, or find an unidentified position from the representatives page.
          </p>
          <Link
            href="/representatives"
            className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            Find Representatives
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow pt-24 bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <div className="max-w-lg mx-auto px-4 pb-8">
        <Link
          href={official ? `/officials/${official.slug ?? official.id}` : "/"}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h1 className="text-xl font-bold text-slate-900 dark:text-white font-heading mb-1">
          Propose Information
        </h1>
        {official && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            for <span className="font-medium text-slate-800 dark:text-slate-200">{official.name}</span>
            {official.positions?.[0] && (
              <span> · {official.positions[0].role}</span>
            )}
          </p>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              What information are you adding?
            </label>
            <select
              value={targetField}
              onChange={(e) => setTargetField(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a field</option>
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Value input */}
          {targetField && targetField === "imageUrl" ? (
            <PhotoInput value={proposedValue} onChange={setProposedValue} />
          ) : targetField === "partyAcronym" ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {FIELD_LABELS[targetField] || targetField}
              </label>
              <select
                value={proposedValue}
                onChange={(e) => setProposedValue(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select party</option>
                {parties.map((p) => (
                  <option key={p.acronym} value={p.acronym}>
                    {p.acronym} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : targetField === "gender" ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {FIELD_LABELS[targetField] || targetField}
              </label>
              <select
                value={proposedValue}
                onChange={(e) => setProposedValue(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          ) : targetField ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {FIELD_LABELS[targetField] || targetField}
              </label>
              {TEXTAREA_FIELDS.has(targetField) ? (
                <textarea
                  value={proposedValue}
                  onChange={(e) => setProposedValue(e.target.value)}
                  placeholder={FIELD_PLACEHOLDERS[targetField] || "Enter value..."}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              ) : (
                <input
                  type={targetField === "email" ? "email" : "text"}
                  value={proposedValue}
                  onChange={(e) => setProposedValue(e.target.value)}
                  placeholder={FIELD_PLACEHOLDERS[targetField] || "Enter value..."}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          ) : null}

          {/* Name change intent — correction (same person) vs succession (new holder) */}
          {targetField === "name" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Why is the name changing?
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                  <input
                    type="radio"
                    name="nameChangeKind"
                    value="correction"
                    checked={nameChangeKind === "correction"}
                    onChange={() => setNameChangeKind("correction")}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-slate-900 dark:text-white">Correcting a wrong name</span>
                    <span className="block text-slate-500 dark:text-slate-400">
                      Same person — the name shown is misspelled or incorrect.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                  <input
                    type="radio"
                    name="nameChangeKind"
                    value="succession"
                    checked={nameChangeKind === "succession"}
                    onChange={() => setNameChangeKind("succession")}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-slate-900 dark:text-white">A new person holds this seat</span>
                    <span className="block text-slate-500 dark:text-slate-400">
                      The previous holder&apos;s term ended — this is a different official.
                    </span>
                  </span>
                </label>
              </div>
              {nameChangeKind === "succession" && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    When did their term start?
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    e.g. their election or inauguration date. Leave blank if unknown.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Party change intent — correction (wrong party) vs defection (dated change) */}
          {targetField === "partyAcronym" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Why is the party changing?
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                  <input
                    type="radio"
                    name="partyChangeKind"
                    value="correction"
                    checked={partyChangeKind === "correction"}
                    onChange={() => setPartyChangeKind("correction")}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-slate-900 dark:text-white">Correcting a wrong party</span>
                    <span className="block text-slate-500 dark:text-slate-400">
                      The party on record is simply wrong.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
                  <input
                    type="radio"
                    name="partyChangeKind"
                    value="defection"
                    checked={partyChangeKind === "defection"}
                    onChange={() => setPartyChangeKind("defection")}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-slate-900 dark:text-white">They actually changed party</span>
                    <span className="block text-slate-500 dark:text-slate-400">
                      A real defection — we&apos;ll keep the previous party as history.
                    </span>
                  </span>
                </label>
              </div>
              {partyChangeKind === "defection" && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    When did they change party?
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    The defection date. Leave blank if unknown.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Source URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Source URL
              {RELATIONAL_FIELDS.has(targetField) ? (
                <span className="text-red-500 ml-1">*</span>
              ) : (
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              )}
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="e.g. https://dailytrust.ng/article..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Link to a news article, official website, or social media post that confirms this information.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !targetField || !proposedValue.trim()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Proposal"
            )}
          </button>

          <p className="text-xs text-slate-400 text-center">
            Proposals are reviewed by admin before being applied. Other citizens can upvote your proposal.
          </p>
        </form>
      </div>
    </main>
  );
}

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────

function OtpModal({ onVerified, onClose }: { onVerified: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<"telegram" | "whatsapp">("telegram");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const API_BASE = "/api";

  async function waitForSession() {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) return true;
      } catch {}

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return false;
  }

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleSendOtp() {
    const fullPhone = phone.startsWith("+") ? phone : `+234${phone.replace(/^0/, "")}`;
    if (fullPhone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send OTP"); return; }
      setStep("code");
      setCountdown(60);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const fullPhone = phone.startsWith("+") ? phone : `+234${phone.replace(/^0/, "")}`;
    const codeStr = code.join("");
    if (codeStr.length !== 6) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber: fullPhone, code: codeStr }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed"); return; }
      onVerified();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || "";
    setCode(newCode);
  }

  // Auto-submit when all 6 digits entered
  const codeStr = code.join("");
  useEffect(() => {
    if (codeStr.length === 6 && step === "code" && !isLoading) {
      handleVerifyOtp();
    }
  }, [codeStr]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Verify to contribute
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Sign in to submit your proposal.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-5">
          <button
            onClick={() => { setTab("telegram"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 pb-3 text-sm font-medium transition-colors ${
              tab === "telegram"
                ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
            Telegram
          </button>
          <button
            onClick={() => { setTab("whatsapp"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 pb-3 text-sm font-medium transition-colors ${
              tab === "whatsapp"
                ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="flex items-start gap-2 p-2.5 mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {tab === "telegram" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 dark:border-sky-700/50 bg-sky-50/80 dark:bg-sky-950/50 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                  Sign in via Telegram
                </span>
              </div>
              <div className="flex min-h-[40px] items-center justify-center">
                <TelegramDeepLinkLogin
                  onAuthenticated={async () => {
                    setError(null);
                    const ok = await waitForSession();
                    if (ok) {
                      onVerified();
                    } else {
                      setError("Telegram login did not finish correctly. Please try again.");
                    }
                  }}
                />
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  You&apos;ll confirm by tapping Start in Telegram. We only receive your Telegram ID.
                </p>
              </div>
            </div>
          ) : step === "phone" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 dark:border-emerald-700/50 bg-emerald-50/80 dark:bg-emerald-950/50 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Sign in via WhatsApp
                </span>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone number
                </label>
                <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                  <span className="flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-400 border-r border-slate-300 dark:border-slate-700">
                    +234
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Enter" && phone.length >= 7) handleSendOtp(); }}
                    placeholder="XXX XXX XXXX"
                    className="flex-1 px-3 py-3 text-sm bg-white dark:bg-slate-800 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={isLoading || phone.length < 7}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isLoading ? "Sending code..." : "Send verification code"}
              </button>
              <div className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  We&apos;ll send a 6-digit code to your WhatsApp. No password needed.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setCode(["","","","","",""]); setError(null); }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Change number
                </button>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Enter the code sent to{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    +234{phone}
                  </span>
                </p>
              </div>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    disabled={isLoading}
                    className={`h-12 w-10 rounded-xl border-2 bg-white dark:bg-slate-800 text-center text-xl font-bold outline-none transition-all ${
                      digit
                        ? "border-emerald-400 dark:border-emerald-500 shadow-sm shadow-emerald-500/10"
                        : "border-slate-200 dark:border-slate-600"
                    } text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={codeStr.length !== 6 || isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isLoading ? "Verifying..." : "Verify & continue"}
              </button>
              <div className="text-center">
                <span className="text-xs text-slate-400">Didn&apos;t get the code? </span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 0 || isLoading}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 dark:text-emerald-400"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PhotoInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function compressImage(file: File) {
    const imageUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not read image"));
        img.src = imageUrl;
      });

      const maxDimension = 1200;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Image processing is not available");
      }

      context.drawImage(image, 0, 0, width, height);

      const targetBytes = 450 * 1024;
      let quality = 0.82;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);

      while (dataUrl.length > targetBytes && quality > 0.45) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }

      return dataUrl;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
      onChange(compressed);
    } catch {
      setUploadError("Could not process this image. Try another file.");
      setPreview(null);
      onChange("");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function clearUpload() {
    setPreview(null);
    setUploadError(null);
    onChange("");
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Photo
      </label>

      <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-3">
        <button
          type="button"
          onClick={() => { setMode("url"); clearUpload(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
            mode === "url"
              ? "bg-emerald-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          Paste URL
        </button>
        <button
          type="button"
          onClick={() => { setMode("upload"); onChange(""); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
            mode === "upload"
              ? "bg-emerald-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload
        </button>
      </div>

      {mode === "url" ? (
        <>
          <input
            type="url"
            value={value}
            onChange={(e) => {
              setUploadError(null);
              onChange(e.target.value);
            }}
            placeholder="e.g. https://example.com/photo.jpg"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {value && value.startsWith("http") && (
            <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          {preview ? (
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Upload preview"
                className="w-24 h-24 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={clearUpload}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
              <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Click to select an image
              </span>
              <span className="text-xs text-slate-400 mt-1">
                JPG, PNG, WebP. Max 5MB. Large images are resized automatically.
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </>
      )}

      {uploadError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>
      )}
    </div>
  );
}
