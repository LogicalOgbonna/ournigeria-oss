"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  PipelineStatusCards,
  type PipelineStatus,
} from "@/components/ingestion/pipeline-status-cards";
import { PauseResumeButton } from "@/components/ingestion/pause-resume-button";
import {
  IngestionRunsTable,
  type IngestionRun,
} from "@/components/ingestion/ingestion-runs-table";
import { LiveLogPanel } from "@/components/ingestion/live-log-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw, Terminal } from "lucide-react";
import { ingestFetch } from "@/lib/api";

const FALLBACK_PIPELINES: PipelineStatus[] = [
  {
    name: "budget",
    isRunning: false,
    isPaused: false,
    processed: 937,
    errors: 1,
    totalChunks: 696222,
  },
  {
    name: "govspend",
    isRunning: false,
    isPaused: false,
    processed: 320258,
    errors: 0,
    totalChunks: 320040,
  },
  {
    name: "corruption",
    isRunning: false,
    isPaused: false,
    processed: 0,
    errors: 0,
    totalChunks: 0,
  },
];

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

/** Map the ingest API response into the shapes our components expect */
function mapPipelines(
  pipelinesObj: Record<
    string,
    {
      total: number;
      done: number;
      error: number;
      processing: number;
      chunks: number;
    }
  >,
  active: string[],
): PipelineStatus[] {
  return Object.entries(pipelinesObj).map(([name, p]) => ({
    name,
    isRunning: active.includes(name),
    isPaused: false,
    processed: p.done,
    errors: p.error,
    totalChunks: p.chunks,
  }));
}

function mapRuns(
  runs: Array<{
    id: string;
    pipeline: string;
    trigger: string;
    totalFiles: number;
    processedFiles: number;
    skippedFiles: number;
    errorFiles: number;
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

export default function IngestionPage() {
  const [pipelines, setPipelines] = useState<PipelineStatus[] | null>(null);
  const [runs, setRuns] = useState<IngestionRun[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRunIds, setActiveRunIds] = useState<Record<string, string>>({});
  const [viewingLogs, setViewingLogs] = useState<{
    runId: string;
    pipeline: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await ingestFetch("/status");
      setPipelines(mapPipelines(data.pipelines ?? {}, data.active ?? []));
      setRuns(mapRuns(data.recentRuns ?? [], data.active ?? []));
      setActiveRunIds(data.activeRunIds ?? {});
    } catch {
      setPipelines(FALLBACK_PIPELINES);
      setRuns(FALLBACK_RUNS);
      setActiveRunIds({});
    } finally {
      setLoading(false);
    }
  }, []);

  const hasActive = pipelines?.some((p) => p.isRunning) ?? false;
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 10s when a pipeline is running
  useEffect(() => {
    if (hasActive) {
      intervalRef.current = setInterval(load, 10_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasActive, load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Ingestion</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pipeline status and management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/ingestion/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New Run
            </Link>
          </Button>
        </div>
      </div>

      <PipelineStatusCards pipelines={pipelines!} />

      <div className="flex items-center gap-2">
        {pipelines!.map((p) =>
          p.isRunning ? (
            <PauseResumeButton
              key={p.name}
              pipeline={p.name}
              isPaused={p.isPaused}
              isRunning={p.isRunning}
              onToggle={load}
            />
          ) : null,
        )}
        {pipelines!.map((p) =>
          p.isRunning && activeRunIds[p.name] ? (
            <Button
              key={`logs-${p.name}`}
              variant="outline"
              size="sm"
              onClick={() =>
                setViewingLogs({
                  runId: activeRunIds[p.name],
                  pipeline: p.name,
                })
              }
            >
              <Terminal className="h-3.5 w-3.5 mr-1.5" />
              {p.name} logs
            </Button>
          ) : null,
        )}
      </div>

      <div>
        <h2 className="text-lg font-heading font-semibold mb-3">Recent Runs</h2>
        <IngestionRunsTable runs={runs!} />
      </div>

      {viewingLogs && (
        <LiveLogPanel
          runId={viewingLogs.runId}
          pipeline={viewingLogs.pipeline}
          onClose={() => setViewingLogs(null)}
        />
      )}
    </div>
  );
}
