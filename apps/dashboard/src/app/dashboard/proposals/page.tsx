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
  ExternalLink,
  User,
} from "lucide-react";

interface ProposalItem {
  id: string;
  officialId: string;
  officialName: string;
  targetField: string;
  proposedValue: any;
  sourceUrl: string | null;
  status: string;
  voteScore: number;
  voteCount: number;
  createdAt: string;
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

async function proposalFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api/proposals${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...opts?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState(false);

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

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  async function handleAction(id: string, action: "approve" | "reject" | "needs_evidence") {
    setActing(true);
    try {
      await proposalFetch(`/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await loadProposals();
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
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && statusFilter === "submitted" && (
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

      {/* Proposals list */}
      {loading ? (
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
        <div className="space-y-2">
          {/* Select all */}
          {statusFilter === "submitted" && (
            <label className="flex items-center gap-2 px-3 py-1 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={selected.size === proposals.length}
                onChange={toggleAll}
                className="rounded"
              />
              Select all
            </label>
          )}

          {proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox for bulk */}
                  {statusFilter === "submitted" && (
                    <input
                      type="checkbox"
                      checked={selected.has(proposal.id)}
                      onChange={() => toggleSelect(proposal.id)}
                      className="mt-1 rounded"
                    />
                  )}

                  {/* Vote score */}
                  <div className="flex flex-col items-center w-10 shrink-0">
                    <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-mono font-bold">
                      {proposal.voteScore}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {proposal.officialName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {FIELD_LABELS[proposal.targetField] || proposal.targetField}
                      </Badge>
                      <Badge
                        className={`text-xs ${STATUS_COLORS[proposal.status] || ""}`}
                      >
                        {proposal.status}
                      </Badge>
                    </div>

                    {proposal.targetField === "imageUrl" && typeof (proposal.proposedValue as any)?.value === "string" && ((proposal.proposedValue as any).value.startsWith("data:image") || (proposal.proposedValue as any).value.startsWith("http")) ? (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Proposed:</span>
                        <img
                          src={(proposal.proposedValue as any).value}
                          alt="Proposed photo"
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        Proposed: {(proposal.proposedValue as any)?.value || JSON.stringify(proposal.proposedValue)}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
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
                  </div>

                  {/* Actions */}
                  {(proposal.status === "submitted" || proposal.status === "under_review") && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(proposal.id, "approve")}
                        disabled={acting}
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(proposal.id, "reject")}
                        disabled={acting}
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(proposal.id, "needs_evidence")}
                        disabled={acting}
                        title="Needs Evidence"
                      >
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
