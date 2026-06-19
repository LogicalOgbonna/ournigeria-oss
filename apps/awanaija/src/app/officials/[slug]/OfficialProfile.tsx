"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  ExternalLink,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Pencil,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import type { Official, Proposal } from "@/lib/api";
import { voteOnProposal } from "@/lib/api";

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  imageUrl: "Photo",
  email: "Email",
  phoneNumber: "Phone Number",
  officeAddress: "Office Address",
  twitterHandle: "Twitter",
  facebookUrl: "Facebook",
  education: "Education",
  biography: "Biography",
  gender: "Gender",
  dateOfBirth: "Date of Birth",
  partyAcronym: "Political Party",
};

const ROLE_LABELS: Record<string, string> = {
  governor: "Governor",
  deputy_governor: "Deputy Governor",
  senator: "Senator",
  representative: "Federal Representative",
  rep: "Federal Representative",
  mha: "State House Member",
  lga_chairman: "LGA Chairman",
  councilor: "Councilor",
};

const TRACKED_FIELDS = [
  "name",
  "imageUrl",
  "email",
  "phoneNumber",
  "officeAddress",
  "twitterHandle",
  "facebookUrl",
  "education",
  "biography",
  "gender",
  "partyAcronym",
];

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function formatDateRange(startDate: string, endDate: string | null): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  if (endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  return `Since ${fmt(startDate)}`;
}

