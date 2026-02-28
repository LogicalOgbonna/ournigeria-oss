"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  AlertTriangle,
  Database,
  Loader2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ingestFetch } from "@/lib/api";

interface PipelineData {
  total: number;
  done: number;
  error: number;
  processing: number;
  chunks: number;
}

export function RunProgress({
  runId,
  pipeline,
}: {
  runId: string;
  pipeline?: string;
}) {
  const [data, setData] = useState<PipelineData | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [pipelineName, setPipelineName] = useState(pipeline);
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const load = useCallback(async () => {
    try {
      const query = pipelineName ? `?pipeline=${pipelineName}` : "";
      const res = await ingestFetch(`/status${query}`);
      const active: string[] = res.active ?? [];
      const pipelines = res.pipelines ?? {};

      // If we know the pipeline name, use it directly
      if (pipelineName && pipelines[pipelineName]) {
        setData(pipelines[pipelineName]);
        setIsActive(active.includes(pipelineName));
      } else {
        // Try to find the pipeline from the run's recent runs
        const run = (res.recentRuns ?? []).find(
          (r: { id: string }) => r.id === runId,
        );
        if (run) {
          setPipelineName(run.pipeline);
          if (pipelines[run.pipeline]) {
            setData(pipelines[run.pipeline]);
            setIsActive(active.includes(run.pipeline));
          }
        } else {
          // Show aggregated data across all pipelines
          const agg: PipelineData = {
            total: 0,
            done: 0,
            error: 0,
            processing: 0,
            chunks: 0,
          };
          for (const p of Object.values(pipelines) as PipelineData[]) {
            agg.total += p.total;
            agg.done += p.done;
            agg.error += p.error;
            agg.processing += p.processing;
            agg.chunks += p.chunks;
          }
          setData(agg);
          setIsActive(active.length > 0);
        }
      }
      setError(null);
    } catch {
      setError("Failed to connect to ingestion service");
    }
  }, [runId, pipelineName]);

  // Initial load + polling every 5s
  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 5_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  function formatElapsed(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }

  if (!data && !error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { total, done, error: errors, processing, chunks } = data!;
  const progress = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-heading font-semibold capitalize">
            {pipelineName ?? "Pipeline"} Progress
          </h2>
          {isActive ? (
            <Badge variant="secondary" className="text-xs gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Idle
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {done.toLocaleString()} / {total.toLocaleString()} files
            </span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2.5" />
          {processing > 0 && (
            <p className="text-xs text-muted-foreground">
              {processing} files currently processing
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold font-heading">
              {done.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Done</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <AlertTriangle
                className={cn(
                  "h-4 w-4",
                  errors > 0 ? "text-destructive" : "text-muted-foreground",
                )}
              />
            </div>
            <p
              className={cn(
                "text-xl font-bold font-heading",
                errors > 0 && "text-destructive",
              )}
            >
              {errors.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Database className="h-4 w-4 text-violet-500" />
            </div>
            <p className="text-xl font-bold font-heading">
              {chunks.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Chunks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold font-heading">
              {formatElapsed(elapsed)}
            </p>
            <p className="text-xs text-muted-foreground">Viewing</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
