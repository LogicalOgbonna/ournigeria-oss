"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PipelineStatus {
  name: string;
  isRunning: boolean;
  processed: number;
  errors: number;
  totalChunks: number;
}

export function PipelineStatusCards({ pipelines }: { pipelines: PipelineStatus[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {pipelines.map((p) => (
        <Card key={p.name}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium capitalize">{p.name}</CardTitle>
            {p.isRunning ? (
              <Badge variant="default" className="text-xs gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Running
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Idle</Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mt-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-chart-1" />
                <div>
                  <p className="text-lg font-bold font-heading">{p.processed.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Processed</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn("h-4 w-4", p.errors > 0 ? "text-destructive" : "text-muted-foreground")} />
                <div>
                  <p className="text-lg font-bold font-heading">{p.errors}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-chart-2" />
                <div>
                  <p className="text-lg font-bold font-heading">{p.totalChunks.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Chunks</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
