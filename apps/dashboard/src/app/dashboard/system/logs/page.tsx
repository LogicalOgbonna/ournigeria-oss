"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Generate realistic-looking placeholder logs
function generateLogs(count: number): LogEntry[] {
  const services = ["api", "ingest", "auth", "chat", "vector"];
  const levels: LogEntry["level"][] = [
    "info",
    "info",
    "info",
    "warn",
    "error",
    "debug",
    "debug",
  ];
  const messages = [
    "Request processed successfully",
    "User authenticated via Telegram",
    "Chat query processed in 1.2s",
    "Vector search returned 5 results (avg score: 0.87)",
    "Pipeline worker started for budget files",
    "File processed: budgets/lagos/2025-approved.pdf (1024 chunks)",
    "Database connection pool: 8/20 active",
    "Rate limit approaching for Voyage AI API",
    "Failed to process file: corrupt PDF header",
    "Embedding batch completed: 50 chunks in 3.2s",
    "SSE client connected from 192.168.1.100",
    "Cache hit for query: 'lagos education budget'",
    "Memory usage: 487MB / 2048MB",
    "Slow query detected: 850ms for user lookup",
    "WebSocket connection established",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `log-${i}`,
    timestamp: new Date(Date.now() - (count - i) * 2000).toISOString(),
    level: levels[Math.floor(Math.random() * levels.length)],
    service: services[Math.floor(Math.random() * services.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
  }));
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [streaming, setStreaming] = useState(true);
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [useApi, setUseApi] = useState(true);

  // Load initial logs from API
  useEffect(() => {
    adminFetch("/system/logs?limit=100")
      .then((data) => {
        const entries = Array.isArray(data) ? data : [];
        if (entries.length > 0) {
          setLogs(entries.reverse());
        } else {
          setLogs(generateLogs(50));
          setUseApi(false);
        }
      })
      .catch(() => {
        setLogs(generateLogs(50));
        setUseApi(false);
      });
  }, []);

  // Poll for new logs or simulate streaming
  useEffect(() => {
    if (!streaming) return;
    const interval = setInterval(() => {
      if (useApi) {
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
      } else {
        const newLogs = generateLogs(1).map((l) => ({
          ...l,
          id: `log-${Date.now()}`,
        }));
        setLogs((prev) => [...prev.slice(-500), ...newLogs]);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [streaming, useApi]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Live Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {useApi
              ? "Log entries from API service"
              : "Simulated log streaming (API unavailable)"}
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
              {filtered.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No logs matching filters
                </p>
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
        {streaming && (
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-chart-1 animate-pulse" />{" "}
            Streaming
          </span>
        )}
      </div>
    </div>
  );
}