export function OfficialProfile({ official }: { official: Official }) {
  const [imgError, setImgError] = useState(false);
  const position = official.positions?.[0];
  const completeness = Math.round(official.completenessScore * 100);
  const missingFields = TRACKED_FIELDS.filter(
    (f) => f === "partyAcronym" ? !position?.party : !(official as unknown as Record<string, unknown>)[f],
  );
  const filledFields = TRACKED_FIELDS.filter(
    (f) => f === "partyAcronym" ? !!position?.party : !!(official as unknown as Record<string, unknown>)[f],
  );

  return (
    <main className="flex-grow pt-24 bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <div className="max-w-[672px] mx-auto px-6 pt-8 pb-16">
        {/* Back link */}
        <Link
          href="/officials"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-emerald-400 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to officials
        </Link>

        {/* Hero */}
        <div className="flex gap-6 items-start mb-7 max-[560px]:flex-col max-[560px]:items-center max-[560px]:text-center">
          {/* Photo */}
          <div className="w-[120px] h-[120px] min-w-[120px] rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
            {official.imageUrl && !imgError ? (
              <SmartImage
                src={official.imageUrl}
                alt={official.name}
                px={120}
                priority
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <User className="w-12 h-12 text-slate-400 opacity-35" />
            )}
          </div>

          <div className="flex-1 flex flex-col justify-between h-[120px] max-[560px]:h-auto max-[560px]:gap-3">
            <div>
              {/* Overline */}
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-emerald-400 mb-1">
                {position?.role || "Official"}
                {position?.party && (
                  <>
                    {" · "}
                    <Link
                      href={`/parties/${position.party}`}
                      className="hover:text-emerald-300 hover:underline"
                    >
                      {position.party}
                    </Link>
                  </>
                )}
              </div>

              {/* Name */}
              <h1 className="font-serif text-[30px] text-slate-900 dark:text-white leading-[1.1] max-[560px]:text-[24px]">
                {official.name}
              </h1>

              {/* Constituency */}
              {position && (
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">
                  {position.constituency || position.state || "Nigeria"}
                </p>
              )}

              {/* Term info */}
              {position?.termName && (
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mt-0.5">
                  {position.termName}
                </p>
              )}
              {position?.startDate && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {formatDateRange(position.startDate, position.endDate)}
                </p>
              )}
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[3px] bg-black/5 dark:bg-white/10 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-sm transition-[width] duration-600"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-emerald-400 whitespace-nowrap">
                {completeness}% complete
              </span>
            </div>
          </div>
        </div>

        {/* Contact pills */}
        <div className="flex flex-wrap gap-2.5 mb-9">
          {official.phoneNumber && (
            <ContactPill
              icon={<Phone className="w-3.5 h-3.5" />}
              value={official.phoneNumber}
              href={`tel:${official.phoneNumber}`}
            />
          )}
          {official.email && (
            <ContactPill
              icon={<Mail className="w-3.5 h-3.5" />}
              value={official.email}
              href={`mailto:${official.email}`}
            />
          )}
          {official.twitterHandle && (() => {
            const handle = official.twitterHandle!;
            // Extract username from URL if stored as a link
            const match = handle.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/);
            const username = match ? match[1] : handle.replace(/^@/, "");
            return (
              <ContactPill
                icon={
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                }
                value={`@${username}`}
                href={`https://x.com/${username}`}
                external
              />
            );
          })()}
          {official.facebookUrl && (() => {
            const raw = official.facebookUrl!;
            // Stored value may be a bare path (e.g. "facebook.com/page"); without a scheme the
            // browser resolves it relative to ournigeria.ng -> 404 on our own site. Mirror the
            // Twitter pill and rebuild an absolute URL.
            const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
            return (
              <ContactPill
                icon={
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                }
                value="Facebook"
                href={href}
                external
              />
            );
          })()}
        </div>

        {/* Office Address */}
        {official.officeAddress && (
          <section className="mb-9">
            <div className="border-l-[3px] border-emerald-400 pl-5">
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-emerald-400 mb-2.5">
                Office Address
              </div>
              <p className="font-sans text-[15px] text-slate-600 dark:text-slate-300 leading-[1.65]">
                {official.officeAddress}
              </p>
            </div>
          </section>
        )}

        {/* Biography */}
        {official.biography && (
          <section className="mb-9">
            <div className="border-l-[3px] border-emerald-400 pl-5">
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-emerald-400 mb-2.5">
                Biography
              </div>
              <p className="font-sans text-[15px] text-slate-600 dark:text-slate-300 leading-[1.65]">
                {official.biography}
              </p>
            </div>
          </section>
        )}

        {/* Education */}
        {official.education && (
          <section className="mb-9">
            <div className="border-l-[3px] border-emerald-400 pl-5">
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-emerald-400 mb-2.5">
                Education
              </div>
              <p className="font-sans text-[15px] text-slate-600 dark:text-slate-300 leading-[1.65]">
                {official.education}
              </p>
            </div>
          </section>
        )}

        {/* Help Complete This Profile */}
        {missingFields.length > 0 && (
          <section className="mb-9">
            <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white mb-4">
              Help Complete This Profile
            </h2>
            <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
              {missingFields.map((field) => (
                <Link
                  key={field}
                  href={`/proposals/new?officialId=${official.id}&targetField=${field}`}
                  className="flex items-center gap-2.5 border border-dashed border-emerald-400/40 rounded-xl px-4 py-4 transition-all hover:bg-emerald-400/[0.06] hover:border-emerald-400/70 group"
                >
                  <Plus className="w-[18px] h-[18px] text-emerald-400 shrink-0" />
                  <span className="text-[13px] text-emerald-400">
                    Add {FIELD_LABELS[field] || field}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Challenge / Correct Information */}
        {filledFields.length > 0 && (
          <ChallengeButton officialId={official.id} fields={filledFields} />
        )}

        {/* Community Proposals */}
        {official.proposals && official.proposals.length > 0 && (
          <section id="proposals">
            <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white mb-4">
              Community Proposals ({official.proposals.length})
            </h2>
            <div className="space-y-3">
              {official.proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ChallengeButton({
  officialId,
  fields,
}: {
  officialId: string;
  fields: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-9 relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 border border-red-500/30 dark:border-red-400/25 rounded-xl px-5 py-3 transition-all hover:bg-red-400/[0.08] hover:border-red-500/50 text-red-600 dark:text-red-400"
      >
        <Pencil className="w-4 h-4" />
        <span className="text-[13px] font-medium">Challenge Information</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white dark:bg-slate-900 border border-black/[0.08] dark:border-white/10 rounded-xl shadow-lg py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <p className="px-4 py-2 text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              What needs correcting?
            </p>
            {fields.map((field) => (
              <Link
                key={field}
                href={`/proposals/new?officialId=${officialId}&targetField=${field}`}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 transition-colors hover:bg-red-400/[0.08] hover:text-red-600 dark:hover:text-red-400"
                onClick={() => setOpen(false)}
              >
                {FIELD_LABELS[field] || field}
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ContactPill({
  icon,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="text-emerald-400 shrink-0">{icon}</span>
      <span className="truncate">{value}</span>
    </>
  );

  const cls =
    "inline-flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/10 rounded-full px-4 py-2 text-[13px] text-slate-600 dark:text-slate-300 transition-all hover:bg-emerald-400/[0.08] hover:border-emerald-400/25 max-w-full";

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={cls}
      >
        {inner}
      </a>
    );
  }
  return <span className={cls}>{inner}</span>;
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const [upvotes, setUpvotes] = useState(proposal.upvoteCount ?? 0);
  const [downvotes, setDownvotes] = useState(proposal.downvoteCount ?? 0);
  const [voting, setVoting] = useState(false);
  const [showOwnVoteModal, setShowOwnVoteModal] = useState(false);

  async function handleVote(direction: 1 | -1) {
    setVoting(true);
    try {
      const result = await voteOnProposal(proposal.id, direction);
      setUpvotes(result.upvoteCount);
      setDownvotes(result.downvoteCount);
      toast.success("Vote recorded!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Vote failed";
      if (msg.toLowerCase().includes("your own proposal")) {
        setShowOwnVoteModal(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setVoting(false);
    }
  }

  const proposalValue = proposal.proposedValue as Record<string, unknown>;
  const isIdentifyProposal = proposalValue?.type === "identify";
  const value =
    str(proposalValue?.displayValue) ??
    str(proposalValue?.value) ??
    JSON.stringify(proposal.proposedValue);
  const fieldLabel = isIdentifyProposal ? "Identity submission" : FIELD_LABELS[proposal.targetField] || proposal.targetField;
  const identifyScope =
    str(proposalValue?.wardCode) ||
    str(proposalValue?.lgaCode) ||
    str(proposalValue?.constituencyCode) ||
    str(proposalValue?.stateCode) ||
    null;
  const roleKey = str(proposalValue?.role);
  const imageUrl = str(proposalValue?.imageUrl);
  const identifyName = str(proposalValue?.name);
  const partyAcronym = str(proposalValue?.partyAcronym);
  const email = str(proposalValue?.email);
  const phoneNumber = str(proposalValue?.phoneNumber);
  const officeAddress = str(proposalValue?.officeAddress);
  const twitterHandle = str(proposalValue?.twitterHandle);
  const facebookUrl = str(proposalValue?.facebookUrl);
  const gender = str(proposalValue?.gender);
  const education = str(proposalValue?.education);
  const dateOfBirth = str(proposalValue?.dateOfBirth);
  const identifyDetails = [
    roleKey ? ROLE_LABELS[roleKey] ?? roleKey : null,
    partyAcronym ? `Party: ${partyAcronym}` : null,
    identifyScope ? `Scope: ${identifyScope}` : null,
    email ? `Email: ${email}` : null,
    phoneNumber ? `Phone: ${phoneNumber}` : null,
    officeAddress ? `Office: ${officeAddress}` : null,
    twitterHandle ? `Twitter: @${twitterHandle.replace(/^@/, "")}` : null,
    facebookUrl ? `Facebook: ${facebookUrl}` : null,
    gender ? `Gender: ${gender}` : null,
    education ? `Education: ${education}` : null,
    dateOfBirth ? `DOB: ${dateOfBirth}` : null,
  ].filter(Boolean);

  return (
    <>
      <div className="bg-black/[0.02] dark:bg-white/[0.05] rounded-xl p-5 flex gap-4 max-[560px]:flex-col">
        {/* Vote buttons */}
        <div className="flex flex-col items-center gap-2 shrink-0 max-[560px]:flex-row max-[560px]:justify-start">
          <button
            onClick={() => handleVote(1)}
            disabled={voting}
            className="w-9 h-9 rounded-lg border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-center transition-all hover:bg-white/[0.08] hover:border-emerald-400/40 disabled:opacity-50"
          >
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
          </button>
          <span className="font-mono text-xs text-slate-500">{upvotes}</span>
          <button
            onClick={() => handleVote(-1)}
            disabled={voting}
            className="w-9 h-9 rounded-lg border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-center transition-all hover:bg-white/[0.08] hover:border-red-400/40 disabled:opacity-50"
          >
            <ThumbsDown className="w-4 h-4 text-red-400" />
          </button>
          <span className="font-mono text-xs text-slate-500">{downvotes}</span>
        </div>

        {/* Proposal content */}
        <div className="flex-1 min-w-0">
          <span className="inline-block font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full mb-2.5">
            {fieldLabel}
          </span>
          {isIdentifyProposal && imageUrl ? (
            <div className="mb-3">
              <img
                src={imageUrl}
                alt={identifyName ?? "Submitted official photo"}
                className="w-20 h-20 rounded-xl object-cover border border-black/[0.06] dark:border-white/10"
              />
            </div>
          ) : null}
          {!isIdentifyProposal && proposal.targetField === "imageUrl" && typeof value === "string" && (value.startsWith("data:image") || value.startsWith("http")) ? (
            <div className="mb-2">
              <img
                src={value}
                alt="Proposed photo"
                className="w-20 h-20 rounded-xl object-cover border border-black/[0.06] dark:border-white/10"
              />
            </div>
          ) : (
            <p className="text-sm text-slate-800 dark:text-white mb-2">{value}</p>
          )}
          {isIdentifyProposal && identifyDetails.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-2.5">
              {identifyDetails.map((detail) => (
                <span
                  key={detail}
                  className="inline-block font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 rounded-full"
                >
                  {detail}
                </span>
              ))}
            </div>
          ) : null}
          {proposal.sourceUrl && (
            <a
              href={proposal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-500 hover:opacity-75 transition-opacity inline-flex items-center gap-1 mb-1.5"
            >
              View source <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            {new Date(proposal.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {showOwnVoteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowOwnVoteModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Can&apos;t vote on your own proposal
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              You submitted this proposal, so you can&apos;t vote on it. Share it
              with others to get their votes!
            </p>
            <button
              onClick={() => setShowOwnVoteModal(false)}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
