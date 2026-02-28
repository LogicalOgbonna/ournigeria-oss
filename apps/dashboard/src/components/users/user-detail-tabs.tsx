"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Loader2, ChevronRight } from "lucide-react";
import { adminFetch } from "@/lib/api";
import Link from "next/link";

interface UserDetailTabsProps {
  userId: string;
}

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  _count: { messages: number };
}

interface Memory {
  id: string;
  content: string;
  createdAt: string;
}

interface Analytics {
  id: string;
  query: string;
  category: string | null;
  createdAt: string;
}

export function UserDetailTabs({ userId }: UserDetailTabsProps) {
  const [conversations, setConversations] = useState<Conversation[] | null>(
    null,
  );
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [analytics, setAnalytics] = useState<Analytics[] | null>(null);
  const [preferences, setPreferences] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("conversations");

  useEffect(() => {
    if (activeTab === "conversations" && !conversations) {
      adminFetch(`/users/${userId}/conversations`)
        .then((res) => setConversations(res.data ?? res))
        .catch(() => setConversations([]));
    }
    if (activeTab === "memories" && !memories) {
      adminFetch(`/users/${userId}/memories`)
        .then((res) => setMemories(res.data ?? res))
        .catch(() => setMemories([]));
    }
    if (activeTab === "analytics" && !analytics) {
      adminFetch(`/users/${userId}/analytics`)
        .then((res) => setAnalytics(res.data ?? res))
        .catch(() => setAnalytics([]));
    }
    if (activeTab === "preferences" && !preferences) {
      adminFetch(`/users/${userId}`)
        .then((res) =>
          setPreferences(JSON.stringify(res.preferences ?? {}, null, 2)),
        )
        .catch(() => setPreferences("{}"));
    }
  }, [activeTab, userId, conversations, memories, analytics, preferences]);

  async function savePreferences() {
    setSaving(true);
    try {
      const parsed = JSON.parse(preferences);
      await adminFetch(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ preferences: parsed }),
      });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="conversations">Conversations</TabsTrigger>
        <TabsTrigger value="memories">Memories</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
      </TabsList>

      <TabsContent value="conversations" className="mt-4">
        {!conversations ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No conversations
          </p>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => (
              <Link key={c.id} href={`/dashboard/conversations/${c.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-3 px-4">
                    <div>
                      <p className="text-sm font-medium">
                        {c.title || "Untitled conversation"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {c._count.messages} messages
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="memories" className="mt-4">
        {!memories ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : memories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No memories
          </p>
        ) : (
          <div className="space-y-2">
            {memories.map((m) => (
              <Card key={m.id}>
                <CardContent className="py-3 px-4">
                  <p className="text-sm">{m.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="analytics" className="mt-4">
        {!analytics ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : analytics.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No analytics data
          </p>
        ) : (
          <div className="space-y-2">
            {analytics.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div>
                    <p className="text-sm">{a.query}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {a.category && (
                    <Badge variant="outline" className="text-xs">
                      {a.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="preferences" className="mt-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              User Preferences (JSON)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              className="font-mono text-sm min-h-[200px]"
            />
            <Button size="sm" onClick={savePreferences} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
