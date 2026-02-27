"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileText, ChevronLeft, ChevronRight, File, FileSpreadsheet } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { adminFetch } from "@/lib/api";

interface Document {
  id: string;
  fileName: string;
  filePath: string;
  state: string;
  year: string;
  fileType: string;
  fileSize: number;
  chunks: number;
  lastIngested: string;
}

const nigerianStates = [
  "All States", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const fileTypes = ["pdf", "xlsx", "docx", "json"];

const placeholderDocs: Document[] = Array.from({ length: 30 }, (_, i) => {
  const state = nigerianStates[1 + (i % 37)];
  const year = String(2020 + (i % 6));
  const type = fileTypes[i % 4];
  return {
    id: `doc-${i}`,
    fileName: `${state.toLowerCase()}-budget-${year}.${type}`,
    filePath: `budgets/${state.toLowerCase()}/${year}-approved.${type}`,
    state,
    year,
    fileType: type,
    fileSize: Math.floor(500000 + Math.random() * 10000000),
    chunks: Math.floor(200 + Math.random() * 3000),
    lastIngested: new Date(Date.now() - i * 86400000).toISOString(),
  };
});

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  switch (type) {
    case "xlsx": return <FileSpreadsheet className="h-4 w-4 text-chart-1" />;
    case "pdf": return <FileText className="h-4 w-4 text-destructive" />;
    default: return <File className="h-4 w-4 text-chart-2" />;
  }
}

const PAGE_SIZE = 20;

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("All States");
  const [yearFilter, setYearFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (stateFilter !== "All States") params.set("state", stateFilter);
      if (yearFilter !== "all") params.set("year", yearFilter);
      const res = await adminFetch(`/documents?${params}`);
      setDocs(res.data ?? res);
      setTotal(res.total ?? 0);
    } catch {
      let filtered = placeholderDocs;
      if (debouncedSearch) filtered = filtered.filter((d) => d.fileName.toLowerCase().includes(debouncedSearch.toLowerCase()));
      if (stateFilter !== "All States") filtered = filtered.filter((d) => d.state === stateFilter);
      if (yearFilter !== "all") filtered = filtered.filter((d) => d.year === yearFilter);
      setDocs(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, stateFilter, yearFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, stateFilter, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Document Catalog</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse all ingested documents by state, year, and type ({total} total)</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {nigerianStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {["2025", "2024", "2023", "2022", "2021", "2020"].map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Chunks</TableHead>
                <TableHead>Last Ingested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No documents found</TableCell>
                </TableRow>
              ) : docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {fileIcon(doc.fileType)}
                      <span className="text-sm truncate max-w-[250px]">{doc.fileName}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">{doc.fileType}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{doc.state}</TableCell>
                  <TableCell className="text-sm">{doc.year}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{formatSize(doc.fileSize)}</TableCell>
                  <TableCell className="text-right"><Badge variant="secondary" className="text-xs">{doc.chunks.toLocaleString()}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(doc.lastIngested).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
