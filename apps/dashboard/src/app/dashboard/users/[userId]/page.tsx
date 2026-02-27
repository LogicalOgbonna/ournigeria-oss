"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, MessageSquare, Brain, BarChart3 } from "lucide-react";
import { UserDetailTabs } from "@/components/users/user-detail-tabs";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";
import { adminFetch } from "@/lib/api";

interface UserDetail {
  id: string;
  phoneNumber: string | null;
  telegramId: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  preferences: Record<string, unknown>;
  _count: {
    conversations: number;
    memories: number;
    queryAnalytics: number;
  };
}

const placeholderUser: UserDetail = {
  id: "user-1",
  phoneNumber: "+2348012345678",
  telegramId: "tg_user_1",
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  lastSeenAt: new Date(Date.now() - 3600000).toISOString(),
  preferences: {},
  _count: { conversations: 15, memories: 8, queryAnalytics: 42 },
};

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch(`/users/${userId}`)
      .then(setUser)
      .catch(() => setUser(placeholderUser))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!user) return null;

  const identifier = user.phoneNumber || user.telegramId || user.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold">{identifier}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
        <DeleteUserDialog userId={user.id} identifier={identifier} />
      </div>

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

      {user.telegramId && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          <span>Telegram: </span>
          <Badge variant="outline" className="font-mono text-xs">{user.telegramId}</Badge>
        </div>
      )}

      <UserDetailTabs userId={userId} />
    </div>
  );
}
