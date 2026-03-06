"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Minus, ServerOff } from "lucide-react";
import { adminFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useQueryState, parseAsString } from "nuqs";

interface CoverageRow {
  label: string;
  coverage: Record<string, "full" | "partial" | "missing">;
  totalDocs: number;
  totalChunks: number;
}

interface CoverageResponse {
  pipeline: string;
  rowLabel: string;
  colLabel: string;
  columns: string[];
  data: CoverageRow[];
}

const PIPELINES = [
  { key: "budget", label: "Budget" },
  { key: "faac", label: "FAAC" },
  { key: "govspend", label: "GovSpend" },
  { key: "corruption", label: "Corruption" },
];

const PIPELINE_DESCRIPTIONS: Record<string, string> = {
  budget: "Budget document coverage across all 37 states",
  faac: "FAAC disbursement data coverage by year and month",
  govspend: "Government spending records coverage by year and month",
  corruption: "Corruption case document coverage by official",
};

/** Abbreviate month names (e.g. "January" → "Jan"), pass others through */
const MONTH_ABBREV: Record<string, string> = {
  January: "Jan", February: "Feb", March: "Mar", April: "Apr",
  May: "May", June: "Jun", July: "Jul", August: "Aug",
  September: "Sep", October: "Oct", November: "Nov", December: "Dec",
};
function abbreviateColumn(col: string): string {
  return MONTH_ABBREV[col] ?? col;
}

export default function CoveragePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-96" />
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      }
    >
      <CoveragePageContent />
    </Suspense>
  );
}

function CoveragePageContent() {
  const [pipeline, setPipeline] = useQueryState(
    "pipeline",
    parseAsString.withDefault("budget").withOptions({ shallow: true }),
  );
  const [response, setResponse] = useState<CoverageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoverage = useCallback((p: string) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    adminFetch(`/documents/coverage?pipeline=${p}`)
      .then(setResponse)
      .catch((err) => setError(err?.message ?? "Failed to load coverage data"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCoverage(pipeline);
  }, [pipeline, fetchCoverage]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Coverage Report</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {PIPELINE_DESCRIPTIONS[pipeline] ?? "Document coverage report"}
        </p>
      </div>

      <Tabs value={pipeline} onValueChange={setPipeline}>
        <TabsList>
          {PIPELINES.map((p) => (
            <TabsTrigger key={p.key} value={p.key}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      )}

      {!loading && (error || !response) && (
        <Card>
          <CardContent className="py-16 text-center">
            <ServerOff className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">
              {error ?? "Coverage endpoint not yet implemented."}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && response && <CoverageMatrix response={response} />}
    </div>
  );
}

function CoverageMatrix({ response }: { response: CoverageResponse }) {
  const { data, columns, rowLabel, colLabel } = response;

  const totalFull = data.reduce(
    (sum, r) =>
      sum + Object.values(r.coverage).filter((v) => v === "full").length,
    0,
  );
  const totalPartial = data.reduce(
    (sum, r) =>
      sum + Object.values(r.coverage).filter((v) => v === "partial").length,
    0,
  );
  const totalMissing = data.reduce(
    (sum, r) =>
      sum + Object.values(r.coverage).filter((v) => v === "missing").length,
    0,
  );
  const totalCells = data.length * columns.length;
  const coveragePercent =
    totalCells > 0
      ? (((totalFull + totalPartial * 0.5) / totalCells) * 100).toFixed(1)
      : "0.0";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold font-heading">
              {coveragePercent}%
            </p>
            <p className="text-xs text-muted-foreground">Overall Coverage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold font-heading text-chart-1">
              {totalFull}
            </p>
            <p className="text-xs text-muted-foreground">Full Coverage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold font-heading text-amber-500">
              {totalPartial}
            </p>
            <p className="text-xs text-muted-foreground">Partial</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold font-heading text-destructive">
              {totalMissing}
            </p>
            <p className="text-xs text-muted-foreground">Missing</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {rowLabel} {columns.length > 1 ? `x ${colLabel}` : ""} Coverage Matrix
          </CardTitle>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-block h-3 w-3 shrink-0 rounded-sm bg-chart-1" /> Full
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-block h-3 w-3 shrink-0 rounded-sm bg-amber-500" /> Partial
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-block h-3 w-3 shrink-0 rounded-sm bg-destructive" /> Missing
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto custom-scrollbar max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr>
                  <th className="text-left font-medium text-muted-foreground py-2 pr-4 w-[140px]">
                    {rowLabel}
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="text-center font-medium text-muted-foreground py-2 px-1 w-[55px]"
                      title={col}
                    >
                      {abbreviateColumn(col)}
                    </th>
                  ))}
                  <th className="text-right font-medium text-muted-foreground py-2 pl-4 w-[70px]">
                    Docs
                  </th>
                  <th className="text-right font-medium text-muted-foreground py-2 pl-4 w-[80px]">
                    Chunks
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="py-2 pr-4 font-medium truncate max-w-[140px]" title={row.label}>
                      {row.label}
                    </td>
                    {columns.map((col) => {
                      const status = row.coverage[col];
                      return (
                        <td key={col} className="text-center py-2 px-1">
                          <div
                            className={cn(
                              "mx-auto h-6 w-6 rounded-sm flex items-center justify-center",
                              status === "full" && "bg-chart-1/20",
                              status === "partial" && "bg-amber-500/20",
                              status === "missing" && "bg-destructive/10",
                            )}
                          >
                            {status === "full" && (
                              <CheckCircle className="h-3 w-3 text-chart-1" />
                            )}
                            {status === "partial" && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                            {status === "missing" && (
                              <Minus className="h-3 w-3 text-destructive/50" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-right py-2 pl-4 text-muted-foreground">
                      {row.totalDocs}
                    </td>
                    <td className="text-right py-2 pl-4 text-muted-foreground">
                      {row.totalChunks.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
