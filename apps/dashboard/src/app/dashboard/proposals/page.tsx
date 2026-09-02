"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ArrowRight,
  User,
  Crown,
} from "lucide-react";
import { relativeTime } from "@/lib/format";
import { proposalsFetch as proposalFetch } from "@/lib/api";

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ournigeria.ng";

interface SeatCandidate {
  id: string;
  name: string;
  partyAcronym: string | null;
  sourceUrl: string | null;
  trust?: "verified" | "anonymous";
  proposerPhone: string | null;
  status: string;
  voteScore: number;
  confirmCount: number;
  disputeCount: number;
  voteCount: number;
  createdAt: string;
}

interface SeatGroup {
  positionId: string;
  officialId: string;
  topVoteScore: number;
  seat: {
    role: string | null;
    stateCode: string | null;
    lgaCode: string | null;
    wardCode: string | null;
    constituencyCode: string | null;
  };
  candidates: SeatCandidate[];
}

const ROLE_LABELS: Record<string, string> = {
  councilor: "Ward Councilor",
  lga_chairman: "LGA Chairman",
  mha: "State Assembly",
  rep: "House of Reps",
  representative: "House of Reps",
  senator: "Senator",
  governor: "Governor",
};

function seatLabel(seat: SeatGroup["seat"]): string {
  const role = seat.role ? ROLE_LABELS[seat.role] || seat.role : "Seat";
  const code =
    seat.wardCode ||
    seat.lgaCode ||
    seat.constituencyCode ||
    seat.stateCode ||
    "—";
  return `${role} · ${code}`;
}

interface ProposalItem {
  id: string;
  officialId: string;
  officialName: string;
  targetField: string;
  currentValue: any;
  proposedValue: any;
  sourceUrl: string | null;
  proposerPhone: string | null;
  trust?: "verified" | "anonymous";
  status: string;
  voteScore: number;
  upvoteCount: number;
  downvoteCount: number;
  voteCount: number;
  createdAt: string;
}

/** Unwrap the `{ value, type }` envelope community proposals use, else the raw value. */
function unwrapValue(v: any): unknown {
  if (v && typeof v === "object" && "value" in v) return v.value;
  return v;
}

function displayValue(v: unknown): string {
  const raw = unwrapValue(v);
  if (raw === null || raw === undefined || raw === "") return "—";
  if (typeof raw === "string") return raw;
  return JSON.stringify(raw);
}

