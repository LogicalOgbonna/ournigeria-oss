"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, FileText } from "lucide-react";
import { adminFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface IndexInfo {
  key: string;
  label: string;
  groupKey: string;
}

interface SearchResult {
  id: string;
  file: string;
  score: number;
  content: string;
  metadata: Record<string, string>;
}

export default function SimilaritySearchPage() {
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState("budget");
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState("10");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    adminFetch("/vectors/indexes")
      .then((res) => {
        setIndexes(res.data);
        if (res.data.length > 0) setSelectedIndex(res.data[0].key);
      })
      .catch(() => {
        setIndexes([
          { key: "budget", label: "Budget", groupKey: "state" },
          { key: "corruption", label: "Corruption", groupKey: "official" },
          { key: "govspend", label: "GovSpend", groupKey: "organization_name" },
        ]);
      });
  }, []);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    setResults(null);
    setLatency(null);
    const t0 = Date.now();
    try {
      const res = await adminFetch("/vectors/search", {
        method: "POST",
        body: JSON.stringify({
          index: selectedIndex,
          query,
          topK: parseInt(topK),
        }),
      });
      setLatency(Date.now() - t0);
      setResults(res.results ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSearch();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Similarity Search</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Test vector similarity search against the embedding store
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Search Query</Label>
            <Textarea
              placeholder="Enter text to find similar chunks (e.g. 'education budget allocation in Lagos')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px]"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-2 w-40">
              <Label>Index</Label>
              <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {indexes.map((idx) => (
                    <SelectItem key={idx.key} value={idx.key}>
                      {idx.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-28">
              <Label>Top K</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={topK}
                onChange={(e) => setTopK(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
            >
              {searching ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-1.5" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {searching && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">
              Embedding query and searching vector store...
            </span>
          </div>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="py-6 text-center text-destructive text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
            {latency !== null && (
              <Badge variant="outline" className="text-xs font-mono">
                {latency}ms
              </Badge>
            )}
          </div>
          {results.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No results found. Try a different query or index.
              </CardContent>
            </Card>
          )}
          {results.map((r, i) => (
            <Card key={r.id || i}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      variant="outline"
                      className="text-xs font-mono shrink-0"
                    >
                      #{i + 1}
                    </Badge>
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-mono text-muted-foreground truncate">
                      {r.file}
                    </span>
                  </div>
                  <Badge
                    variant={
                      r.score >= 0.85
                        ? "default"
                        : r.score >= 0.6
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-xs shrink-0 ml-2"
                  >
                    {(r.score * 100).toFixed(1)}% match
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {r.content || "(no text content)"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(r.metadata)
                    .filter(
                      ([, val]) =>
                        val !== null &&
                        val !== undefined &&
                        val !== "" &&
                        typeof val !== "object",
                    )
                    .map(([key, val]) => (
                      <Badge
                        key={key}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {key}: {String(val)}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
