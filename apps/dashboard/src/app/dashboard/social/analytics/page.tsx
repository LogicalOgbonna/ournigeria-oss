"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Send,
  CheckCircle2,
  XCircle,
  BarChart3,
  MessageCircle,
} from "lucide-react";
import { socialsFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

interface AnalyticsStats {
  totalPosts: number;
  published: number;
  failed: number;
  repliesApproved: number;
}

interface PostItem {
  id: string;
  content: string;
  platform: string;
  status: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  publishedAt: string;
}

interface ChartPoint {
  date: string;
  posts: number;
  replies: number;
}

const postStatusColors: Record<string, string> = {
  published:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  scheduled:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  failed:
    "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
  draft:
    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

export default function SocialAnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);

    Promise.allSettled([
      socialsFetch("/analytics/stats"),
      socialsFetch("/analytics/posts"),
      socialsFetch("/analytics/chart-data"),
    ])
      .then(([statsResult, postsResult, chartResult]) => {
        if (statsResult.status === "fulfilled") setStats(statsResult.value);
        if (postsResult.status === "fulfilled") {
          const v = postsResult.value;
          setPosts(
            Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : [],
          );
        }
        if (chartResult.status === "fulfilled") {
          const v = chartResult.value;
          setChartData(
            Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : [],
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Social Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Post performance and engagement metrics
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total Posts",
              value: stats.totalPosts,
              color: "text-foreground",
              icon: BarChart3,
            },
            {
              label: "Published",
              value: stats.published,
              color: "text-emerald-600",
              icon: Send,
            },
            {
              label: "Failed",
              value: stats.failed,
              color: "text-red-600",
              icon: XCircle,
            },
            {
              label: "Replies Approved",
              value: stats.repliesApproved,
              color: "text-blue-600",
              icon: CheckCircle2,
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="posts"
                    stackId="1"
                    stroke="hsl(var(--chart-1, 142 71% 45%))"
                    fill="hsl(var(--chart-1, 142 71% 45%))"
                    fillOpacity={0.3}
                    name="Posts"
                  />
                  <Area
                    type="monotone"
                    dataKey="replies"
                    stackId="2"
                    stroke="hsl(var(--chart-2, 217 91% 60%))"
                    fill="hsl(var(--chart-2, 217 91% 60%))"
                    fillOpacity={0.3}
                    name="Replies"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent posts table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>No posts yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Retweets</TableHead>
                  <TableHead className="text-right">Replies</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead>Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm truncate">{post.content}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {post.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${postStatusColors[post.status] || ""}`}
                      >
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {post.likes?.toLocaleString() ?? 0}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {post.retweets?.toLocaleString() ?? 0}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {post.replies?.toLocaleString() ?? 0}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {post.impressions?.toLocaleString() ?? 0}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.publishedAt ? formatDateTime(post.publishedAt) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
