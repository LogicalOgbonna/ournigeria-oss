"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PipelineStatusCards, type PipelineStatus } from "@/components/ingestion/pipeline-status-cards";
import { PauseResumeButton } from "@/components/ingestion/pause-resume-button";
import { IngestionRunsTable, type IngestionRun } from "@/components/ingestion/ingestion-runs-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { ingestFetch, adminFetch } from "@/lib/api";

const placeholderPipelines: PipelineStatus[] = [
  { name: "budget", isRunning: false, isPaused: false, processed: 700, errors: 0, totalChunks: 708309 },
  { name: "corruption", isRunning: false, isPaused: false, processed: 0, errors: 0, totalChunks: 0 },
];

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

export default function IngestionPage() {
  const [pipelines, setPipelines] = useState<PipelineStatus[] | null>(null);
  const [runs, setRuns] = useState<IngestionRun[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [statusRes, runsRes] = await Promise.allSettled([
        ingestFetch("/status"),
        adminFetch("/ingestion-runs?limit=10"),
      ]);
      setPipelines(
        statusRes.status === "fulfilled" ? statusRes.value.pipelines ?? statusRes.value : placeholderPipelines,
      );
      setRuns(
        runsRes.status === "fulfilled" ? (runsRes.value.data ?? runsRes.value) : placeholderRuns,
      );
    } catch {
      setPipelines(placeholderPipelines);
      setRuns(placeholderRuns);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
          <p className="text-muted-foreground text-sm mt-1">Pipeline status and management</p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/ingestion/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Run
          </Link>
        </Button>
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
      </div>

      <div>
        <h2 className="text-lg font-heading font-semibold mb-3">Recent Runs</h2>
        <IngestionRunsTable runs={runs!} />
      </div>
    </div>
  );
}
