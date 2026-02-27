"use client";

import { useEffect, useState, useCallback } from "react";
import { IngestionRunsTable, type IngestionRun } from "@/components/ingestion/ingestion-runs-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminFetch } from "@/lib/api";

const PAGE_SIZE = 20;

const placeholderRuns: IngestionRun[] = [
  {
    id: "fb323dc0",
    pipeline: "budget",
    trigger: "manual",
    totalFiles: 700,
    totalChunks: 708309,
    duration: 10200,
    startedAt: "2026-02-23T10:00:00Z",
    status: "completed",
  },
];

export default function HistoryPage() {
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/ingestion-runs?page=${page}&limit=${PAGE_SIZE}`);
      setRuns(res.data ?? res);
      setTotal(res.total ?? res.length ?? 0);
    } catch {
      setRuns(placeholderRuns);
      setTotal(placeholderRuns.length);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Run History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All ingestion runs ({total} total)
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : (
        <IngestionRunsTable runs={runs} />
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
