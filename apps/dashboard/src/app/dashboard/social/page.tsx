"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, CheckCircle2, XCircle, Send } from "lucide-react";
import { socialsFetch } from "@/lib/api";
import { DraftCard } from "@/components/socials/draft-card";
import { XConnectionCard } from "@/components/socials/x-connection-card";
import type {
  DraftListResponse,
  DraftRow,
} from "@/components/socials/types";

interface QueueStats {
  pending: number;
  approved: number;
  rejected: number;
  publishedToday: number;
}

export default function SocialQueuePage() {
  const [items, setItems] = useState<DraftRow[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const pageSize = 10;

  const fetchItems = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (statusFilter !== "all") params.set("reviewStatus", statusFilter);
    if (typeFilter !== "all") params.set("postType", typeFilter);

    socialsFetch(`/v1/replies?${params}`)
      .then((res: DraftListResponse) => {
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page, statusFilter, typeFilter]);

  const fetchStats = useCallback(() => {
    socialsFetch("/v1/replies/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold">Reply Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review AI-drafted quotes &amp; replies before they ship to{" "}
            <span className="text-foreground">@awanigeria</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/social/campaign">
            <Button variant="outline" size="sm">
              Campaign
            </Button>
          </Link>
          <Link href="/dashboard/social/topics">
            <Button variant="outline" size="sm">
              Topics
            </Button>
          </Link>
          <Link href="/dashboard/social/sessions">
            <Button variant="outline" size="sm">
              Sessions
            </Button>
          </Link>
          <Link href="/dashboard/social/funnel">
            <Button variant="outline" size="sm">
              Funnel
            </Button>
          </Link>
          <Link href="/dashboard/social/analytics">
            <Button variant="outline" size="sm">
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      <XConnectionCard />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600" },
            { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-600" },
            { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600" },
            { label: "Published Today", value: stats.publishedToday, icon: Send, color: "text-foreground" },
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

      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="edited">Edited</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="reply">Replies</SelectItem>
            <SelectItem value="quote">Quotes</SelectItem>
            <SelectItem value="identify_seat">Identify seat</SelectItem>
            <SelectItem value="proposal_verify">Verify proposal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>No drafts yet — waiting on roamer + drafter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <DraftCard key={d.id} draft={d} onChanged={fetchItems} />
          ))}
        </div>
      )}

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
