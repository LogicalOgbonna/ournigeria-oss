"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
  MessageSquare,
  Bug,
  Lightbulb,
  Database,
  HelpCircle,
  Paperclip,
  User,
  ChevronRight,
} from "lucide-react";
import { adminFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

interface FeedbackItem {
  id: string;
  userId: string;
  user: {
    id: string;
    phoneNumber: string | null;
    telegramId: string | null;
    name: string | null;
  };
  category: string;
  subject: string;
  message: string;
  status: string;
  attachmentCount: number;
  createdAt: string;
}

interface Stats {
  total: number;
  new: number;
  reviewing: number;
  resolved: number;
  archived: number;
}

const categoryIcons: Record<string, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  data_issue: Database,
  general: HelpCircle,
};

const categoryColors: Record<string, string> = {
  bug: "text-red-500",
  feature: "text-blue-500",
  data_issue: "text-amber-500",
  general: "text-slate-500",
};

const statusColors: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  reviewing:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  resolved:
    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  archived:
    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

function userLabel(user: FeedbackItem["user"]) {
  if (user.name) return user.name;
  if (user.phoneNumber) return user.phoneNumber;
  if (user.telegramId) return `TG:${user.telegramId}`;
  return user.id.slice(0, 8);
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const limit = 25;

  const fetchFeedback = useCallback(
    (p: number, status: string, category: string) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (status !== "all") params.set("status", status);
      if (category !== "all") params.set("category", category);

      adminFetch(`/feedback?${params}`)
        .then((res) => {
          setFeedback(res.data ?? []);
          setTotal(res.total ?? 0);
        })
        .catch(() => setFeedback([]))
        .finally(() => setLoading(false));
    },
    [],
  );

  const fetchStats = useCallback(() => {
    adminFetch("/feedback/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchFeedback(page, statusFilter, categoryFilter);
  }, [page, statusFilter, categoryFilter, fetchFeedback]);

  if (loading && feedback.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Feedback</h1>
        <p className="text-muted-foreground text-sm mt-1">
          User feedback and reports ({total} total)
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "New", value: stats.new, color: "text-emerald-600" },
            { label: "Reviewing", value: stats.reviewing, color: "text-blue-600" },
            { label: "Resolved", value: stats.resolved, color: "text-slate-600" },
            { label: "Archived", value: stats.archived, color: "text-slate-400" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-3 px-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="data_issue">Data Issue</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback list */}
      {feedback.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>No feedback found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {feedback.map((item) => {
            const Icon = categoryIcons[item.category] || HelpCircle;
            return (
              <Link
                key={item.id}
                href={`/dashboard/feedback/${item.id}`}
                className="block"
              >
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Icon
                          className={`h-4 w-4 ${categoryColors[item.category] || "text-muted-foreground"}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {item.subject}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${statusColors[item.status] || ""}`}
                          >
                            {item.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.category.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {item.message}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {userLabel(item.user)}
                          </span>
                          {item.attachmentCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {item.attachmentCount}
                            </span>
                          )}
                          <span>{formatDateTime(item.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
