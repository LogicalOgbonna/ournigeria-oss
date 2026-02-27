"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Rocket, Loader2, X } from "lucide-react";
import { ingestFetch } from "@/lib/api";

export function NewRunForm({
  selectedFiles,
  onRemoveFile,
}: {
  selectedFiles: string[];
  onRemoveFile: (key: string) => void;
}) {
  const [pipeline, setPipeline] = useState("budget");
  const [concurrency, setConcurrency] = useState("5");
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  async function handleStart() {
    setStarting(true);
    try {
      const res = await ingestFetch("/run", {
        method: "POST",
        body: JSON.stringify({
          pipeline,
          concurrency: parseInt(concurrency),
          files: selectedFiles,
        }),
      });
      router.push(`/dashboard/ingestion/${res.runId || res.id}`);
    } catch {
      setStarting(false);
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Run Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Pipeline</Label>
          <Select value={pipeline} onValueChange={setPipeline}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="corruption">Corruption</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Concurrency</Label>
          <Input
            type="number"
            min="1"
            max="20"
            value={concurrency}
            onChange={(e) => setConcurrency(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Selected Files ({selectedFiles.length})</Label>
          {selectedFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Select files from the S3 browser on the left
            </p>
          ) : (
            <div className="max-h-[200px] overflow-y-auto space-y-1 custom-scrollbar">
              {selectedFiles.map((f) => {
                const name = f.split("/").pop() || f;
                return (
                  <div
                    key={f}
                    className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded"
                  >
                    <span className="truncate flex-1">{name}</span>
                    <button
                      onClick={() => onRemoveFile(f)}
                      className="shrink-0 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Button
          className="w-full"
          onClick={handleStart}
          disabled={starting || selectedFiles.length === 0}
        >
          {starting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-1.5" />
              Start Run
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
