"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface IngestionRecord {
  id: string;
  pipeline: string;
  filePath: string;
  status: string;
  chunks: number;
  error: string | null;
  updatedAt: string;
}

function statusVariant(status: string) {
  switch (status) {
    case "completed": return "default" as const;
    case "processing": return "secondary" as const;
    case "failed": return "destructive" as const;
    case "skipped": return "outline" as const;
    default: return "outline" as const;
  }
}

export function IngestionRecordsTable({ records }: { records: IngestionRecord[] }) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pipeline</TableHead>
            <TableHead>File Path</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Chunks</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No records found
              </TableCell>
            </TableRow>
          ) : (
            records.map((r) => {
              const fileName = r.filePath.split("/").pop() || r.filePath;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium capitalize text-sm">{r.pipeline}</TableCell>
                  <TableCell className="text-sm max-w-[300px]" title={r.filePath}>
                    <span className="truncate block">{fileName}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(r.status)} className="text-xs capitalize">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">{r.chunks.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-destructive max-w-[200px] truncate">
                    {r.error || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.updatedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
