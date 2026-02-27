"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, FileText } from "lucide-react";
import { adminFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  file: string;
  chunkIndex: number;
  score: number;
  content: string;
  metadata: Record<string, string>;
}

const placeholderResults: SearchResult[] = [
  {
    id: "chunk-1",
    file: "budgets/lagos/2025-approved.pdf",
    chunkIndex: 42,
    score: 0.94,
    content: "The Lagos State Government has allocated N215.8 billion to the education sector in the 2025 fiscal year budget, representing a 12% increase over the previous year's allocation of N192.7 billion. The allocation covers Basic Education (N82.3 billion), Secondary Education (N65.1 billion), Tertiary Education (N45.2 billion), and SUBEB Fund (N23.2 billion).",
    metadata: { state: "Lagos", year: "2025", sector: "Education" },
  },
  {
    id: "chunk-2",
    file: "budgets/lagos/2025-approved.pdf",
    chunkIndex: 43,
    score: 0.89,
    content: "The education sector capital expenditure includes construction of 15 new primary schools, renovation of 42 secondary schools, and equipment procurement for 8 tertiary institutions. Teacher recruitment budget stands at N12.4 billion for 5,000 new positions across all levels.",
    metadata: { state: "Lagos", year: "2025", sector: "Education" },
  },
  {
    id: "chunk-3",
    file: "budgets/kano/2025-approved.pdf",
    chunkIndex: 28,
    score: 0.76,
    content: "Kano State education budget for 2025 stands at N98.4 billion, representing 18.6% of the total state budget. This is the highest percentage allocation to education among northern states. Key priorities include girl-child education programs and nomadic education support.",
    metadata: { state: "Kano", year: "2025", sector: "Education" },
  },
  {
    id: "chunk-4",
    file: "budgets/ogun/2025-education.docx",
    chunkIndex: 7,
    score: 0.71,
    content: "Ogun State has prioritized technical and vocational education in its 2025 budget, allocating N45.2 billion to the sector. The Gateway State aims to establish 6 new technical colleges and upgrade 12 existing vocational training centers.",
    metadata: { state: "Ogun", year: "2025", sector: "Education" },
  },
  {
    id: "chunk-5",
    file: "budgets/federal/2025-education.xlsx",
    chunkIndex: 112,
    score: 0.65,
    content: "Federal allocation to Universal Basic Education Commission (UBEC) for 2025 stands at N170 billion, a 15% increase from 2024. States matching grants released: Lagos (100%), Kano (85%), Rivers (92%), Ogun (78%). 12 states have not accessed their 2024 UBEC matching grants.",
    metadata: { state: "Federal", year: "2025", sector: "Education" },
  },
];

export default function SimilaritySearchPage() {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState("5");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await adminFetch("/vectors/search", {
        method: "POST",
        body: JSON.stringify({ query, topK: parseInt(topK) }),
      });
      setResults(res.results ?? res);
    } catch {
      setResults(placeholderResults.slice(0, parseInt(topK)));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Similarity Search</h1>
        <p className="text-muted-foreground text-sm mt-1">Test vector similarity search against the embedding store</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Search Query</Label>
            <Textarea
              placeholder="Enter text to find similar chunks (e.g. 'education budget allocation in Lagos')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-2 w-32">
              <Label>Top K Results</Label>
              <Input type="number" min="1" max="50" value={topK} onChange={(e) => setTopK(e.target.value)} />
            </div>
            <Button onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {searching && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Searching vector store...</span>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-3 animate-fade-in-up">
          <p className="text-sm text-muted-foreground">{results.length} results found</p>
          {results.map((r, i) => (
            <Card key={r.id} className={cn("opacity-0 animate-fade-in-up", `stagger-${Math.min(i + 1, 4)}`)}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">#{i + 1}</Badge>
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-mono text-muted-foreground">{r.file}</span>
                    <Badge variant="secondary" className="text-xs">chunk {r.chunkIndex}</Badge>
                  </div>
                  <Badge variant={r.score >= 0.85 ? "default" : r.score >= 0.6 ? "secondary" : "destructive"} className="text-xs">
                    {(r.score * 100).toFixed(1)}% match
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed">{r.content}</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(r.metadata).map(([key, val]) => (
                    <Badge key={key} variant="outline" className="text-[10px]">
                      {key}: {val}
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
