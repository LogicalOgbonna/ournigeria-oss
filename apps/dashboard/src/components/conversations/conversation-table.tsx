"use client";

import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Flag } from "lucide-react";

export interface ConversationRow {
  id: string;
  title: string | null;
  userId: string;
  userIdentifier: string;
  messageCount: number;
  flagged: boolean;
  createdAt: string;
  lastMessageAt: string | null;
}

export function ConversationTable({ conversations }: { conversations: ConversationRow[] }) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Messages</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No conversations found
              </TableCell>
            </TableRow>
          ) : (
            conversations.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-sm max-w-[250px]">
                  <div className="flex items-center gap-2">
                    {c.flagged && <Flag className="h-3 w-3 text-destructive shrink-0" />}
                    <span className="truncate">{c.title || "Untitled"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/users/${c.userId}`}
                    className="text-sm text-primary hover:underline font-mono"
                  >
                    {c.userIdentifier}
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="text-xs">{c.messageCount}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : "-"}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href={`/dashboard/conversations/${c.id}`}>
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
