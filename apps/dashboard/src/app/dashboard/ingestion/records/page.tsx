"use client";

import { useEffect, useState, useCallback } from "react";
import { IngestionRecordsTable, type IngestionRecord } from "@/components/ingestion/ingestion-records-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminFetch } from "@/lib/api";

const PAGE_SIZE = 25;

const placeholderRecords: IngestionRecord[] = Array.from({ length: 5 }, (_, i) => ({
  id: `rec-${i}`,
  pipeline: "budget",
  filePath: `budgets/lagos/budget-${2020 + i}.pdf`,
  status: i === 3 ? "failed" : "completed",
  chunks: i === 3 ? 0 : Math.floor(Math.random() * 2000) + 500,
  error: i === 3 ? "OCR extraction failed" : null,
  updatedAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export default function RecordsPage() {
  const [records, setRecords] = useState<IngestionRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pipeline, setPipeline] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (pipeline !== "all") params.set("pipeline", pipeline);
      if (status !== "all") params.set("status", status);
      const res = await adminFetch(`/ingestion-records?${params}`);
      setRecords(res.data ?? res);
      setTotal(res.total ?? res.length ?? 0);
    } catch {
      setRecords(placeholderRecords);
      setTotal(placeholderRecords.length);
    } finally {
      setLoading(false);
    }
  }, [page, pipeline, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [pipeline, status]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Ingestion Records</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Individual file processing records ({total.toLocaleString()} total)
        </p>
      </div>

      <div className="flex gap-3">
        <Select value={pipeline} onValueChange={setPipeline}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pipelines</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
            <SelectItem value="corruption">Corruption</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : (
        <IngestionRecordsTable records={records} />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
