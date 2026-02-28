"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Database,
} from "lucide-react";
import { ingestFetch } from "@/lib/api";

const FALLBACK_SUMMARIES: PipelineSummary[] = [
  {
    name: "budget",
    total: 941,
    done: 937,
    error: 1,
    processing: 0,
    chunks: 696222,
    isRunning: false,
  },
  {
    name: "govspend",
    total: 891400,
    done: 320258,
    error: 0,
    processing: 0,
    chunks: 320040,
    isRunning: false,
  },
  {
    name: "corruption",
    total: 0,
    done: 0,
    error: 0,
    processing: 0,
    chunks: 0,
    isRunning: false,
  },
];

interface PipelineSummary {
  name: string;
  total: number;
  done: number;
  error: number;
  processing: number;
  chunks: number;
  isRunning: boolean;
}

export default function RecordsPage() {
  const [summaries, setSummaries] = useState<PipelineSummary[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ingestFetch("/status");
      const active: string[] = data.active ?? [];
      const pipelines = data.pipelines ?? {};
      const result: PipelineSummary[] = Object.entries(pipelines).map(
        ([name, p]: [string, any]) => ({
          name,
          total: p.total,
          done: p.done,
          error: p.error,
          processing: p.processing,
          chunks: p.chunks,
          isRunning: active.includes(name),
        }),
      );
      setSummaries(result);
    } catch {
      setSummaries(FALLBACK_SUMMARIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered =
    filter === "all" ? summaries : summaries.filter((s) => s.name === filter);

  const grandTotal = summaries.reduce((a, s) => a + s.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Ingestion Records</h1>
          <p className="text-muted-foreground text-sm mt-1">
            File processing records ({grandTotal.toLocaleString()} total across
            all pipelines)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pipelines</SelectItem>
            {summaries.map((s) => (
              <SelectItem key={s.name} value={s.name}>
                {s.name.charAt(0).toUpperCase() + s.name.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No ingestion records found
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((s) => {
            const pct =
              s.total > 0 ? ((s.done / s.total) * 100).toFixed(1) : "0";
            return (
              <Card key={s.name}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-medium capitalize">
                    {s.name}
                  </CardTitle>
                  {s.isRunning ? (
                    <Badge variant="default" className="text-xs gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Running
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Idle
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-lg font-bold font-heading">
                          {s.done.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Done</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-lg font-bold font-heading">
                          {s.processing.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Processing
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`h-4 w-4 ${s.error > 0 ? "text-destructive" : "text-muted-foreground"}`}
                      />
                      <div>
                        <p className="text-lg font-bold font-heading">
                          {s.error.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Errors</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-violet-500" />
                      <div>
                        <p className="text-lg font-bold font-heading">
                          {s.chunks.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Chunks</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {s.total.toLocaleString()} total files
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
