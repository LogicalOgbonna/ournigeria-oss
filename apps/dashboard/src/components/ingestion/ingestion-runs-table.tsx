"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export interface IngestionRun {
  id: string;
  pipeline: string;
  trigger: string;
  totalFiles: number;
  totalChunks: number;
  duration: number | null;
  startedAt: string;
  status: string;
}

function statusVariant(status: string) {
  switch (status) {
    case "completed": return "default" as const;
    case "running": return "secondary" as const;
    case "failed": return "destructive" as const;
    default: return "outline" as const;
  }
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function IngestionRunsTable({ runs }: { runs: IngestionRun[] }) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pipeline</TableHead>
            <TableHead>Trigger</TableHead>
            <TableHead className="text-right">Files</TableHead>
            <TableHead className="text-right">Chunks</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No ingestion runs found
              </TableCell>
            </TableRow>
          ) : (
            runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-medium capitalize">{run.pipeline}</TableCell>
                <TableCell className="text-sm text-muted-foreground capitalize">{run.trigger}</TableCell>
                <TableCell className="text-right text-sm">{run.totalFiles}</TableCell>
                <TableCell className="text-right text-sm">{run.totalChunks.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDuration(run.duration)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(run.startedAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(run.status)} className="text-xs capitalize">
                    {run.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href={`/dashboard/ingestion/${run.id}`}>
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
