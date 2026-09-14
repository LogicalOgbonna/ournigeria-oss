"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import posthog from "posthog-js";
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import {
  getOfficialById,
  createProposal,
  claimProposal,
  getParties,
  type Official,
} from "@/lib/api";
import { PhotoInput } from "./PhotoInput";
import { OtpModal } from "./OtpModal";
import { Show } from "@/components/ui/Show";

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

// ─── EDIT MODE (existing official) ──────────────────────────────────────────

export function EditOfficialContent() {
  const searchParams = useSearchParams();

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
          <Show when={!!(isAnonymous && proposalId && !showOtp)}>
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
          </Show>
          <Show when={!!(showOtp && proposalId)}>
            <OtpModal
              onVerified={() => {
                setShowOtp(false);
                claimProposal(proposalId!).catch(() => {});
                setIsAnonymous(false);
              }}
              onClose={() => setShowOtp(false)}
            />
          </Show>
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

        <Show when={!!error}>
          <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </Show>

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
          <Show when={targetField === "imageUrl"}>
            <PhotoInput value={proposedValue} onChange={setProposedValue} />
          </Show>
          <Show when={targetField === "partyAcronym"}>
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
          </Show>
          <Show when={targetField === "gender"}>
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
          </Show>
          <Show
            when={
              !!targetField &&
              targetField !== "imageUrl" &&
              targetField !== "partyAcronym" &&
              targetField !== "gender"
            }
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {FIELD_LABELS[targetField] || targetField}
              </label>
              <Show when={TEXTAREA_FIELDS.has(targetField)}>
                <textarea
                  value={proposedValue}
                  onChange={(e) => setProposedValue(e.target.value)}
                  placeholder={FIELD_PLACEHOLDERS[targetField] || "Enter value..."}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </Show>
              <Show when={!TEXTAREA_FIELDS.has(targetField)}>
                <input
                  type={targetField === "email" ? "email" : "text"}
                  value={proposedValue}
                  onChange={(e) => setProposedValue(e.target.value)}
                  placeholder={FIELD_PLACEHOLDERS[targetField] || "Enter value..."}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </Show>
            </div>
          </Show>

          {/* Name change intent — correction (same person) vs succession (new holder) */}
          <Show when={targetField === "name"}>
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
              <Show when={nameChangeKind === "succession"}>
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
              </Show>
            </div>
          </Show>

          {/* Party change intent — correction (wrong party) vs defection (dated change) */}
          <Show when={targetField === "partyAcronym"}>
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
              <Show when={partyChangeKind === "defection"}>
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
              </Show>
            </div>
          </Show>

          {/* Source URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Source URL
              <Show when={RELATIONAL_FIELDS.has(targetField)}>
                <span className="text-red-500 ml-1">*</span>
              </Show>
              <Show when={!RELATIONAL_FIELDS.has(targetField)}>
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              </Show>
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
