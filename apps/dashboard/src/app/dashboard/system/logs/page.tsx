"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  Trash2,
  Search,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminFetch } from "@/lib/api";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  service: string;
  message: string;
}

const levelColors: Record<string, string> = {
  info: "text-chart-1",
  warn: "text-chart-3",
  error: "text-destructive",
  debug: "text-muted-foreground",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [streaming, setStreaming] = useState(true);
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminFetch("/system/logs?limit=100")
      .then((data) => {
        const entries = Array.isArray(data) ? data : [];
        setLogs(entries.reverse());
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Failed to load logs");
        setLogs([]);
      })
      .finally(() => setInitialLoad(false));
  }, []);

  useEffect(() => {
    if (!streaming || initialLoad || error) return;
    const interval = setInterval(() => {
      adminFetch("/system/logs?limit=10")
        .then((data) => {
          const entries: LogEntry[] = Array.isArray(data) ? data : [];
          if (entries.length > 0) {
            setLogs((prev) => {
              const ids = new Set(prev.map((l) => l.id));
              const newOnes = entries.reverse().filter((l) => !ids.has(l.id));
              return newOnes.length > 0
                ? [...prev.slice(-490), ...newOnes]
                : prev;
            });
          }
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [streaming, initialLoad, error]);

  useEffect(() => {
    if (autoScroll) logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length, autoScroll]);

  const filtered = logs.filter((l) => {
    if (levelFilter !== "all" && l.level !== levelFilter) return false;
    if (serviceFilter !== "all" && l.service !== serviceFilter) return false;
    if (filter && !l.message.toLowerCase().includes(filter.toLowerCase()))
      return false;
    return true;
  });

  const retry = () => {
    setInitialLoad(true);
    setError(null);
    adminFetch("/system/logs?limit=100")
      .then((data) => {
        const entries = Array.isArray(data) ? data : [];
        setLogs(entries.reverse());
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Failed to load logs");
        setLogs([]);
      })
      .finally(() => setInitialLoad(false));
  };

  if (error && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Live Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log entries from API service
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={retry}>
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
          <h1 className="text-2xl font-heading font-bold">Live Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log entries from API service
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={streaming ? "secondary" : "default"}
            size="sm"
            onClick={() => setStreaming((s) => !s)}
          >
            {streaming ? (
              <Pause className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1.5" />
            )}
            {streaming ? "Pause" : "Resume"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLogs([])}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="ingest">Ingest</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="chat">Chat</SelectItem>
            <SelectItem value="vector">Vector</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={autoScroll ? "default" : "outline"}
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setAutoScroll((a) => !a)}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] custom-scrollbar">
            <div className="font-mono text-xs p-3 space-y-0.5">
              {initialLoad ? (
                <p className="text-muted-foreground text-center py-8">
                  Loading logs...
                </p>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground text-center">
                    {logs.length === 0
                      ? "No log entries yet. Logs will appear as the API processes requests."
                      : "No logs matching filters"}
                  </p>
                </div>
              ) : (
                filtered.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-3 py-1 px-2 rounded hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-muted-foreground shrink-0 w-[180px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 w-[45px] uppercase font-semibold",
                        levelColors[log.level],
                      )}
                    >
                      {log.level}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0 h-5"
                    >
                      {log.service}
                    </Badge>
                    <span className="text-foreground">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filtered.length} entries shown (of {logs.length} total)
        </span>
        {streaming && !error && (
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-chart-1 animate-pulse" />{" "}
            Streaming
          </span>
        )}
      </div>
    </div>
  );
}
