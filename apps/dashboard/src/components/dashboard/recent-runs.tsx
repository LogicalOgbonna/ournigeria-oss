"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

interface IngestionRun {
  id: string;
  pipeline: string;
  status: string;
  totalFiles: number;
  totalChunks: number;
  startedAt: string;
}

function statusVariant(status: string) {
  switch (status) {
    case "completed": return "default" as const;
    case "running": return "secondary" as const;
    case "failed": return "destructive" as const;
    default: return "outline" as const;
  }
}

export function RecentRuns({ runs }: { runs: IngestionRun[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Recent Ingestion Runs
        </CardTitle>
        <Database className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No runs yet</p>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium capitalize">{run.pipeline}</p>
                  <p className="text-xs text-muted-foreground">
                    {run.totalFiles} files &middot; {run.totalChunks.toLocaleString()} chunks
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(run.status)} className="text-xs capitalize">
                    {run.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(run.startedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
