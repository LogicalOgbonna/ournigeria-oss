"use client";

import { useEffect, useState, useCallback } from "react";
import { UserTable, type UserRow } from "@/components/users/user-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { adminFetch } from "@/lib/api";

const PAGE_SIZE = 20;

// Placeholder data while backend is being built
const placeholderUsers: UserRow[] = Array.from({ length: 12 }, (_, i) => ({
  id: `user-${i + 1}`,
  phoneNumber: `+234${String(8000000000 + i * 1111111).slice(0, 10)}`,
  telegramId: i % 3 === 0 ? `tg_user_${i}` : null,
  createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
  lastSeenAt: i < 6 ? new Date(Date.now() - i * 3600000).toISOString() : null,
  _count: { conversations: Math.floor(Math.random() * 20) + 1 },
}));

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("q", debouncedSearch);
      const res = await adminFetch(`/users?${params}`);
      setUsers(res.data ?? res);
      setTotal(res.total ?? res.length ?? 0);
    } catch {
      // Fall back to placeholder data filtered by search
      const filtered = placeholderUsers.filter(
        (u) =>
          !debouncedSearch ||
          u.phoneNumber?.includes(debouncedSearch) ||
          u.telegramId?.includes(debouncedSearch)
      );
      setUsers(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage platform users ({total.toLocaleString()} total)
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by phone or telegram ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : (
        <UserTable users={users} />
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
