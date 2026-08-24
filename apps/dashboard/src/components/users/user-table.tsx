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
import { Eye, Ban, CheckCircle } from "lucide-react";
import { adminFetch } from "@/lib/api";
import { relativeTime } from "@/lib/format";

export interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  telegramId: string | null;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  _count: { conversations: number };
}

export function UserTable({
  users,
  onRefresh,
}: {
  users: UserRow[];
  onRefresh?: () => void;
}) {
  async function toggleBan(user: UserRow) {
    const action = user.banned ? "unban" : "ban";
    if (!user.banned) {
      const reason = prompt("Ban reason (optional):");
      if (reason === null) return; // cancelled
      await adminFetch(`/users/${user.id}/ban`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || undefined }),
      });
    } else {
      await adminFetch(`/users/${user.id}/unban`, { method: "POST" });
    }
    onRefresh?.();
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Seen</TableHead>
            <TableHead className="text-right">Conversations</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-8"
              >
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">
                      {user.name || (
                        <span className="text-muted-foreground">Anonymous</span>
                      )}
                    </p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {user.phoneNumber ||
                    (user.telegramId ? (
                      <span className="text-muted-foreground text-xs">
                        TG:{user.telegramId}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    ))}
                </TableCell>
                <TableCell>
                  {user.banned ? (
                    <Badge variant="destructive" className="text-xs">
                      Banned
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs text-emerald-600"
                    >
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.lastSeenAt ? relativeTime(user.lastSeenAt) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="text-xs">
                    {user._count.conversations}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${user.banned ? "text-emerald-600" : "text-destructive"}`}
                      title={user.banned ? "Unban user" : "Ban user"}
                      onClick={() => toggleBan(user)}
                    >
                      {user.banned ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <Ban className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      asChild
                    >
                      <Link href={`/dashboard/users/${user.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
