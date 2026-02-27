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

export interface UserRow {
  id: string;
  phoneNumber: string | null;
  telegramId: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  _count: { conversations: number };
}

export function UserTable({ users }: { users: UserRow[] }) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phone</TableHead>
            <TableHead>Telegram ID</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Seen</TableHead>
            <TableHead className="text-right">Conversations</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-sm">
                  {user.phoneNumber || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {user.telegramId || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.lastSeenAt
                    ? new Date(user.lastSeenAt).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="text-xs">
                    {user._count.conversations}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href={`/dashboard/users/${user.id}`}>
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
