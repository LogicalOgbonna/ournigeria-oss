"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/api";

interface BackupJob {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  type: "FULL" | "RELATIONAL";
  sizeBytes: string | null;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

function humanSize(bytes: string | null): string {
  if (!bytes) return "—";
  let n = Number(bytes);
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

function statusVariant(s: BackupJob["status"]) {
  if (s === "COMPLETED") return "default" as const;
  if (s === "FAILED") return "destructive" as const;
  return "secondary" as const;
}

export default function BackupsPage() {
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [type, setType] = useState<BackupJob["type"]>("FULL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setJobs(await adminFetch("/backups"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Poll every 3s while any job is in flight.
  useEffect(() => {
    const active = jobs.some((j) => j.status === "PENDING" || j.status === "RUNNING");
    if (!active) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [jobs, load]);

  async function trigger() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function download(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/backups/${id}/download`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const { url } = await res.json();
      window.location.href = url; // presigned S3 URL, direct download
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this backup? The S3 file will be removed.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/backups/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Database Backups</h1>
        <p className="text-muted-foreground text-sm">
          Trigger a pg_dump of production and download it from S3.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as BackupJob["type"])}
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          >
            <option value="FULL">Full (includes vector chunks)</option>
            <option value="RELATIONAL">Relational only (fast, no vectors)</option>
          </select>
          <Button onClick={trigger} disabled={busy}>
            {busy ? "Starting…" : "Create backup"}
          </Button>
          {error && <span className="text-destructive text-sm">{error}</span>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b text-left">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Type</th>
                <th className="p-3">Size</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-muted-foreground p-6 text-center">
                    No backups yet.
                  </td>
                </tr>
              )}
              {jobs.map((j) => (
                <tr key={j.id} className="border-b">
                  <td className="p-3">
                    <Badge variant={statusVariant(j.status)}>{j.status}</Badge>
                    {j.error && (
                      <div className="text-destructive mt-1 max-w-xs truncate text-xs">
                        {j.error}
                      </div>
                    )}
                  </td>
                  <td className="p-3">{j.type}</td>
                  <td className="p-3">{humanSize(j.sizeBytes)}</td>
                  <td className="p-3">{new Date(j.createdAt).toLocaleString()}</td>
                  <td className="space-x-2 p-3">
                    {j.status === "COMPLETED" && (
                      <Button size="sm" variant="outline" onClick={() => download(j.id)}>
                        Download
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(j.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
