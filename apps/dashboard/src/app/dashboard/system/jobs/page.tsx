"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Pause, RotateCcw, Clock, CheckCircle, Loader2, XCircle } from "lucide-react";
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
}

const placeholderJobs: BackgroundJob[] = [
  { id: "job-1", name: "Embedding Sync", type: "cron", status: "completed", progress: null, lastRun: new Date(Date.now() - 3600000).toISOString(), nextRun: new Date(Date.now() + 3600000).toISOString(), schedule: "0 * * * *", duration: 45, error: null },
  { id: "job-2", name: "User Analytics Rollup", type: "cron", status: "completed", progress: null, lastRun: new Date(Date.now() - 1800000).toISOString(), nextRun: new Date(Date.now() + 1800000).toISOString(), schedule: "*/30 * * * *", duration: 12, error: null },
  { id: "job-3", name: "Budget Pipeline - Lagos", type: "queue", status: "running", progress: 67, lastRun: new Date(Date.now() - 600000).toISOString(), nextRun: null, schedule: null, duration: null, error: null },
  { id: "job-4", name: "S3 Cleanup (old files)", type: "cron", status: "completed", progress: null, lastRun: new Date(Date.now() - 86400000).toISOString(), nextRun: new Date(Date.now() + 86400000).toISOString(), schedule: "0 3 * * *", duration: 23, error: null },
  { id: "job-5", name: "Database Vacuum", type: "scheduled", status: "pending", progress: null, lastRun: new Date(Date.now() - 86400000 * 7).toISOString(), nextRun: new Date(Date.now() + 86400000).toISOString(), schedule: "0 2 * * 0", duration: null, error: null },
  { id: "job-6", name: "Corruption Data Sync", type: "queue", status: "failed", progress: null, lastRun: new Date(Date.now() - 7200000).toISOString(), nextRun: null, schedule: null, duration: 120, error: "Connection timeout to external API" },
];

function statusIcon(status: string) {
  switch (status) {
    case "running": return <Loader2 className="h-4 w-4 text-chart-2 animate-spin" />;
    case "completed": return <CheckCircle className="h-4 w-4 text-chart-1" />;
    case "failed": return <XCircle className="h-4 w-4 text-destructive" />;
    case "paused": return <Pause className="h-4 w-4 text-chart-3" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function statusVariant(status: string) {
  switch (status) {
    case "running": return "secondary" as const;
    case "completed": return "default" as const;
    case "failed": return "destructive" as const;
    default: return "outline" as const;
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/system/jobs")
      .then((res) => setJobs(res.data ?? res))
      .catch(() => setJobs(placeholderJobs))
      .finally(() => setLoading(false));
  }, []);

  const running = jobs.filter((j) => j.status === "running").length;
  const failed = jobs.filter((j) => j.status === "failed").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Background Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {running} running, {failed} failed of {jobs.length} total jobs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                {statusIcon(job.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{job.name}</span>
                    <Badge variant="outline" className="text-[10px]">{job.type}</Badge>
                    <Badge variant={statusVariant(job.status)} className="text-xs capitalize">{job.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {job.schedule && <span>Schedule: <code className="bg-muted px-1 rounded">{job.schedule}</code></span>}
                    {job.lastRun && <span>Last: {new Date(job.lastRun).toLocaleString()}</span>}
                    {job.nextRun && <span>Next: {new Date(job.nextRun).toLocaleString()}</span>}
                    {job.duration && <span>Duration: {job.duration}s</span>}
                  </div>
                  {job.error && <p className="text-xs text-destructive mt-1">{job.error}</p>}
                  {job.progress !== null && (
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={job.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{job.progress}%</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {job.status === "failed" && (
                    <Button variant="ghost" size="icon" className="h-7 w-7"><RotateCcw className="h-3.5 w-3.5" /></Button>
                  )}
                  {job.status === "running" && (
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Pause className="h-3.5 w-3.5" /></Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
