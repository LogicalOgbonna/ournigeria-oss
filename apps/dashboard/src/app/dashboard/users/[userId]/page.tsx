"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Phone, Mail, MessageSquare, Brain, BarChart3, Ban, CheckCircle } from "lucide-react";
import { UserDetailTabs } from "@/components/users/user-detail-tabs";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";
import { adminFetch } from "@/lib/api";

interface UserDetail {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  telegramId: string | null;
  banned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  preferences: Record<string, unknown>;
  _count: {
    conversations: number;
    memories: number;
    queryAnalytics: number;
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banning, setBanning] = useState(false);

  const fetchUser = useCallback(() => {
    adminFetch(`/users/${userId}`)
      .then(setUser)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function handleBan() {
    setBanning(true);
    try {
      await adminFetch(`/users/${userId}/ban`, {
        method: "POST",
        body: JSON.stringify({ reason: banReason || undefined }),
      });
      setBanOpen(false);
      setBanReason("");
      fetchUser();
    } finally {
      setBanning(false);
    }
  }

  async function handleUnban() {
    await adminFetch(`/users/${userId}/unban`, { method: "POST" });
    fetchUser();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Users
          </Link>
        </Button>
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const identifier = user.name || user.phoneNumber || user.telegramId || user.id.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold">{identifier}</h1>
            {user.banned && (
              <Badge variant="destructive" className="text-xs">Banned</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Joined {new Date(user.createdAt).toLocaleDateString()}
            {user.lastSeenAt && (
              <> &middot; Last seen {new Date(user.lastSeenAt).toLocaleDateString()}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user.banned ? (
            <Button variant="outline" size="sm" onClick={handleUnban}>
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Unban
            </Button>
          ) : (
            <Dialog open={banOpen} onOpenChange={setBanOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Ban className="h-3.5 w-3.5 mr-1.5" />
                  Ban User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ban User</DialogTitle>
                  <DialogDescription>
                    Ban <strong>{identifier}</strong> from using the platform.
                    They will see a suspension notice when they try to access the app.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label>Reason (optional)</Label>
                  <Input
                    placeholder="e.g. Abusive behavior, spam, etc."
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBanOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleBan} disabled={banning}>
                    {banning ? "Banning..." : "Ban User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <DeleteUserDialog userId={user.id} identifier={identifier} />
        </div>
      </div>

      {user.banned && user.banReason && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">
            <strong>Ban reason:</strong> {user.banReason}
          </p>
          {user.bannedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Banned on {new Date(user.bannedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-1/10">
              <MessageSquare className="h-4 w-4 text-chart-1" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading">{user._count.conversations}</p>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-2/10">
              <Brain className="h-4 w-4 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading">{user._count.memories}</p>
              <p className="text-xs text-muted-foreground">Memories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-3/10">
              <BarChart3 className="h-4 w-4 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold font-heading">{user._count.queryAnalytics}</p>
              <p className="text-xs text-muted-foreground">Queries</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {user.phoneNumber && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            <Badge variant="outline" className="font-mono text-xs">{user.phoneNumber}</Badge>
          </div>
        )}
        {user.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            <Badge variant="outline" className="text-xs">{user.email}</Badge>
          </div>
        )}
        {user.telegramId && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">TG</span>
            <Badge variant="outline" className="font-mono text-xs">{user.telegramId}</Badge>
          </div>
        )}
      </div>

      <UserDetailTabs userId={userId} />
    </div>
  );
}
