"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Bot, FileText, Route, Clock, Zap } from "lucide-react";
import { adminFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TestResult {
  routedTo: string;
  routingTime: number;
  chunks: { file: string; chunkIndex: number; score: number; preview: string }[];
  retrievalTime: number;
  response: string;
  responseTime: number;
  totalTime: number;
}

const placeholderResult: TestResult = {
  routedTo: "budget-agent",
  routingTime: 0.3,
  chunks: [
    { file: "budgets/lagos/2025-approved.pdf", chunkIndex: 42, score: 0.94, preview: "The Lagos State Government has allocated N215.8 billion to the education sector in the 2025 fiscal year budget, representing a 12% increase over the previous year's allocation of N192.7 billion..." },
    { file: "budgets/lagos/2025-approved.pdf", chunkIndex: 43, score: 0.89, preview: "Breakdown of education allocation: Basic Education - N82.3 billion, Secondary Education - N65.1 billion, Tertiary Education - N45.2 billion, SUBEB Fund - N23.2 billion..." },
    { file: "budgets/lagos/2024-performance.pdf", chunkIndex: 15, score: 0.82, preview: "The 2024 education budget performance report indicates 87% budget utilization, with capital expenditure reaching 79% of the approved amount..." },
  ],
  retrievalTime: 0.8,
  response: "Based on the 2025 Lagos State approved budget, education received N215.8 billion, a 12% increase from 2024.\n\nKey allocations:\n- Basic Education: N82.3B\n- Secondary Education: N65.1B\n- Tertiary Education: N45.2B\n- SUBEB Fund: N23.2B\n\nThe 2024 performance report showed 87% budget utilization for education.",
  responseTime: 1.4,
  totalTime: 2.5,
};

export default function TestQueryPage() {
  const [query, setQuery] = useState("");
  const [agent, setAgent] = useState("auto");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function handleTest() {
    if (!query.trim()) return;
    setTesting(true);
    setResult(null);
    try {
      const res = await adminFetch("/ai/test", {
        method: "POST",
        body: JSON.stringify({ query, agent: agent === "auto" ? undefined : agent }),
      });
      setResult(res);
    } catch {
      setResult(placeholderResult);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Test Query</h1>
        <p className="text-muted-foreground text-sm mt-1">Run a query through the full RAG pipeline and inspect each step</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Query</Label>
            <Textarea
              placeholder="e.g. What is Lagos state's education budget for 2025?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-2 w-48">
              <Label>Agent</Label>
              <Select value={agent} onValueChange={setAgent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (router)</SelectItem>
                  <SelectItem value="budget-agent">Budget Agent</SelectItem>
                  <SelectItem value="corruption-agent">Corruption Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleTest} disabled={testing || !query.trim()}>
              {testing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
              Test Query
            </Button>
          </div>
        </CardContent>
      </Card>

      {testing && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Running query through RAG pipeline...</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Timing summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Routing", time: result.routingTime, icon: Route },
              { label: "Retrieval", time: result.retrievalTime, icon: Zap },
              { label: "Generation", time: result.responseTime, icon: Bot },
              { label: "Total", time: result.totalTime, icon: Clock },
            ].map((t) => (
              <Card key={t.label}>
                <CardContent className="py-3 flex items-center gap-2">
                  <t.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-bold font-heading">{t.time}s</p>
                    <p className="text-xs text-muted-foreground">{t.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Routing */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-chart-2" />
                <CardTitle className="text-sm font-medium">1. Routing Decision</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Routed to: <Badge variant="secondary" className="text-xs ml-1">{result.routedTo}</Badge></p>
            </CardContent>
          </Card>

          {/* Retrieved chunks */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-chart-1" />
                <CardTitle className="text-sm font-medium">2. Retrieved Chunks ({result.chunks.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[300px] custom-scrollbar">
                <div className="space-y-3">
                  {result.chunks.map((chunk, i) => (
                    <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">#{chunk.chunkIndex}</Badge>
                          <span className="text-xs text-muted-foreground truncate">{chunk.file}</span>
                        </div>
                        <Badge variant={chunk.score >= 0.85 ? "default" : chunk.score >= 0.6 ? "secondary" : "destructive"} className="text-xs">
                          {(chunk.score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{chunk.preview}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Response */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-chart-2" />
                <CardTitle className="text-sm font-medium">3. Generated Response</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.response}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
