"use client";

import { useEffect, useState, useCallback } from "react";
import { ConversationTable, type ConversationRow } from "@/components/conversations/conversation-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { adminFetch } from "@/lib/api";

const PAGE_SIZE = 20;

const placeholderConversations: ConversationRow[] = Array.from({ length: 15 }, (_, i) => ({
  id: `conv-${i + 1}`,
  title: [
    "What is Lagos state budget for education?",
    "How much was allocated to healthcare in Kano?",
    "Show me corruption cases in Rivers state",
    "Federal budget breakdown 2025",
    "Compare Ogun and Oyo education spending",
    "Infrastructure spending in Abuja FCT",
    "How is the budget distributed across states?",
    "Teacher salary allocations by state",
    "Water supply budget for Northern states",
    "What are the biggest corruption cases?",
    "Defence budget analysis",
    "Agricultural spending trends",
    "Road construction allocations",
    "Health worker salary budgets",
    "Capital vs recurrent expenditure",
  ][i],
  userId: `user-${(i % 5) + 1}`,
  userIdentifier: `+234801${String(2345678 + i * 111111).slice(0, 7)}`,
  messageCount: Math.floor(Math.random() * 15) + 2,
  flagged: i === 2 || i === 9,
  createdAt: new Date(Date.now() - i * 7200000).toISOString(),
  lastMessageAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("q", debouncedSearch);
      const res = await adminFetch(`/conversations?${params}`);
      setConversations(res.data ?? res);
      setTotal(res.total ?? 0);
    } catch {
      const filtered = placeholderConversations.filter(
        (c) => !debouncedSearch || c.title?.toLowerCase().includes(debouncedSearch.toLowerCase()),
      );
      setConversations(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Conversations</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse and review all user conversations ({total} total)</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
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
