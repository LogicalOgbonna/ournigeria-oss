"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Server,
} from "lucide-react";
import { adminFetch } from "@/lib/api";

interface SystemHealth {
  services: {
    name: string;
    status: "healthy" | "degraded" | "down";
    latency: number;
    uptime: string;
  }[];
  latencyHistory: { time: string; api: number; ingest: number }[];
  errorRateHistory: { time: string; errors: number; total: number }[];
  requestsPerMinute: number;
  avgLatency: number;
  errorRate: number;
  p99Latency: number;
}

const placeholder: SystemHealth = {
  services: [
    { name: "API (NestJS)", status: "healthy", latency: 45, uptime: "99.97%" },
    {
      name: "Ingest Service",
      status: "healthy",
      latency: 62,
      uptime: "99.94%",
    },
    { name: "PostgreSQL", status: "healthy", latency: 3, uptime: "99.99%" },
    { name: "pgvector", status: "healthy", latency: 18, uptime: "99.99%" },
    {
      name: "Voyage AI (embeddings)",
      status: "healthy",
      latency: 210,
      uptime: "99.85%",
    },
    { name: "S3 Storage", status: "healthy", latency: 35, uptime: "99.99%" },
  ],
  latencyHistory: Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    api: 30 + Math.random() * 80,
    ingest: 50 + Math.random() * 100,
  })),
  errorRateHistory: Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    errors: Math.floor(Math.random() * 5),
    total: 200 + Math.floor(Math.random() * 300),
  })),
  requestsPerMinute: 42,
  avgLatency: 87,
  errorRate: 0.3,
  p99Latency: 450,
};

export default function SystemPage() {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/system/health")
      .then(setData)
      .catch(() => setData(placeholder))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const d = data!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">System Health</h1>
        <p className="text-muted-foreground text-sm mt-1">
          API monitoring, latency, and error rates
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Requests/min
            </CardTitle>
            <Activity className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">
              {d.requestsPerMinute}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Latency
            </CardTitle>
            <Clock className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">
              {d.avgLatency >= 1000
                ? `${(d.avgLatency / 1000).toFixed(1)}s`
                : `${d.avgLatency}ms`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Error Rate
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">
              {d.errorRate}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              P99 Latency
            </CardTitle>
            <Clock className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">
              {d.p99Latency >= 1000
                ? `${(d.p99Latency / 1000).toFixed(1)}s`
                : `${d.p99Latency}ms`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.services.map((svc) => (
              <div
                key={svc.name}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                {svc.status === "healthy" ? (
                  <CheckCircle className="h-4 w-4 text-chart-1 shrink-0" />
                ) : svc.status === "degraded" ? (
                  <AlertTriangle className="h-4 w-4 text-chart-3 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{svc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {svc.latency}ms &middot; {svc.uptime}
                  </p>
                </div>
                <Badge
                  variant={
                    svc.status === "healthy"
                      ? "default"
                      : svc.status === "degraded"
                        ? "secondary"
                        : "destructive"
                  }
                  className="text-xs capitalize shrink-0"
                >
                  {svc.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Latency (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={d.latencyHistory}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="time"
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    dataKey="api"
                    stroke="oklch(0.56 0.155 160)"
                    strokeWidth={2}
                    dot={false}
                    name="API"
                  />
                  <Line
                    dataKey="ingest"
                    stroke="oklch(0.6 0.118 184.704)"
                    strokeWidth={2}
                    dot={false}
                    name="Ingest"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Errors (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={d.errorRateHistory}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="time"
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="errors"
                    fill="oklch(0.577 0.245 27.325)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
