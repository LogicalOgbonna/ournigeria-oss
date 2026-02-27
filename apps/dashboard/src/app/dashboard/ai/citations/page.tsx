"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { adminFetch } from "@/lib/api";

interface Citation {
  id: string;
  conversationId: string;
  query: string;
  sourceFile: string;
  chunkIndex: number;
  score: number;
  chunkPreview: string;
  createdAt: string;
}

const placeholderCitations: Citation[] = Array.from({ length: 20 }, (_, i) => ({
  id: `cit-${i}`,
  conversationId: `conv-${(i % 5) + 1}`,
  query: [
    "Lagos education budget 2025",
    "Kano healthcare allocation",
    "Rivers corruption cases",
    "Federal infrastructure spending",
    "Ogun agriculture budget",
  ][i % 5],
  sourceFile: [
    "budgets/lagos/2025-approved.pdf",
    "budgets/kano/2025-health.pdf",
    "corruption/rivers/2024-cases.json",
    "budgets/federal/2025-infrastructure.xlsx",
    "budgets/ogun/2025-agriculture.docx",
  ][i % 5],
  chunkIndex: Math.floor(Math.random() * 200),
  score: 0.65 + Math.random() * 0.35,
  chunkPreview: "The approved budget for the fiscal year 2025 allocates significant resources to education sector development, with a focus on infrastructure improvements and teacher training programs across all local government areas...",
  createdAt: new Date(Date.now() - i * 1800000).toISOString(),
}));

export default function CitationsPage() {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (debouncedSearch) params.set("q", debouncedSearch);
      const res = await adminFetch(`/ai/citations?${params}`);
      setCitations(res.data ?? res);
      setTotal(res.total ?? 0);
    } catch {
      const filtered = placeholderCitations.filter(
        (c) => !debouncedSearch || c.query.toLowerCase().includes(debouncedSearch.toLowerCase()) || c.sourceFile.toLowerCase().includes(debouncedSearch.toLowerCase()),
      );
      setCitations(filtered.slice((page - 1) * 15, page * 15));
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / 15));

  function scoreColor(score: number) {
    if (score >= 0.85) return "default" as const;
    if (score >= 0.6) return "secondary" as const;
    return "destructive" as const;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Source Citations</h1>
        <p className="text-muted-foreground text-sm mt-1">View which vector chunks were retrieved for each query</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by query or file..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query</TableHead>
                <TableHead>Source File</TableHead>
                <TableHead className="text-right">Chunk</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citations.map((c) => (
                <>
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                    <TableCell className="text-sm max-w-[200px] truncate">{c.query}</TableCell>
                    <TableCell className="text-sm font-mono max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{c.sourceFile.split("/").pop()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">#{c.chunkIndex}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={scoreColor(c.score)} className="text-xs">
                        {(c.score * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                  {expanded === c.id && (
                    <TableRow key={`${c.id}-preview`}>
                      <TableCell colSpan={5} className="bg-muted/50">
                        <div className="space-y-1.5 py-1">
                          <p className="text-xs font-medium text-muted-foreground">Chunk preview:</p>
                          <p className="text-sm leading-relaxed">{c.chunkPreview}</p>
                          <p className="text-xs text-muted-foreground">Full path: {c.sourceFile}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
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
