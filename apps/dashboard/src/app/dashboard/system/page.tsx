"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  RefreshCw,
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

export default function SystemPage() {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = () => {
    setLoading(true);
    setError(null);
    adminFetch("/system/health")
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Failed to load system health");
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
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

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">System Health</h1>
          <p className="text-muted-foreground text-sm mt-1">
            API monitoring, latency, and error rates
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {error || "Unable to reach the API. Make sure the service is running."}
            </p>
            <Button variant="outline" size="sm" onClick={fetchHealth}>
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
          <h1 className="text-2xl font-heading font-bold">System Health</h1>
          <p className="text-muted-foreground text-sm mt-1">
            API monitoring, latency, and error rates
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHealth}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
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
              {data.requestsPerMinute}
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
              {data.avgLatency >= 1000
                ? `${(data.avgLatency / 1000).toFixed(1)}s`
                : `${data.avgLatency}ms`}
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
              {data.errorRate}%
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
              {data.p99Latency >= 1000
                ? `${(data.p99Latency / 1000).toFixed(1)}s`
                : `${data.p99Latency}ms`}
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
            {data.services.map((svc) => (
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
                    {svc.latency >= 0 ? `${svc.latency}ms` : "unreachable"}{" "}
                    &middot; {svc.uptime}
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
              {data.latencyHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No latency data in the last 24 hours
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.latencyHistory}
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
              )}
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
              {data.errorRateHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No error data in the last 24 hours
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.errorRateHistory}
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
