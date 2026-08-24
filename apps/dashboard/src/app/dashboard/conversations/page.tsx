"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useQueryState, parseAsStringEnum } from "nuqs";
import {
  ConversationTable,
  type ConversationRow,
} from "@/components/conversations/conversation-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { adminFetch } from "@/lib/api";

const PAGE_SIZE = 20;

type Filter = "all" | "flagged";

export default function ConversationsPage() {
  return (
    <Suspense fallback={<ConversationsSkeleton />}>
      <ConversationsView />
    </Suspense>
  );
}

function ConversationsSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 rounded-lg" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-lg" />
      ))}
    </div>
  );
}

function ConversationsView() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsStringEnum<Filter>(["all", "flagged"]).withDefault("all"),
  );
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (filter === "flagged") params.set("flagged", "true");
      const res = await adminFetch(`/conversations?${params}`);
      setConversations(res.data ?? res);
      setTotal(res.total ?? 0);
    } catch {
      setConversations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filter]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Conversations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {filter === "flagged"
            ? `Conversations flagged for review (${total} total)`
            : `Browse and review all user conversations (${total} total)`}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="flagged">Flagged</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : (
        <ConversationTable conversations={conversations} />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
