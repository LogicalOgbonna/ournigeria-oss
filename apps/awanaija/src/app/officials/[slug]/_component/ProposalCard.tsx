"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react";
import type { Proposal } from "@/lib/api";
import { voteOnProposal } from "@/lib/api";
import { Show } from "@/components/ui/Show";
import { FIELD_LABELS } from "./constants";

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

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export function ProposalCard({ proposal }: { proposal: Proposal }) {
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
            type="button"
            className="w-9 h-9 rounded-lg border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-center transition-all hover:bg-white/[0.08] hover:border-emerald-400/40 disabled:opacity-50"
          >
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
          </button>
          <span className="font-mono text-xs text-slate-500">{upvotes}</span>
          <button
            onClick={() => handleVote(-1)}
            disabled={voting}
            type="button"
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
          <Show when={!!(isIdentifyProposal && imageUrl)}>
            <div className="mb-3">
              <img
                src={imageUrl}
                alt={identifyName ?? "Submitted official photo"}
                className="w-20 h-20 rounded-xl object-cover border border-black/[0.06] dark:border-white/10"
              />
            </div>
          </Show>
          <Show when={!isIdentifyProposal && proposal.targetField === "imageUrl" && typeof value === "string" && (value.startsWith("data:image") || value.startsWith("http"))}>
            <div className="mb-2">
              <img
                src={value}
                alt="Proposed official"
                className="w-20 h-20 rounded-xl object-cover border border-black/[0.06] dark:border-white/10"
              />
            </div>
          </Show>
          <Show when={!(!isIdentifyProposal && proposal.targetField === "imageUrl" && typeof value === "string" && (value.startsWith("data:image") || value.startsWith("http")))}>
            <p className="text-sm text-slate-800 dark:text-white mb-2">{value}</p>
          </Show>
          <Show when={isIdentifyProposal && identifyDetails.length > 0}>
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
          </Show>
          <Show when={!!proposal.sourceUrl}>
            <a
              href={proposal.sourceUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-500 hover:opacity-75 transition-opacity inline-flex items-center gap-1 mb-1.5"
            >
              View source <ExternalLink className="w-3 h-3" />
            </a>
          </Show>
          <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            {new Date(proposal.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <Show when={showOwnVoteModal}>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowOwnVoteModal(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setShowOwnVoteModal(false); }}
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
              type="button"
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </Show>
    </>
  );
}
