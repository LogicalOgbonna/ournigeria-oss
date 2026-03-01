"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Database,
  Layers,
  FileText,
  HardDrive,
  Cpu,
  Hash,
  Download,
} from "lucide-react";
import { adminFetch } from "@/lib/api";
import { useQueryState, parseAsString } from "nuqs";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IndexInfo {
  key: string;
  label: string;
  groupKey: string;
}

interface DistributionItem {
  key: string;
  chunks: number;
  documents: number;
}

interface VectorStats {
  totalChunks: number;
  totalDocuments: number;
  totalSize: string;
  tableSize: string;
  indexSize: string;
  embeddingModel: string;
  dimensions: number;
  vectorType: string;
  indexMethod: string;
  indexName: string;
  tableName: string;
  groupKey: string;
  distribution: DistributionItem[];
}

export default function VectorsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-96" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      }
    >
      <VectorsPageContent />
    </Suspense>
  );
}

function VectorsPageContent() {
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useQueryState(
    "index",
    parseAsString.withDefault("budget").withOptions({ shallow: true }),
  );
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    adminFetch("/vectors/indexes")
      .then((res) => {
        setIndexes(res.data);
        // If the current selectedIndex is not in the list, set to the first one
        if (
          res.data.length > 0 &&
          !res.data.find((i: IndexInfo) => i.key === selectedIndex)
        ) {
          setSelectedIndex(res.data[0].key);
        }
      })
      .catch(() => {
        const fallbacks = [
          { key: "budget", label: "Budget", groupKey: "state" },
          { key: "corruption", label: "Corruption", groupKey: "official" },
          { key: "govspend", label: "GovSpend", groupKey: "organization_name" },
        ];
        setIndexes(fallbacks);
        if (!fallbacks.find((i) => i.key === selectedIndex)) {
          setSelectedIndex(fallbacks[0].key);
        }
      })
      .finally(() => setLoading(false));
  }, []); // Only run on mount

  const fetchStats = useCallback((indexKey: string) => {
    setStatsLoading(true);
    setStats(null);
    adminFetch(`/vectors/stats?index=${indexKey}`)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && selectedIndex) {
      fetchStats(selectedIndex);
    }
  }, [selectedIndex, loading, fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-96" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const currentIndex = indexes.find((i) => i.key === selectedIndex);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Vector Store</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Embedding statistics and index coverage
        </p>
      </div>

      <Tabs value={selectedIndex} onValueChange={setSelectedIndex}>
        <TabsList>
          {indexes.map((idx) => (
            <TabsTrigger key={idx.key} value={idx.key}>
              {idx.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {statsLoading ? (
        <StatsLoading />
      ) : stats ? (
        <StatsContent
          stats={stats}
          groupLabel={currentIndex?.groupKey ?? "key"}
          indexKey={selectedIndex}
        />
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Failed to load stats for this index. The table may not exist yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

interface DocumentItem {
  s3Key: string;
  filename: string;
  chunks: number;
}

function formatDisplayInfo(s3Key: string): {
  title: string;
  year: string | null;
  ext: string;
} {
  if (!s3Key) return { title: "Unknown", year: null, ext: "" };

  const parts = s3Key.split("/");
  const filename = parts.pop() || "";

  // Extract extension
  const extMatch = filename.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? `.${extMatch[1]}` : "";

  // Remove extension for the title
  let title = filename;
  if (ext) {
    title = title.substring(0, title.length - ext.length);
  }

  // Find year from path parts (4 digits)
  const yearStr = parts.find((p) => /^\d{4}$/.test(p));
  const year = yearStr || null;

  return { title, year, ext };
}

function DocumentsModal({
  isOpen,
  onClose,
  indexKey,
  groupValue,
}: {
  isOpen: boolean;
  onClose: () => void;
  indexKey: string;
  groupValue: string | null;
}) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && groupValue) {
      setLoading(true);
      adminFetch(
        `/vectors/documents?index=${indexKey}&groupValue=${encodeURIComponent(groupValue)}`,
      )
        .then((res) => setDocuments(res.data || []))
        .catch(() => setDocuments([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, indexKey, groupValue]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[84rem] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-lg">
        <DialogHeader className="px-6 py-5 border-b bg-muted/20">
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-muted-foreground" />
            Documents for: <span className="text-primary">{groupValue}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {(() => {
            if (loading) {
              return (
                <div className="p-12 flex flex-col items-center justify-center gap-4">
                  <Skeleton className="h-6 w-64 mb-4" />
                  <div className="w-full space-y-3">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                </div>
              );
            }

            if (documents.length === 0) {
              return (
                <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
                  <FileText className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No documents found</p>
                  <p className="text-sm">
                    There are no chunks associated with this entity.
                  </p>
                </div>
              );
            }

            return (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc, i) => {
                  const { title, year, ext } = formatDisplayInfo(doc.s3Key);
                  return (
                    <div
                      key={`${doc.s3Key}-${i}`}
                      className="flex flex-col justify-between p-4 border rounded-xl bg-card hover:bg-accent/10 transition-colors group relative overflow-hidden"
                    >
                      <div className="mb-4 pr-10">
                        <h4
                          className="font-semibold text-foreground text-sm line-clamp-2 leading-snug"
                          title={doc.filename}
                        >
                          {title}
                        </h4>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-medium">
                          {year && (
                            <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md">
                              Year:{" "}
                              <span className="text-foreground">{year}</span>
                            </span>
                          )}
                          {ext && (
                            <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {ext.replace(".", "")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto border-t pt-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground">
                            {doc.chunks.toLocaleString()}
                          </span>{" "}
                        </span>

                        <a
                          href={`https://spend-ng.s3.eu-west-1.amazonaws.com/${doc.s3Key}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground h-8 px-3 gap-1.5"
                          title="Download document"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatsContent({
  stats,
  groupLabel,
  indexKey,
}: {
  stats: VectorStats;
  groupLabel: string;
  indexKey: string;
}) {
  const [selectedGroup, setSelectedGroup] = useQueryState("group");

  const maxChunks = Math.max(...stats.distribution.map((d) => d.chunks), 1);
  const top10 = stats.distribution.slice(0, 10);
  const displayLabel = groupLabel
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <DocumentsModal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        indexKey={indexKey}
        groupValue={selectedGroup}
      />
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Chunks"
          value={stats.totalChunks.toLocaleString()}
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="Documents"
          value={stats.totalDocuments.toLocaleString()}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Total Size"
          value={stats.totalSize}
          icon={<HardDrive className="h-4 w-4" />}
        />
        <StatCard
          label="Model"
          value={stats.embeddingModel}
          icon={<Cpu className="h-4 w-4" />}
          mono
        />
        <StatCard
          label="Dimensions"
          value={stats.dimensions.toString()}
          icon={<Hash className="h-4 w-4" />}
        />
      </div>

      {/* Index details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Index Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Table</span>
              <p className="font-mono font-medium">{stats.tableName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Vector Type</span>
              <p className="font-mono font-medium">{stats.vectorType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Index Method</span>
              <p className="font-mono font-medium uppercase">
                {stats.indexMethod}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Table / Index Size</span>
              <p className="font-mono font-medium">
                {stats.tableSize} / {stats.indexSize}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bar chart: top 10 */}
      {top10.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top 10 by {displayLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top10}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    className="stroke-border"
                  />
                  <XAxis
                    type="number"
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="key"
                    type="category"
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    width={120}
                    tick={{ fontSize: 11 }}
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
                    dataKey="chunks"
                    fill="oklch(0.56 0.155 160)"
                    radius={[0, 4, 4, 0]}
                    onClick={(data) =>
                      setSelectedGroup(data.key ? String(data.key) : null)
                    }
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full distribution table */}
      {stats.distribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              All {displayLabel} Coverage ({stats.distribution.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border max-h-[500px] overflow-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{displayLabel}</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead className="text-right">Chunks</TableHead>
                    <TableHead className="text-right">Documents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.distribution.map((item) => (
                    <TableRow
                      key={item.key}
                      onClick={() => setSelectedGroup(item.key)}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium text-sm">
                        {item.key || "unknown"}
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <Progress
                          value={(item.chunks / maxChunks) * 100}
                          className="h-2"
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.chunks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.documents.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold font-heading ${mono ? "text-lg font-mono" : ""}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
