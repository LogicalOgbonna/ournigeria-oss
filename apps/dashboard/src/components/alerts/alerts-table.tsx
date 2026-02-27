"use client";

import {
  AlertCircle,
  Megaphone,
  Info,
  AlertTriangle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface AlertRow {
  id: string;
  type: "incident" | "announcement" | "info" | "warning";
  title: string;
  message: string;
  status: "active" | "scheduled" | "expired" | "sent";
  dismissible?: boolean;
  createdAt: string;
  expiresAt?: string;
}

const typeConfig: Record<
  AlertRow["type"],
  { icon: typeof Info; variant: "destructive" | "default" | "secondary" | "outline" }
> = {
  incident: { icon: AlertCircle, variant: "destructive" },
  announcement: { icon: Megaphone, variant: "default" },
  info: { icon: Info, variant: "secondary" },
  warning: { icon: AlertTriangle, variant: "outline" },
};

const statusColors: Record<AlertRow["status"], string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  expired: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AlertsTable({ rows }: { rows: AlertRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[140px]">Type</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="hidden md:table-cell">Message</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead className="w-[110px]">Created</TableHead>
          <TableHead className="w-[110px] hidden lg:table-cell">Expires</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const { icon: Icon, variant } = typeConfig[row.type];
          return (
            <TableRow key={row.id}>
              <TableCell>
                <Badge variant={variant} className="gap-1">
                  <Icon className="h-3 w-3" />
                  {row.type}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{row.title}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">
                {row.message}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[row.status]}`}
                >
                  {row.status}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(row.createdAt)}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {row.expiresAt ? formatDate(row.expiresAt) : "—"}
              </TableCell>
            </TableRow>
          );
        })}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No alerts found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
