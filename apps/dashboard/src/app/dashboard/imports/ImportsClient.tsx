"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import {
  importsFetch,
  importsUpload,
  formatDate,
  type Dataset,
  type ImportDiff,
  type ImportResult,
} from "./lib";

const STATUS_STYLES: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  running: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function ImportsClient() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Per-dataset transient state, keyed by dataset name (NOT render-scoped vars).
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [diffs, setDiffs] = useState<Record<string, ImportDiff>>({});
  const [results, setResults] = useState<Record<string, ImportResult>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null); // dataset name currently working
  const [confirming, setConfirming] = useState<string | null>(null); // apply confirm dialog

  async function loadDatasets() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await importsFetch<Dataset[]>();
      setDatasets(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load datasets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDatasets();
  }, []);

  function pickFile(name: string, file: File | null) {
    setFiles((prev) => ({ ...prev, [name]: file }));
    // A new file invalidates any prior preview/result/error for this dataset.
    setDiffs((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setResults((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function preview(name: string) {
    const file = files[name];
    if (!file) {
      setErrors((prev) => ({ ...prev, [name]: "Choose a JSON file first." }));
      return;
    }
    setBusy(name);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    try {
      const diff = await importsUpload<ImportDiff>(`/${name}/preview`, file);
      setDiffs((prev) => ({ ...prev, [name]: diff }));
      setResults((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [name]: e instanceof Error ? e.message : "Preview failed",
      }));
    } finally {
      setBusy(null);
    }
  }

  async function apply(name: string) {
    const file = files[name];
    if (!file) {
      setErrors((prev) => ({ ...prev, [name]: "Choose a JSON file first." }));
      return;
    }
    setBusy(name);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    try {
      const result = await importsUpload<ImportResult>(`/${name}/apply`, file);
      setResults((prev) => ({ ...prev, [name]: result }));
      const failed = result.errors.length;
      if (failed === 0) {
        toast.success(
          `Applied: ${result.created} created, ${result.updated} updated`,
        );
      } else {
        toast.warning(
          `Applied with ${failed} error${failed === 1 ? "" : "s"}`,
        );
      }
      // Refresh so the last-run badge reflects this run.
      await loadDatasets();
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [name]: e instanceof Error ? e.message : "Apply failed",
      }));
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          <p>{loadError}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={loadDatasets}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No importers are registered.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {datasets.map((ds) => {
        const diff = diffs[ds.name];
        const result = results[ds.name];
        const error = errors[ds.name];
        const run = ds.latestRun;
        const working = busy === ds.name;
        const file = files[ds.name];

        return (
          <Card key={ds.name}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="font-heading">{ds.label}</CardTitle>
                  <CardDescription>{ds.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {ds.name}
                  </Badge>
                  {ds.autoApprove && (
                    <Badge variant="secondary" className="text-xs">
                      auto-approve
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Last run summary */}
              {run && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Last run</span>
                  <Badge
                    className={`${STATUS_STYLES[run.status] ?? ""} border-0 text-xs`}
                  >
                    {run.status}
                  </Badge>
                  <span className="font-mono">
                    {run.createdCount} created · {run.updatedCount} updated ·{" "}
                    {run.skippedCount} unchanged · {run.errorCount} errors
                  </span>
                  <span>{formatDate(run.finishedAt ?? run.startedAt)}</span>
                </div>
              )}

              {/* File picker + actions */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => pickFile(ds.name, e.target.files?.[0] ?? null)}
                  disabled={working}
                  className="block max-w-xs text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/70"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => preview(ds.name)}
                  disabled={working || !file}
                >
                  <Upload className="size-4" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => setConfirming(ds.name)}
                  disabled={working || !file}
                >
                  <Play className="size-4" />
                  Apply
                </Button>
                {working && (
                  <span className="text-xs text-muted-foreground">Working…</span>
                )}
              </div>

              {/* Inline error */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Preview diff */}
              {diff && (
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium">
                    <span className="font-mono">{diff.creates.length}</span> to
                    create ·{" "}
                    <span className="font-mono">{diff.updates.length}</span> to
                    update ·{" "}
                    <span className="font-mono">{diff.unchangedCount}</span>{" "}
                    unchanged
                  </p>
                  {diff.sample.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {diff.sample.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Badge
                            variant={s.kind === "create" ? "default" : "secondary"}
                            className="mt-0.5 text-xs"
                          >
                            {s.kind}
                          </Badge>
                          <span>
                            <span className="font-medium">{s.label}</span>
                            {s.detail ? (
                              <span className="text-muted-foreground">
                                {" "}
                                — {s.detail}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No changes — uploaded data matches live data.
                    </p>
                  )}
                </div>
              )}

              {/* Apply result */}
              {result && (
                <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                  <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="size-4" />
                    {result.created} created · {result.updated} updated ·{" "}
                    {result.skipped} skipped · {result.errors.length} errors
                  </p>
                  {result.errors.length > 0 && (
                    <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                      {result.errors.map((err, i) => (
                        <li key={i}>
                          <span className="font-medium">{err.label}</span>:{" "}
                          {err.error}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(v) => {
          if (!v) setConfirming(null);
        }}
        title="Apply this import?"
        description="This creates and applies proposals through the audited enrichment pipeline, writing to live data."
        confirmLabel="Apply"
        destructive
        onConfirm={async () => {
          const name = confirming;
          setConfirming(null);
          if (name) await apply(name);
        }}
      />
    </div>
  );
}
