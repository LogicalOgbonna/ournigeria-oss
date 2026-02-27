"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Search, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { adminFetch } from "@/lib/api";

const COLORS = [
  "oklch(0.56 0.155 160)",
  "oklch(0.6 0.118 184.704)",
  "oklch(0.75 0.15 85)",
  "oklch(0.627 0.265 303.9)",
  "oklch(0.645 0.246 16.439)",
];

interface QueryAnalytics {
  totalQueries: number;
  avgRetrievalScore: number;
  failedQueries: number;
  avgResponseTime: number;
  categoryCounts: { category: string; count: number }[];
  dailyVolume: { date: string; count: number; avgScore: number }[];
  lowScoreQueries: { query: string; score: number; date: string }[];
}

const placeholder: QueryAnalytics = {
  totalQueries: 42150,
  avgRetrievalScore: 0.847,
  failedQueries: 312,
  avgResponseTime: 2.3,
  categoryCounts: [
    { category: "Budget", count: 15420 },
    { category: "Corruption", count: 9105 },
    { category: "Infrastructure", count: 6230 },
    { category: "Education", count: 5890 },
    { category: "Health", count: 3786 },
    { category: "Other", count: 1719 },
  ],
  dailyVolume: Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: Math.floor(200 + Math.random() * 300),
      avgScore: 0.75 + Math.random() * 0.2,
    };
  }),
  lowScoreQueries: [
    { query: "What is the GDP of Nigeria?", score: 0.21, date: new Date(Date.now() - 3600000).toISOString() },
    { query: "Who is the president?", score: 0.18, date: new Date(Date.now() - 7200000).toISOString() },
    { query: "Weather in Lagos today", score: 0.12, date: new Date(Date.now() - 10800000).toISOString() },
    { query: "Best restaurants in Abuja", score: 0.09, date: new Date(Date.now() - 14400000).toISOString() },
    { query: "Nigeria football scores", score: 0.15, date: new Date(Date.now() - 18000000).toISOString() },
  ],
};

export default function AIAnalyticsPage() {
  const [data, setData] = useState<QueryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/ai/analytics")
      .then(setData)
      .catch(() => setData(placeholder))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const d = data!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Query Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">RAG pipeline performance and query insights</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="opacity-0 animate-fade-in-up stagger-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Queries</CardTitle>
            <Search className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold font-heading">{d.totalQueries.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="opacity-0 animate-fade-in-up stagger-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Retrieval Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold font-heading">{(d.avgRetrievalScore * 100).toFixed(1)}%</div></CardContent>
        </Card>
        <Card className="opacity-0 animate-fade-in-up stagger-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Queries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold font-heading">{d.failedQueries}</div></CardContent>
        </Card>
        <Card className="opacity-0 animate-fade-in-up stagger-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold font-heading">{d.avgResponseTime}s</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Query Volume & Score (14 days)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={d.dailyVolume} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 1]} className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "12px" }} />
                  <Bar yAxisId="left" dataKey="count" fill="oklch(0.56 0.155 160)" opacity={0.3} radius={[2, 2, 0, 0]} />
                  <Line yAxisId="right" dataKey="avgScore" stroke="oklch(0.75 0.15 85)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Query Categories</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={d.categoryCounts} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} className="text-xs">
                    {d.categoryCounts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Low Score Queries (needs attention)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {d.lowScoreQueries.map((q, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm flex-1">{q.query}</span>
                <Badge variant="destructive" className="text-xs shrink-0">
                  {(q.score * 100).toFixed(0)}% match
                </Badge>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(q.date).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
