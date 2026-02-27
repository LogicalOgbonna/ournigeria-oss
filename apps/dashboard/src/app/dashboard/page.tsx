"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UserGrowthChart } from "@/components/dashboard/user-growth-chart";
import { QueryCategoriesChart } from "@/components/dashboard/query-categories-chart";
import { RecentRuns } from "@/components/dashboard/recent-runs";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/api";

interface Stats {
  users: number;
  conversations: number;
  messages: number;
  documents: number;
  topCategories: { category: string; count: number }[];
}

interface GrowthPoint {
  date: string;
  count: number;
}

interface Run {
  id: string;
  pipeline: string;
  status: string;
  totalFiles: number;
  totalChunks: number;
  startedAt: string;
}

// Placeholder data while the backend endpoints are being built
const placeholderStats: Stats = {
  users: 1247,
  conversations: 8432,
  messages: 42150,
  documents: 700,
  topCategories: [
    { category: "Budget", count: 3421 },
    { category: "Corruption", count: 2105 },
    { category: "Infrastructure", count: 1230 },
    { category: "Education", count: 890 },
    { category: "Health", count: 786 },
  ],
};

const placeholderGrowth: GrowthPoint[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count: Math.floor(20 + Math.random() * 60),
  };
});

const placeholderRuns: Run[] = [
  {
    id: "fb323dc0",
    pipeline: "budget",
    status: "completed",
    totalFiles: 700,
    totalChunks: 708309,
    startedAt: "2026-02-23T10:00:00Z",
  },
];

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [growth, setGrowth] = useState<GrowthPoint[] | null>(null);
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, growthRes, runsRes] = await Promise.allSettled([
          adminFetch("/stats"),
          adminFetch("/user-growth?days=30"),
          adminFetch("/ingestion-runs?limit=5"),
        ]);

        setStats(statsRes.status === "fulfilled" ? statsRes.value : placeholderStats);
        setGrowth(growthRes.status === "fulfilled" ? growthRes.value : placeholderGrowth);
        setRuns(runsRes.status === "fulfilled" ? (runsRes.value.data ?? runsRes.value) : placeholderRuns);
      } catch {
        setStats(placeholderStats);
        setGrowth(placeholderGrowth);
        setRuns(placeholderRuns);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform analytics at a glance</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[340px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform analytics at a glance</p>
      </div>

      <StatsCards data={stats!} />

      <div className="grid gap-4 lg:grid-cols-3">
        <UserGrowthChart data={growth!} />
        <QueryCategoriesChart data={stats!.topCategories} />
      </div>

      <RecentRuns runs={runs!} />
    </div>
  );
}
