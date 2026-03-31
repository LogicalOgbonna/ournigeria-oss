"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle,
  Check,
  X,
  Pencil,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
} from "lucide-react";
import { socialsFetch } from "@/lib/api";

interface ReplyCandidate {
  id: string;
  tweetId: string;
  tweetText: string;
  tweetAuthor: string;
  tweetAuthorHandle: string;
  draftReply: string;
  confidenceScore: number;
  reviewStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface ReplyStats {
  pending: number;
  recommended: number;
  approved: number;
  rejected: number;
  publishedToday: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function confidenceColor(score: number) {
  if (score >= 0.8) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 0.6) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function confidenceBadgeColor(score: number) {
  if (score >= 0.8)
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400";
  if (score >= 0.6)
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400";
}

const statusColors: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
  recommended:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  rejected:
    "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

export default function SocialReplyQueuePage() {
  const [replies, setReplies] = useState<ReplyCandidate[]>([]);
  const [stats, setStats] = useState<ReplyStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const limit = 20;

  const fetchReplies = useCallback(
    (p: number, status: string) => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(p),
        limit: String(limit),
      });
      if (status !== "all") params.set("reviewStatus", status);

      socialsFetch(`/replies?${params}`)
        .then((res) => {
          setReplies(res.data ?? []);
          setTotal(res.total ?? 0);
        })
        .catch(() => setReplies([]))
        .finally(() => setLoading(false));
    },
    [],
  );

  const fetchStats = useCallback(() => {
    socialsFetch("/replies/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchReplies(page, statusFilter);
  }, [page, statusFilter, fetchReplies]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await socialsFetch(`/replies/${id}/approve`, { method: "POST" });
      fetchReplies(page, statusFilter);
      fetchStats();
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    try {
      await socialsFetch(`/replies/${id}/reject`, { method: "POST" });
      fetchReplies(page, statusFilter);
      fetchStats();
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveEdit(id: string) {
    setActionLoading(id);
    try {
      await socialsFetch(`/replies/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ draftReply: editDraft }),
      });
      setEditingId(null);
      fetchReplies(page, statusFilter);
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  }

  if (loading && replies.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Reply Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and approve AI-drafted social media replies ({total} total)
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              label: "Pending",
              value: stats.pending,
              color: "text-amber-600",
              icon: Clock,
            },
            {
              label: "Recommended",
              value: stats.recommended,
              color: "text-blue-600",
              icon: MessageCircle,
            },
            {
              label: "Approved",
              value: stats.approved,
              color: "text-emerald-600",
              icon: CheckCircle2,
            },
            {
              label: "Rejected",
              value: stats.rejected,
              color: "text-red-600",
              icon: XCircle,
            },
            {
              label: "Published Today",
              value: stats.publishedToday,
              color: "text-foreground",
              icon: Send,
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reply list */}
      {replies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>No replies found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {replies.map((item) => {
            const isEditing = editingId === item.id;
            const isActionLoading = actionLoading === item.id;

            return (
              <Card key={item.id}>
                <CardContent className="py-4">
                  <div className="space-y-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${statusColors[item.reviewStatus] || ""}`}
                        >
                          {item.reviewStatus}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${confidenceBadgeColor(item.confidenceScore)}`}
                        >
                          {Math.round(item.confidenceScore * 100)}% confidence
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Original tweet */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-medium">
                          {item.tweetAuthor}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{item.tweetAuthorHandle}
                        </span>
                      </div>
                      <p className="text-sm">{item.tweetText}</p>
                    </div>

                    {/* Draft reply */}
                    <div className="pl-4 border-l-2 border-emerald-500/30">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        Drafted Reply
                      </p>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            rows={3}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(item.id)}
                              disabled={isActionLoading}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{item.draftReply}</p>
                      )}
                    </div>

                    {/* Actions */}
                    {item.reviewStatus === "pending" ||
                    item.reviewStatus === "recommended" ? (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(item.id)}
                          disabled={isActionLoading}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(item.id)}
                          disabled={isActionLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                        {!isEditing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditDraft(item.draftReply);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
