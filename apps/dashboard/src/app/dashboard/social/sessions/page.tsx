"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { socialsFetch } from "@/lib/api";
import type { SessionsListResponse } from "@/components/socials/types";

const statusColor: Record<string, string> = {
  idle: "bg-emerald-100 text-emerald-700",
  working: "bg-blue-100 text-blue-700",
  auth_failed: "bg-red-100 text-red-700",
};

export default function SessionsPage() {
  const [data, setData] = useState<SessionsListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    socialsFetch("/v1/sessions")
      .then(setData)
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function remove(id: string) {
    if (!confirm("Delete this session?")) return;
    await socialsFetch(`/v1/sessions/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/social"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold">
              Bot sessions
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Captured by the Chrome extension. Each session is one logged-in X
              account; the roamer rotates through them per window.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={reload}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Idle", value: data.counts.idle, color: "text-emerald-600" },
            { label: "Working", value: data.counts.working, color: "text-blue-600" },
            { label: "Auth failed", value: data.counts.auth_failed, color: "text-red-600" },
            { label: "Claimable", value: data.counts.claimable, color: "text-foreground" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-3 px-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !data || data.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <p>No bot sessions captured yet.</p>
            <p className="text-xs">
              Install the Chrome extension at{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded">
                apps/socials/extension
              </code>
              , configure the backend URL + roamer key, then arm a capture from
              x.com.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.items.map((s) => (
            <Card key={s.id}>
              <CardContent className="py-3 px-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">@{s.userName}</span>
                    <Badge
                      className={`text-[11px] capitalize ${statusColor[s.status] ?? ""}`}
                    >
                      {s.status.replace("_", " ")}
                    </Badge>
                    {!s.hasOpHash && (
                      <Badge variant="outline" className="text-[11px] text-amber-600">
                        op hash missing — re-capture
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground space-x-3">
                    <span>path: {s.path}</span>
                    <span>
                      last used: {new Date(s.lastUsedAt).toLocaleString()}
                    </span>
                    {s.cooldownUntil && (
                      <span>
                        cooldown until:{" "}
                        {new Date(s.cooldownUntil).toLocaleString()}
                      </span>
                    )}
                    {s.consecutiveErrors > 0 && (
                      <span className="text-red-600">
                        consecutive errors: {s.consecutiveErrors}
                      </span>
                    )}
                  </div>
                  {s.lastError && (
                    <p className="text-[11px] text-red-600 max-w-xl truncate">
                      {s.lastError}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(s.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
