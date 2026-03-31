"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Loader2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Inbox,
  Network,
  Zap,
  FileText,
  Settings,
  Save,
} from "lucide-react";
import { adminFetch } from "@/lib/api";
import { useQueryState, parseAsString } from "nuqs";

// ── Types ──────────────────────────────────────────────────────────

interface GraphHealth {
  status: string;
  nodes: Record<string, number>;
  edges: Record<string, number>;
  orphans?: number;
  flaggedEntities?: number;
  totalNodes: number;
  totalEdges: number;
  issues: string[];
}

interface BackfillJob {
  id: string;
  domain: string;
  pass: number;
  status: string;
  chunksTotal: number;
  chunksProcessed: number;
  costUsd: number;
  lastChunkId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorLog?: Array<{ chunk_id: string; error: string; ts: string }>;
}

interface CommunityResult {
  message: string;
  total: number;
}

// ── Helpers ────────────────────────────────────────────────────────

const DOMAINS = ["budget", "corruption", "govspend", "faac"] as const;

function statusIcon(status: string) {
  switch (status) {
    case "running":
      return <Loader2 className="h-4 w-4 text-chart-2 animate-spin" />;
    case "completed":
      return <CheckCircle className="h-4 w-4 text-chart-1" />;
    case "error":
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
    case "error":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function formatCost(usd: number) {
  return `$${usd.toFixed(2)}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

// ── Component ──────────────────────────────────────────────────────

export function GraphManagementPage() {
  const [health, setHealth] = useState<GraphHealth | null>(null);
  const [jobs, setJobs] = useState<BackfillJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [communityResult, setCommunityResult] =
    useState<CommunityResult | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("all").withOptions({ shallow: true }),
  );
  const [costLimit, setCostLimit] = useState("500");
  const [concurrency, setConcurrency] = useState("10");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const [healthData, jobsData, settingsData] = await Promise.all([
        adminFetch("/graph/health").catch(() => null),
        adminFetch("/graph/backfill/status").catch(() => []),
        adminFetch("/settings").catch(() => ({ settings: {} })),
      ]);
      setHealth(healthData);
      setJobs(Array.isArray(jobsData) ? jobsData : []);

      // Extract graph settings from all categories
      const allSettings: Array<{ key: string; value: string }> =
        Object.values(settingsData.settings ?? {}).flat() as any;
      const costSetting = allSettings.find(
        (s) => s.key === "graph.extraction_cost_limit_usd",
      );
      const concSetting = allSettings.find(
        (s) => s.key === "graph.extraction_concurrency",
      );
      if (costSetting) setCostLimit(costSetting.value);
      if (concSetting) setConcurrency(concSetting.value);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const hasRunning = jobs.some((j) => j.status === "running");
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (hasRunning) {
      intervalRef.current = setInterval(load, 10_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasRunning, load]);

  async function startBackfill(pass: 1 | 2, domain?: string) {
    setActionLoading(`start-${pass}-${domain ?? "all"}`);
    setStartMenuOpen(false);
    try {
      await adminFetch("/graph/backfill", {
        method: "POST",
        body: JSON.stringify({ pass, domain }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start backfill");
    } finally {
      setActionLoading(null);
    }
  }

  async function pauseAll() {
    setActionLoading("pause");
    try {
      await adminFetch("/graph/backfill/pause", { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause");
    } finally {
      setActionLoading(null);
    }
  }

  async function pauseJob(jobId: string) {
    setActionLoading(`pause-${jobId}`);
    try {
      await adminFetch(`/graph/backfill/${jobId}/pause`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause job");
    } finally {
      setActionLoading(null);
    }
  }

  async function resumeJob(job: BackfillJob) {
    setActionLoading(`resume-${job.id}`);
    try {
      await adminFetch("/graph/backfill/resume", {
        method: "POST",
        body: JSON.stringify({ pass: job.pass, domain: job.domain }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume");
    } finally {
      setActionLoading(null);
    }
  }

  async function resetGraph() {
    if (!confirm("This will delete ALL graph data (Neo4j nodes + extraction jobs). Continue?")) return;
    setActionLoading("reset");
    try {
      const result = await adminFetch("/graph/reset", { method: "DELETE" });
      setCommunityResult({ message: result.message, total: 0 });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset graph");
    } finally {
      setActionLoading(null);
    }
  }

  async function detectCommunities() {
    setActionLoading("detect");
    setCommunityResult(null);
    try {
      const result = await adminFetch("/graph/communities/detect", {
        method: "POST",
      });
      setCommunityResult(result);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to detect communities",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function summarizeCommunities() {
    setActionLoading("summarize");
    setCommunityResult(null);
    try {
      const result = await adminFetch("/graph/communities/summarize", {
        method: "POST",
        body: JSON.stringify({ limit: 100 }),
      });
      setCommunityResult(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to summarize communities",
      );
    } finally {
      setActionLoading(null);
    }
  }

  function toggleErrors(jobId: string) {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  async function saveSettings() {
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      await Promise.all([
        adminFetch("/settings/graph.extraction_cost_limit_usd", {
          method: "PUT",
          body: JSON.stringify({ value: costLimit }),
        }),
        adminFetch("/settings/graph.extraction_concurrency", {
          method: "PUT",
          body: JSON.stringify({ value: concurrency }),
        }),
      ]);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save settings",
      );
    } finally {
      setSavingSettings(false);
    }
  }

  // ── Loading state ──

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // ── Error state ──

  if (error && !health && jobs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Knowledge Graph</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Graph extraction and management
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Knowledge Graph</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Graph extraction, health monitoring, and community detection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={resetGraph}
            disabled={actionLoading === "reset"}
          >
            {actionLoading === "reset" ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
            )}
            Reset Graph
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Section A: Graph Health ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-heading font-semibold">Graph Health</h2>
          {health && (
            <Badge
              variant={health.status === "ok" ? "default" : "outline"}
              className="ml-2"
            >
              {health.status}
            </Badge>
          )}
        </div>

        {health?.status === "disabled" ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <Network className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Neo4j is not connected. Graph features are disabled.
              </p>
            </CardContent>
          </Card>
        ) : health ? (
          <>
            {/* Summary stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Nodes
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {health.totalNodes.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Edges
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {health.totalEdges.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Orphan Nodes
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {(health.orphans ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Flagged Entities
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {(health.flaggedEntities ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Node counts */}
            {Object.keys(health.nodes).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Nodes by Type
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(health.nodes).map(([label, count]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <span className="text-sm">{label}</span>
                      <span className="text-sm font-mono font-medium">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edge counts */}
            {Object.keys(health.edges).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Edges by Type
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(health.edges).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <span className="text-sm">{type}</span>
                      <span className="text-sm font-mono font-medium">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues */}
            {health.issues.length > 0 && (
              <div className="space-y-1">
                {health.issues.map((issue, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm"
                  >
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                    {issue}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* ── Section B: Backfill Jobs ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-heading font-semibold">
              Backfill Jobs
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border p-0.5">
              {["all", "running", "paused", "completed", "error"].map((s) => (
                <button
                  key={s}
                  className={`px-2 py-1 text-xs rounded capitalize ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            {hasRunning && (
              <Button
                variant="outline"
                size="sm"
                onClick={pauseAll}
                disabled={actionLoading === "pause"}
              >
                {actionLoading === "pause" ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Pause className="h-3.5 w-3.5 mr-1.5" />
                )}
                Pause All
              </Button>
            )}

            {/* Start Backfill dropdown */}
            <div className="relative">
              <Button
                size="sm"
                onClick={() => setStartMenuOpen(!startMenuOpen)}
                disabled={!!actionLoading}
              >
                {actionLoading?.startsWith("start-") ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                )}
                Start Backfill
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
              {startMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-md border bg-popover p-1 shadow-md">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Pass 1 — Metadata
                  </p>
                  <button
                    className="w-full rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent"
                    onClick={() => startBackfill(1)}
                  >
                    All domains
                  </button>
                  {DOMAINS.map((d) => (
                    <button
                      key={`p1-${d}`}
                      className="w-full rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent capitalize"
                      onClick={() => startBackfill(1, d)}
                    >
                      {d}
                    </button>
                  ))}
                  <div className="my-1 border-t" />
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Pass 2 — LLM Extraction
                  </p>
                  <button
                    className="w-full rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent"
                    onClick={() => startBackfill(2)}
                  >
                    All domains
                  </button>
                  {DOMAINS.map((d) => (
                    <button
                      key={`p2-${d}`}
                      className="w-full rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent capitalize"
                      onClick={() => startBackfill(2, d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <Inbox className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No graph extraction jobs yet. Start a backfill to populate the
                knowledge graph.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs
              .filter(
                (job) =>
                  statusFilter === "all" || job.status === statusFilter,
              )
              .map((job) => {
              const progress =
                job.chunksTotal > 0
                  ? Math.round(
                      (job.chunksProcessed / job.chunksTotal) * 100,
                    )
                  : 0;
              const errors = job.errorLog ?? [];
              const isExpanded = expandedErrors.has(job.id);

              return (
                <Card key={job.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {statusIcon(job.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium capitalize">
                            {job.domain}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            Pass {job.pass}
                          </Badge>
                          <Badge
                            variant={statusVariant(job.status)}
                            className="text-xs capitalize"
                          >
                            {job.status}
                          </Badge>
                          {job.costUsd > 0 && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatCost(job.costUsd)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>
                            {job.chunksProcessed.toLocaleString()} /{" "}
                            {job.chunksTotal.toLocaleString()} chunks
                          </span>
                          {job.startedAt && (
                            <span>Started: {formatDate(job.startedAt)}</span>
                          )}
                          {job.completedAt && (
                            <span>
                              Completed: {formatDate(job.completedAt)}
                            </span>
                          )}
                        </div>
                        {job.chunksTotal > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {progress}%
                            </span>
                          </div>
                        )}
                        {errors.length > 0 && (
                          <button
                            className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => toggleErrors(job.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            {errors.length} error
                            {errors.length !== 1 ? "s" : ""}
                          </button>
                        )}
                        {isExpanded && errors.length > 0 && (
                          <div className="mt-2 max-h-48 overflow-y-auto rounded border bg-muted/50 p-2 space-y-1">
                            {errors.map((e, i) => (
                              <div
                                key={i}
                                className="text-xs font-mono text-destructive"
                              >
                                <span className="text-muted-foreground">
                                  [{e.ts}]
                                </span>{" "}
                                {e.chunk_id && (
                                  <span className="text-muted-foreground">
                                    chunk:{e.chunk_id}{" "}
                                  </span>
                                )}
                                {e.error}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {job.status === "running" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Pause this job"
                            onClick={() => pauseJob(job.id)}
                            disabled={
                              actionLoading === `pause-${job.id}`
                            }
                          >
                            {actionLoading === `pause-${job.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Pause className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        {job.status === "paused" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Resume this job"
                            onClick={() => resumeJob(job)}
                            disabled={
                              actionLoading === `resume-${job.id}`
                            }
                          >
                            {actionLoading === `resume-${job.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Section C: Community Detection ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-heading font-semibold">
            Community Detection
          </h2>
        </div>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={detectCommunities}
                disabled={actionLoading === "detect"}
              >
                {actionLoading === "detect" ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Network className="h-3.5 w-3.5 mr-1.5" />
                )}
                Detect Communities
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={summarizeCommunities}
                disabled={actionLoading === "summarize"}
              >
                {actionLoading === "summarize" ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                )}
                Generate Summaries
              </Button>
            </div>
            {communityResult && (
              <div className="mt-3 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                <CheckCircle className="h-4 w-4 text-chart-1 inline mr-1.5" />
                {communityResult.message} (total: {communityResult.total})
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Community detection uses the Leiden algorithm via Neo4j GDS.
              Summarization generates LLM-powered descriptions for each
              community.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── Section D: Extraction Settings ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-heading font-semibold">
            Extraction Settings
          </h2>
        </div>

        <Card>
          <CardContent className="py-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cost-limit">
                  Cost Ceiling (USD) — Pass 2 only
                </Label>
                <Input
                  id="cost-limit"
                  type="number"
                  min="0"
                  step="50"
                  value={costLimit}
                  onChange={(e) => setCostLimit(e.target.value)}
                  className="max-w-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  LLM extraction auto-pauses when cost reaches this limit.
                  Key: <code className="bg-muted px-1 rounded">graph.extraction_cost_limit_usd</code>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="concurrency">
                  Concurrency — Pass 2 only
                </Label>
                <Input
                  id="concurrency"
                  type="number"
                  min="1"
                  max="50"
                  value={concurrency}
                  onChange={(e) => setConcurrency(e.target.value)}
                  className="max-w-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  Number of chunks processed in parallel during LLM extraction.
                  Key: <code className="bg-muted px-1 rounded">graph.extraction_concurrency</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={saveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                Save Settings
              </Button>
              {settingsSaved && (
                <span className="text-sm text-chart-1 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
