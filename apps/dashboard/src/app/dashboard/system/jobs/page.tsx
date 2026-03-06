"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Pause,
  RotateCcw,
  Clock,
  CheckCircle,
  Loader2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { adminFetch } from "@/lib/api";

interface BackgroundJob {
  id: string;
  name: string;
  type: "cron" | "queue" | "scheduled";
  status: "running" | "completed" | "failed" | "pending" | "paused";
  progress: number | null;
  lastRun: string | null;
  nextRun: string | null;
  schedule: string | null;
  duration: number | null;
  error: string | null;
  totalFiles?: number;
  processedFiles?: number;
  skippedFiles?: number;
  errorFiles?: number;
  totalChunks?: number;
}

function statusIcon(status: string) {
  switch (status) {
    case "running":
      return <Loader2 className="h-4 w-4 text-chart-2 animate-spin" />;
    case "completed":
      return <CheckCircle className="h-4 w-4 text-chart-1" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "paused":
      return <Pause className="h-4 w-4 text-chart-3" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function statusVariant(status: string) {
  switch (status) {
    case "running":
      return "secondary" as const;
    case "completed":
      return "default" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = () => {
    setLoading(true);
    setError(null);
    adminFetch("/system/jobs")
      .then((res) => {
        setJobs(res.data ?? res);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Failed to load jobs");
        setJobs([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const running = jobs.filter((j) => j.status === "running").length;
  const failed = jobs.filter((j) => j.status === "failed").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Background Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ingestion pipelines and scheduled tasks
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={fetchJobs}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Background Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {jobs.length === 0
              ? "No jobs recorded yet"
              : `${running} running, ${failed} failed of ${jobs.length} total jobs`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchJobs}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No ingestion jobs have been run yet. Start a pipeline from the
              ingestion page to see jobs here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  {statusIcon(job.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{job.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {job.type}
                      </Badge>
                      <Badge
                        variant={statusVariant(job.status)}
                        className="text-xs capitalize"
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {job.schedule && (
                        <span>
                          Schedule:{" "}
                          <code className="bg-muted px-1 rounded">
                            {job.schedule}
                          </code>
                        </span>
                      )}
                      {job.lastRun && (
                        <span>
                          Last: {new Date(job.lastRun).toLocaleString()}
                        </span>
                      )}
                      {job.nextRun && (
                        <span>
                          Next: {new Date(job.nextRun).toLocaleString()}
                        </span>
                      )}
                      {job.duration && <span>Duration: {job.duration}s</span>}
                      {job.totalFiles != null && job.totalFiles > 0 && (
                        <span>
                          Files: {job.processedFiles}/{job.totalFiles}
                          {(job.skippedFiles ?? 0) > 0 &&
                            ` (${job.skippedFiles} skipped)`}
                          {(job.errorFiles ?? 0) > 0 &&
                            ` (${job.errorFiles} errors)`}
                        </span>
                      )}
                      {job.totalChunks != null && job.totalChunks > 0 && (
                        <span>{job.totalChunks.toLocaleString()} chunks</span>
                      )}
                    </div>
                    {job.error && (
                      <p className="text-xs text-destructive mt-1">
                        {job.error}
                      </p>
                    )}
                    {job.progress !== null && (
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={job.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {job.progress}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {job.status === "failed" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {job.status === "running" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Pause className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
