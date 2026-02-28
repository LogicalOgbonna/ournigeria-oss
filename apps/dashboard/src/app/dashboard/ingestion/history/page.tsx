"use client";

import { useEffect, useState, useCallback } from "react";
import {
  IngestionRunsTable,
  type IngestionRun,
} from "@/components/ingestion/ingestion-runs-table";
import { Skeleton } from "@/components/ui/skeleton";
import { ingestFetch } from "@/lib/api";

const FALLBACK_RUNS: IngestionRun[] = [
  {
    id: "fb323dc0",
    pipeline: "budget",
    trigger: "manual",
    totalFiles: 941,
    totalChunks: 696222,
    duration: 10200,
    startedAt: "2026-02-27T10:00:00Z",
    status: "completed",
  },
  {
    id: "89b5b4ff",
    pipeline: "govspend",
    trigger: "manual",
    totalFiles: 891400,
    totalChunks: 320040,
    duration: null,
    startedAt: "2026-02-27T14:31:18Z",
    status: "running",
  },
];

function mapRuns(
  runs: Array<{
    id: string;
    pipeline: string;
    trigger: string;
    totalFiles: number;
    totalChunks: number;
    durationMs: number | null;
    startedAt: string;
    completedAt: string | null;
    errorMsg: string | null;
  }>,
  active: string[],
): IngestionRun[] {
  return runs.map((r) => {
    let status: string;
    if (r.errorMsg) status = "failed";
    else if (r.completedAt) status = "completed";
    else if (active.includes(r.pipeline)) status = "running";
    else status = "stalled";
    return {
      id: r.id,
      pipeline: r.pipeline,
      trigger: r.trigger,
      totalFiles: r.totalFiles,
      totalChunks: r.totalChunks,
      duration: r.durationMs ? Math.round(r.durationMs / 1000) : null,
      startedAt: r.startedAt,
      status,
    };
  });
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ingestFetch("/status");
      setRuns(mapRuns(data.recentRuns ?? [], data.active ?? []));
    } catch {
      setRuns(FALLBACK_RUNS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Run History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Recent ingestion runs ({runs.length} shown)
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
    </div>
  );
}
