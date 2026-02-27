"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, FileText, Loader2, Clock } from "lucide-react";
import { useSSE } from "@/lib/hooks/use-sse";
import { PauseResumeButton } from "./pause-resume-button";
import { cn } from "@/lib/utils";

interface PipelineEvent {
  type: "file_start" | "file_done" | "file_error" | "pipeline_done" | "paused" | "resumed";
  runId: string;
  filePath?: string;
  chunks?: number;
  error?: string;
  timestamp: string;
}

interface FileEntry {
  path: string;
  status: "processing" | "done" | "error";
  chunks?: number;
  error?: string;
}

export function RunProgress({ runId }: { runId: string }) {
  const { events, connected } = useSSE<PipelineEvent>(
    `/api/ingest/events?runId=${runId}`,
  );
  const [files, setFiles] = useState<Map<string, FileEntry>>(new Map());
  const [done, setDone] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Update elapsed time
  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(timer);
  }, [done, startTime]);

  // Process SSE events
  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[events.length - 1];

    setFiles((prev) => {
      const next = new Map(prev);
      switch (latest.type) {
        case "file_start":
          if (latest.filePath) {
            next.set(latest.filePath, { path: latest.filePath, status: "processing" });
          }
          break;
        case "file_done":
          if (latest.filePath) {
            next.set(latest.filePath, {
              path: latest.filePath,
              status: "done",
              chunks: latest.chunks,
            });
          }
          break;
        case "file_error":
          if (latest.filePath) {
            next.set(latest.filePath, {
              path: latest.filePath,
              status: "error",
              error: latest.error,
            });
          }
          break;
        case "pipeline_done":
          setDone(true);
          break;
        case "paused":
          setIsPaused(true);
          break;
        case "resumed":
          setIsPaused(false);
          break;
      }
      return next;
    });
  }, [events]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [files.size]);

  const fileArr = Array.from(files.values());
  const processed = fileArr.filter((f) => f.status !== "processing").length;
  const errors = fileArr.filter((f) => f.status === "error").length;
  const totalChunks = fileArr.reduce((sum, f) => sum + (f.chunks || 0), 0);
  const total = fileArr.length;
  const progress = total > 0 ? (processed / total) * 100 : 0;

  function formatElapsed(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-heading font-semibold">Run Progress</h2>
          {connected ? (
            <Badge variant="secondary" className="text-xs gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-chart-1 animate-pulse" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Disconnected</Badge>
          )}
          {done && (
            <Badge variant="default" className="text-xs">Complete</Badge>
          )}
        </div>
        <PauseResumeButton
          pipeline="budget"
          isPaused={isPaused}
          isRunning={!done}
          onToggle={() => setIsPaused((p) => !p)}
        />
      </div>

      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {processed} / {total} files
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xl font-bold font-heading">{processed}</p>
            <p className="text-xs text-muted-foreground">Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className={cn("text-xl font-bold font-heading", errors > 0 && "text-destructive")}>{errors}</p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xl font-bold font-heading">{totalChunks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Chunks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xl font-bold font-heading">{formatElapsed(elapsed)}</p>
            </div>
            <p className="text-xs text-muted-foreground">Elapsed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">File Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] custom-scrollbar">
            <div className="space-y-1 pr-3">
              {fileArr.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Waiting for events...
                </p>
              ) : (
                fileArr.map((file) => {
                  const name = file.path.split("/").pop() || file.path;
                  return (
                    <div
                      key={file.path}
                      className="flex items-center gap-2 py-1.5 px-2 rounded text-sm"
                    >
                      {file.status === "processing" && (
                        <Loader2 className="h-3.5 w-3.5 text-chart-2 animate-spin shrink-0" />
                      )}
                      {file.status === "done" && (
                        <CheckCircle className="h-3.5 w-3.5 text-chart-1 shrink-0" />
                      )}
                      {file.status === "error" && (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{name}</span>
                      {file.chunks !== undefined && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {file.chunks} chunks
                        </Badge>
                      )}
                      {file.error && (
                        <span className="text-xs text-destructive truncate max-w-[200px]">
                          {file.error}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
