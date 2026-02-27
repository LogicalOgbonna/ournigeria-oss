"use client";

import { useEffect, useState, useCallback } from "react";
import { ConversationTable, type ConversationRow } from "@/components/conversations/conversation-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { adminFetch } from "@/lib/api";

const PAGE_SIZE = 20;

const placeholderFlagged: ConversationRow[] = [
  {
    id: "conv-3",
    title: "Show me corruption cases in Rivers state",
    userId: "user-2",
    userIdentifier: "+2348023456789",
    messageCount: 8,
    flagged: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "conv-10",
    title: "What are the biggest corruption cases?",
    userId: "user-4",
    userIdentifier: "+2348045678901",
    messageCount: 12,
    flagged: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastMessageAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export default function FlaggedConversationsPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/conversations?flagged=true&page=${page}&limit=${PAGE_SIZE}`);
      setConversations(res.data ?? res);
      setTotal(res.total ?? 0);
    } catch {
      setConversations(placeholderFlagged);
      setTotal(placeholderFlagged.length);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
          <Flag className="h-4 w-4 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">Flagged Conversations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Conversations marked for review ({total} total)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : (
        <ConversationTable conversations={conversations} />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
