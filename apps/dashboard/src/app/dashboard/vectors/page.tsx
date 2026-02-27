"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Database, RefreshCw, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/api";

interface VectorStats {
  totalChunks: number;
  totalDocuments: number;
  indexSize: string;
  embeddingModel: string;
  dimensions: number;
  stateBreakdown: { state: string; chunks: number; documents: number }[];
}

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const placeholder: VectorStats = {
  totalChunks: 708309,
  totalDocuments: 700,
  indexSize: "2.4 GB",
  embeddingModel: "voyage-3-large",
  dimensions: 1024,
  stateBreakdown: nigerianStates.map((state) => ({
    state,
    chunks: Math.floor(5000 + Math.random() * 40000),
    documents: Math.floor(5 + Math.random() * 30),
  })).sort((a, b) => b.chunks - a.chunks),
};

export default function VectorsPage() {
  const [data, setData] = useState<VectorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/vectors/stats")
      .then(setData)
      .catch(() => setData(placeholder))
      .finally(() => setLoading(false));
  }, []);

  async function handleReindex(state: string) {
    setReindexing(state);
    try {
      await adminFetch("/vectors/reindex", { method: "POST", body: JSON.stringify({ state }) });
    } catch {}
    finally { setReindexing(null); }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const d = data!;
  const maxChunks = Math.max(...d.stateBreakdown.map((s) => s.chunks));
  const top10 = d.stateBreakdown.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Vector Store</h1>
        <p className="text-muted-foreground text-sm mt-1">Embedding statistics and state coverage</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Chunks</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold font-heading">{d.totalChunks.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold font-heading">{d.totalDocuments}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Index Size</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold font-heading">{d.indexSize}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Model</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-bold font-heading font-mono">{d.embeddingModel}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Dimensions</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold font-heading">{d.dimensions}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Top 10 States by Chunks</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis dataKey="state" type="category" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "12px" }} />
                <Bar dataKey="chunks" fill="oklch(0.56 0.155 160)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">All States Coverage</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border max-h-[500px] overflow-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead className="text-right">Chunks</TableHead>
                  <TableHead className="text-right">Documents</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.stateBreakdown.map((s) => (
                  <TableRow key={s.state}>
                    <TableCell className="font-medium text-sm">{s.state}</TableCell>
                    <TableCell className="w-[200px]">
                      <Progress value={(s.chunks / maxChunks) * 100} className="h-2" />
                    </TableCell>
                    <TableCell className="text-right text-sm">{s.chunks.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm">{s.documents}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleReindex(s.state)}
                        disabled={reindexing === s.state}
                      >
                        {reindexing === s.state ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                        Reindex
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
