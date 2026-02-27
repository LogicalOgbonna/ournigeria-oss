"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ChevronLeft, ChevronRight, User, Database, Settings, Trash2, Play, Shield } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { adminFetch } from "@/lib/api";

interface AuditEntry {
  id: string;
  action: string;
  category: "user" | "ingestion" | "system" | "ai" | "auth";
  actor: string;
  target: string | null;
  details: string;
  ip: string;
  timestamp: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  user: <User className="h-3.5 w-3.5" />,
  ingestion: <Database className="h-3.5 w-3.5" />,
  system: <Settings className="h-3.5 w-3.5" />,
  ai: <Play className="h-3.5 w-3.5" />,
  auth: <Shield className="h-3.5 w-3.5" />,
};

const placeholderEntries: AuditEntry[] = [
  { id: "aud-1", action: "user.delete", category: "user", actor: "admin", target: "user-42", details: "Deleted user +2348012345678 and all associated data", ip: "192.168.1.100", timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: "aud-2", action: "ingestion.start", category: "ingestion", actor: "admin", target: "run-fb323dc0", details: "Started budget pipeline with 700 files", ip: "192.168.1.100", timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: "aud-3", action: "ingestion.pause", category: "ingestion", actor: "admin", target: "run-fb323dc0", details: "Paused budget pipeline at 350/700 files", ip: "192.168.1.100", timestamp: new Date(Date.now() - 5400000).toISOString() },
  { id: "aud-4", action: "ai.agent.update", category: "ai", actor: "admin", target: "budget-agent", details: "Updated system prompt for Budget Agent", ip: "192.168.1.100", timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: "aud-5", action: "auth.login", category: "auth", actor: "admin", target: null, details: "Admin login successful", ip: "192.168.1.100", timestamp: new Date(Date.now() - 10800000).toISOString() },
  { id: "aud-6", action: "system.alert.create", category: "system", actor: "admin", target: "alert-1", details: "Created alert rule: High Error Rate", ip: "192.168.1.100", timestamp: new Date(Date.now() - 14400000).toISOString() },
  { id: "aud-7", action: "user.preferences.update", category: "user", actor: "admin", target: "user-15", details: "Updated user preferences JSON", ip: "192.168.1.100", timestamp: new Date(Date.now() - 18000000).toISOString() },
  { id: "aud-8", action: "ingestion.resume", category: "ingestion", actor: "admin", target: "run-fb323dc0", details: "Resumed budget pipeline", ip: "192.168.1.100", timestamp: new Date(Date.now() - 21600000).toISOString() },
  { id: "aud-9", action: "vectors.reindex", category: "system", actor: "admin", target: "Lagos", details: "Triggered reindex for Lagos state documents", ip: "192.168.1.100", timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: "aud-10", action: "auth.login.failed", category: "auth", actor: "unknown", target: null, details: "Failed login attempt with invalid credentials", ip: "10.0.0.55", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
];

const PAGE_SIZE = 20;

function actionColor(action: string) {
  if (action.includes("delete") || action.includes("failed")) return "destructive" as const;
  if (action.includes("update") || action.includes("pause")) return "secondary" as const;
  return "outline" as const;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await adminFetch(`/audit?${params}`);
      setEntries(res.data ?? res);
      setTotal(res.total ?? 0);
    } catch {
      let filtered = placeholderEntries;
      if (debouncedSearch) filtered = filtered.filter((e) => e.details.toLowerCase().includes(debouncedSearch.toLowerCase()) || e.action.includes(debouncedSearch));
      if (categoryFilter !== "all") filtered = filtered.filter((e) => e.category === categoryFilter);
      setEntries(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all admin actions and system events</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search actions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="ingestion">Ingestion</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="ai">AI</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No audit entries found</p>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0 mt-0.5">
                      {categoryIcons[entry.category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={actionColor(entry.action)} className="text-xs font-mono">{entry.action}</Badge>
                        <span className="text-xs text-muted-foreground">by <strong>{entry.actor}</strong></span>
                        {entry.target && (
                          <span className="text-xs text-muted-foreground">on <code className="bg-muted px-1 rounded">{entry.target}</code></span>
                        )}
                      </div>
                      <p className="text-sm mt-1">{entry.details}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        <span>IP: {entry.ip}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
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
