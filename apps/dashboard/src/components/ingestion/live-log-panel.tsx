"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowDown, Pause, Play } from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: "log" | "warn" | "error";
  message: string;
  runId: string;
  pipeline: string;
}

interface LiveLogPanelProps {
  runId: string;
  pipeline: string;
  onClose: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  log: "text-foreground",
  warn: "text-amber-500",
  error: "text-red-500",
};

const MAX_LINES = 500;

export function LiveLogPanel({ runId, pipeline, onClose }: LiveLogPanelProps) {
  const [lines, setLines] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  const containerRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<LogEntry[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/ingest/logs/stream?runId=${encodeURIComponent(runId)}`,
    );

    eventSource.onopen = () => setConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const entry: LogEntry = JSON.parse(event.data);
        if (pausedRef.current) {
          bufferRef.current.push(entry);
          return;
        }
        setLines((prev) => {
          const next = [...prev, entry];
          return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
        });
      } catch {
        // ignore malformed events
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [runId]);

  // Flush buffer when unpausing
  useEffect(() => {
    if (!paused && bufferRef.current.length > 0) {
      setLines((prev) => {
        const next = [...prev, ...bufferRef.current];
        bufferRef.current = [];
        return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
      });
    }
  }, [paused]);

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  function handleScroll() {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(atBottom);
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">
            Live Logs — <span className="capitalize">{pipeline}</span>
          </h3>
          <Badge
            variant={connected ? "default" : "destructive"}
            className="text-xs"
          >
            {connected ? "Connected" : "Disconnected"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {lines.length} lines
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPaused((p) => !p)}
            title={paused ? "Resume" : "Pause"}
          >
            {paused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setAutoScroll(true);
              if (containerRef.current)
                containerRef.current.scrollTop =
                  containerRef.current.scrollHeight;
            }}
            title="Scroll to bottom"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-80 overflow-y-auto bg-black/95 text-xs font-mono p-3 space-y-px"
        >
          {lines.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              Waiting for log output...
            </div>
          ) : (
            lines.map((line, i) => (
              <div key={i} className="flex gap-2 leading-relaxed">
                <span className="text-muted-foreground shrink-0">
                  {formatTime(line.timestamp)}
                </span>
                <span className={LEVEL_COLORS[line.level] || "text-foreground"}>
                  {line.message}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