function isImageValue(v: unknown): v is string {
  const raw = unwrapValue(v);
  return (
    typeof raw === "string" &&
    (raw.startsWith("data:image") || /^https?:\/\//.test(raw))
  );
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  imageUrl: "Photo",
  email: "Email",
  phoneNumber: "Phone",
  officeAddress: "Office Address",
  twitterHandle: "Twitter",
  facebookUrl: "Facebook",
  education: "Education",
  biography: "Biography",
  gender: "Gender",
  dateOfBirth: "Date of Birth",
  partyAcronym: "Party",
  wardCode: "Ward",
  lgaCode: "LGA",
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-yellow-100 text-yellow-700",
  under_review: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  needs_evidence: "bg-orange-100 text-orange-700",
};

/* ── Structured citizen contributions (Plan 55): add:/edit: proposals ── */

const RECORD_TYPE_LABELS: Record<string, string> = {
  education: "Education",
  career: "Career",
  party_affiliation: "Party affiliation",
  committee: "Committee",
  sponsored_bill: "Sponsored bill",
  election: "Election",
  asset_declaration: "Asset declaration",
  award: "Award",
  publication: "Publication",
  family_member: "Family member",
  legal_case: "Legal case",
};
const SENSITIVE_RECORD_TYPES = new Set(["legal_case", "asset_declaration"]);

function isRecordProposal(p: ProposalItem): boolean {
  return (
    typeof p.targetField === "string" &&
    (p.targetField.startsWith("add:") || p.targetField.startsWith("edit:"))
  );
}

/** "startYear" → "Start Year" */
function humanizeKey(k: string): string {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

/** Labeled, human-readable review card for a structured citizen contribution. */
function RecordProposalCard({ proposal }: { proposal: ProposalItem }) {
  const pv: any = proposal.proposedValue;
  if (!pv || pv.type !== "record") {
    return (
      <span className="font-mono text-sm break-words min-w-0 line-clamp-4">
        {displayValue(proposal.proposedValue)}
      </span>
    );
  }
  const label = RECORD_TYPE_LABELS[pv.recordType] ?? pv.recordType;
  const sensitive = SENSITIVE_RECORD_TYPES.has(pv.recordType);
  return (
    <div className="space-y-1.5 text-sm min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold">
          {pv.op === "add" ? `Add ${label}` : `Correct ${label}`}
        </span>
        {sensitive && (
          <span className="rounded bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300">
            sensitive · source required
          </span>
        )}
      </div>
      {pv.op === "add" ? (
        <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5">
          {Object.entries(pv.data ?? {}).map(([k, v]) => (
            <div key={k} className="contents">
              <span className="text-muted-foreground">{humanizeKey(k)}</span>
              <span className="break-words min-w-0">{String(v)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="break-words">
          <span className="text-muted-foreground">{humanizeKey(String(pv.field ?? ""))}: </span>
          <span className="line-through opacity-60">{String(pv.currentValue ?? "—")}</span>
          <span className="mx-1">→</span>
          <span className="font-medium text-emerald-700 dark:text-emerald-400">{String(pv.value)}</span>
        </div>
      )}
      {proposal.sourceUrl && (
        <a
          href={proposal.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-blue-600 dark:text-blue-400 underline break-all"
        >
          {proposal.sourceUrl}
        </a>
      )}
    </div>
  );
}

export default function ProposalsPage() {
  const [viewMode, setViewMode] = useState<"flat" | "grouped">("flat");
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [groups, setGroups] = useState<SeatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState(false);
  // Per-proposal effective date (YYYY-MM-DD) for a succession/defection approval.
  const [effectiveDates, setEffectiveDates] = useState<Record<string, string>>({});

  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await proposalFetch(`/admin/queue?status=${statusFilter}&limit=50`);
      setProposals(data.data);
      setSelected(new Set());
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await proposalFetch(`/admin/queue/grouped?limit=50`);
      setGroups(data.data);
    } catch (err) {
      console.error("Failed to load grouped proposals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "grouped") {
      loadGroups();
    } else {
      loadProposals();
    }
  }, [viewMode, loadProposals, loadGroups]);

  async function handleAction(
    id: string,
    action: "approve" | "reject" | "needs_evidence",
    // For name/party proposals: the authoritative correction-vs-event decision plus
    // the effective date of a succession/defection.
    opts?: {
      nameChangeKind?: "correction" | "succession";
      partyChangeKind?: "correction" | "defection";
      effectiveDate?: string;
    },
  ) {
    if (
      opts?.nameChangeKind === "succession" &&
      !confirm(
        "Approve as a NEW officeholder?\n\nThis ends the current official's tenure and creates a brand-new official for the new name. The existing official (and their record) is kept unchanged. This cannot be undone from here.",
      )
    ) {
      return;
    }
    if (
      opts?.partyChangeKind === "defection" &&
      !confirm(
        "Approve as a real party change (defection)?\n\nThis records a dated party affiliation and keeps the previous party as history, rather than overwriting it.",
      )
    ) {
      return;
    }
    setActing(true);
    try {
      await proposalFetch(`/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          ...(opts?.nameChangeKind ? { nameChangeKind: opts.nameChangeKind } : {}),
          ...(opts?.partyChangeKind ? { partyChangeKind: opts.partyChangeKind } : {}),
          ...(opts?.effectiveDate ? { effectiveDate: opts.effectiveDate } : {}),
        }),
      });
      await loadProposals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActing(false);
    }
  }

  async function handleSeatAction(id: string, action: "approve" | "reject") {
    setActing(true);
    try {
      await proposalFetch(`/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await loadGroups();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActing(false);
    }
  }

  async function handleBulkAction(action: "approve" | "reject") {
    if (selected.size === 0) return;
    setActing(true);
    try {
      await proposalFetch("/admin/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      await loadProposals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActing(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === proposals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(proposals.map((p) => p.id)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proposal Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve community-submitted data proposals
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("flat")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "flat"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Field changes
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "grouped"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Identify (by seat)
            </button>
          </div>
          {viewMode === "flat" && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="needs_evidence">Needs Evidence</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {viewMode === "flat" && selected.size > 0 && statusFilter === "submitted" && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button
            size="sm"
            variant="default"
            onClick={() => handleBulkAction("approve")}
            disabled={acting}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Bulk Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleBulkAction("reject")}
            disabled={acting}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Bulk Reject
          </Button>
        </div>
      )}

      {/* Proposals list (flat / field changes) */}
      {viewMode === "flat" &&
        (loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No {statusFilter} proposals.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Select all */}
          {statusFilter === "submitted" && (
            <label className="flex items-center gap-2 px-1 py-1 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={selected.size === proposals.length}
                onChange={toggleAll}
                className="rounded"
              />
              Select all
            </label>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-stretch">
            {proposals.map((proposal) => {
              const hasCurrent =
                proposal.currentValue !== null &&
                proposal.currentValue !== undefined &&
                proposal.currentValue !== "";
              const isImageField = proposal.targetField === "imageUrl";
              const isRecord = isRecordProposal(proposal);
              const recordOp = isRecord ? (proposal.proposedValue as any)?.op : null;
              const fieldLabel = isRecord
                ? recordOp === "edit"
                  ? "Correct record"
                  : "Add record"
                : FIELD_LABELS[proposal.targetField] || proposal.targetField;
              const reviewable =
                proposal.status === "submitted" ||
                proposal.status === "under_review";
              // A name change is either a correction (rename same official) or a
              // succession (new officeholder → new official). Identify proposals
              // (type:"identify") fill an empty seat and are handled elsewhere.
              const isNameChange =
                proposal.targetField === "name" &&
                (proposal.proposedValue as any)?.type !== "identify";
              const submittedIntent: "correction" | "succession" =
                (proposal.proposedValue as any)?.nameChangeKind === "succession"
                  ? "succession"
                  : "correction";
              // A party change is either a correction (fix wrong party in place) or a
              // defection (dated affiliation event that preserves history).
              const isPartyChange = proposal.targetField === "partyAcronym";
              const submittedPartyIntent: "correction" | "defection" =
                (proposal.proposedValue as any)?.partyChangeKind === "defection"
                  ? "defection"
                  : "correction";
              const submittedEffectiveDate =
                (proposal.proposedValue as any)?.effectiveDate as string | undefined;
              const effDate = effectiveDates[proposal.id] ?? submittedEffectiveDate ?? "";
              const setEffDate = (v: string) =>
                setEffectiveDates((m) => ({ ...m, [proposal.id]: v }));

              return (
                <Card key={proposal.id} className="flex flex-col h-full">
                  <CardContent className="p-4 flex flex-col gap-2.5 flex-1">
                    {/* Header: checkbox + official link + vote tally */}
                    <div className="flex items-start gap-2">
                      {statusFilter === "submitted" && (
                        <input
                          type="checkbox"
                          checked={selected.has(proposal.id)}
                          onChange={() => toggleSelect(proposal.id)}
                          className="mt-1 rounded shrink-0"
                        />
                      )}
                      <a
                        href={`${PUBLIC_SITE_URL}/officials/${proposal.officialId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 min-w-0 flex-1 font-medium text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
                        title={proposal.officialName}
                      >
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{proposal.officialName}</span>
                        <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                      </a>
                      {/* Vote tally */}
                      <div className="flex items-center gap-1.5 shrink-0 rounded-md bg-muted/60 px-2 py-1">
                        <span className="font-mono text-sm font-bold leading-none">
                          {proposal.voteScore > 0 ? `+${proposal.voteScore}` : proposal.voteScore}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-0.5">
                            <ThumbsUp className="w-2.5 h-2.5" />
                            {proposal.upvoteCount}
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <ThumbsDown className="w-2.5 h-2.5" />
                            {proposal.downvoteCount}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Badges: field + change kind + status */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {fieldLabel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          hasCurrent || recordOp === "edit"
                            ? "border-amber-300 text-amber-700 dark:text-amber-400"
                            : "border-emerald-300 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {isRecord
                          ? recordOp === "edit"
                            ? "correction"
                            : "new record"
                          : hasCurrent
                            ? "overwrite"
                            : "fill"}
                      </Badge>
                      <Badge
                        className={`text-xs ${STATUS_COLORS[proposal.status] || ""}`}
                      >
                        {proposal.status}
                      </Badge>
                    </div>

                    {/* Value diff: current -> proposed */}
                    {isRecord ? (
                      <RecordProposalCard proposal={proposal} />
                    ) : isImageField ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        {hasCurrent && isImageValue(proposal.currentValue) && (
                          <>
                            <img
                              src={unwrapValue(proposal.currentValue) as string}
                              alt="Current photo"
                              className="w-14 h-14 rounded-lg object-cover border opacity-70 grayscale"
                            />
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </>
                        )}
                        {isImageValue(proposal.proposedValue) ? (
                          <img
                            src={unwrapValue(proposal.proposedValue) as string}
                            alt="Proposed photo"
                            className="w-14 h-14 rounded-lg object-cover border"
                          />
                        ) : (
                          <span className="font-mono text-sm break-words">
                            {displayValue(proposal.proposedValue)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm min-w-0">
                        {hasCurrent && (
                          <div className="flex items-start gap-1.5 text-muted-foreground">
                            <span className="font-mono line-through break-words min-w-0 line-clamp-3">
                              {displayValue(proposal.currentValue)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-1.5">
                          {hasCurrent && (
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                          <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400 break-words min-w-0 line-clamp-4">
                            {displayValue(proposal.proposedValue)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Footer metadata */}
                    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground">
                      <span title={new Date(proposal.createdAt).toLocaleString()}>
                        {relativeTime(proposal.createdAt)}
                      </span>
                      {proposal.trust === "anonymous" ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 font-medium">
                          Anonymous
                        </span>
                      ) : (
                        proposal.proposerPhone && (
                          <span className="font-mono truncate max-w-full">by {proposal.proposerPhone}</span>
                        )
                      )}
                      <span>{proposal.voteCount} votes</span>
                      {proposal.sourceUrl && (
                        <a
                          href={proposal.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline inline-flex items-center gap-1"
                        >
                          Source <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Name change: make the correction-vs-succession call explicit. */}
                    {reviewable && isNameChange && (
                      <div className="mt-auto rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-2 flex flex-col gap-1.5">
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          Submitted as{" "}
                          <span className="font-semibold">
                            {submittedIntent === "succession" ? "new officeholder" : "name correction"}
                          </span>
                          . Confirm how to apply:
                        </p>
                        <label className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          Term start (for new holder):
                          <input
                            type="date"
                            value={effDate}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setEffDate(e.target.value)}
                            className="rounded border border-amber-300/60 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[11px]"
                          />
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            className="flex-1 px-2"
                            onClick={() => handleAction(proposal.id, "approve", { nameChangeKind: "correction" })}
                            disabled={acting}
                            title="Same person — rename and redirect the old URL"
                          >
                            <CheckCircle className="w-4 h-4 mr-1 shrink-0" /> Correction
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 px-2"
                            onClick={() =>
                              handleAction(proposal.id, "approve", {
                                nameChangeKind: "succession",
                                effectiveDate: effDate || undefined,
                              })
                            }
                            disabled={acting}
                            title="New person — end the current tenure and create a new official"
                          >
                            <User className="w-4 h-4 mr-1 shrink-0" /> New holder
                          </Button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 px-2"
                            onClick={() => handleAction(proposal.id, "needs_evidence")}
                            disabled={acting}
                            title="Needs evidence"
                          >
                            <AlertCircle className="w-4 h-4 mr-1 shrink-0 text-orange-500" /> Evidence
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 px-2 text-red-500 hover:text-red-600"
                            onClick={() => handleAction(proposal.id, "reject")}
                            disabled={acting}
                          >
                            <XCircle className="w-4 h-4 mr-1 shrink-0" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Party change: correction (fix in place) vs defection (dated event). */}
                    {reviewable && isPartyChange && (
                      <div className="mt-auto rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-2 flex flex-col gap-1.5">
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          Submitted as{" "}
                          <span className="font-semibold">
                            {submittedPartyIntent === "defection" ? "party defection" : "party correction"}
                          </span>
                          . Confirm how to apply:
                        </p>
                        <label className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          Defection date:
                          <input
                            type="date"
                            value={effDate}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setEffDate(e.target.value)}
                            className="rounded border border-amber-300/60 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[11px]"
                          />
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            className="flex-1 px-2"
                            onClick={() => handleAction(proposal.id, "approve", { partyChangeKind: "correction" })}
                            disabled={acting}
                            title="Wrong party recorded — fix in place"
                          >
                            <CheckCircle className="w-4 h-4 mr-1 shrink-0" /> Correction
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 px-2"
                            onClick={() =>
                              handleAction(proposal.id, "approve", {
                                partyChangeKind: "defection",
                                effectiveDate: effDate || undefined,
                              })
                            }
                            disabled={acting}
                            title="Real party change — record a dated affiliation, keep history"
                          >
                            <User className="w-4 h-4 mr-1 shrink-0" /> Defection
                          </Button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 px-2"
                            onClick={() => handleAction(proposal.id, "needs_evidence")}
                            disabled={acting}
                            title="Needs evidence"
                          >
                            <AlertCircle className="w-4 h-4 mr-1 shrink-0 text-orange-500" /> Evidence
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 px-2 text-red-500 hover:text-red-600"
                            onClick={() => handleAction(proposal.id, "reject")}
                            disabled={acting}
                          >
                            <XCircle className="w-4 h-4 mr-1 shrink-0" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Actions pinned to bottom */}
                    {reviewable && !isNameChange && !isPartyChange && (
                      <div className="mt-auto flex items-center gap-1.5 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 px-2"
                          onClick={() => handleAction(proposal.id, "approve")}
                          disabled={acting}
                        >
                          <CheckCircle className="w-4 h-4 mr-1 shrink-0" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 px-2"
                          onClick={() => handleAction(proposal.id, "needs_evidence")}
                          disabled={acting}
                          title="Needs evidence"
                        >
                          <AlertCircle className="w-4 h-4 mr-1 shrink-0 text-orange-500" /> Evidence
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 px-2 text-red-500 hover:text-red-600"
                          onClick={() => handleAction(proposal.id, "reject")}
                          disabled={acting}
                        >
                          <XCircle className="w-4 h-4 mr-1 shrink-0" /> Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Grouped list (identify by seat) */}
      {viewMode === "grouped" &&
        (loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No seats awaiting identification.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.positionId}>
                <CardContent className="p-4 flex flex-col gap-3">
                  {/* Seat header */}
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`${PUBLIC_SITE_URL}/officials/${group.officialId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 min-w-0 font-semibold text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
                      title={seatLabel(group.seat)}
                    >
                      <User className="w-4 h-4 shrink-0" />
                      <span className="truncate">{seatLabel(group.seat)}</span>
                      <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                    </a>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {group.candidates.length}{" "}
                      {group.candidates.length === 1 ? "candidate" : "candidates"}
                    </Badge>
                  </div>

                  {/* Ranked candidates */}
                  <div className="flex flex-col gap-2">
                    {group.candidates.map((cand, idx) => {
                      const isLeader = idx === 0;
                      const reviewable =
                        cand.status === "submitted" ||
                        cand.status === "under_review";
                      return (
                        <div
                          key={cand.id}
                          className={`rounded-lg border p-3 flex flex-col gap-2 ${
                            isLeader
                              ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex items-center gap-1.5">
                              {isLeader && (
                                <Crown className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                              )}
                              <span className="font-medium text-sm truncate">
                                {cand.name}
                              </span>
                              {cand.partyAcronym && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] shrink-0"
                                >
                                  {cand.partyAcronym}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 rounded-md bg-muted/60 px-2 py-1">
                              <span className="font-mono text-sm font-bold leading-none">
                                {cand.voteScore > 0
                                  ? `+${cand.voteScore}`
                                  : cand.voteScore}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <span className="inline-flex items-center gap-0.5">
                                  <ThumbsUp className="w-2.5 h-2.5" />
                                  {cand.confirmCount}
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                  <ThumbsDown className="w-2.5 h-2.5" />
                                  {cand.disputeCount}
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground">
                            <span
                              title={new Date(cand.createdAt).toLocaleString()}
                            >
                              {relativeTime(cand.createdAt)}
                            </span>
                            {cand.trust === "anonymous" || !cand.proposerPhone ? (
                              <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 font-medium">
                                Anonymous
                              </span>
                            ) : (
                              <span className="font-mono truncate max-w-full">
                                by {cand.proposerPhone}
                              </span>
                            )}
                            <span>{cand.voteCount} votes</span>
                            {cand.sourceUrl && (
                              <a
                                href={cand.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:underline inline-flex items-center gap-1"
                              >
                                Source <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {/* Actions */}
                          {reviewable && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <Button
                                size="sm"
                                className="px-3"
                                onClick={() =>
                                  handleSeatAction(cand.id, "approve")
                                }
                                disabled={acting}
                              >
                                <CheckCircle className="w-4 h-4 mr-1 shrink-0" />{" "}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="px-3 text-red-500 hover:text-red-600"
                                onClick={() =>
                                  handleSeatAction(cand.id, "reject")
                                }
                                disabled={acting}
                              >
                                <XCircle className="w-4 h-4 mr-1 shrink-0" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
    </div>
  );
}
