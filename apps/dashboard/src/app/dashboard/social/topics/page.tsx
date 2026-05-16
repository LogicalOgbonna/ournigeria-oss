"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { socialsFetch } from "@/lib/api";
import type { SocialsTopicRow } from "@/components/socials/types";
import { Plus, ArrowLeft } from "lucide-react";

export default function TopicsListPage() {
  const [topics, setTopics] = useState<SocialsTopicRow[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    socialsFetch("/v1/topics")
      .then((rows: SocialsTopicRow[]) => setTopics(rows))
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function toggleEnabled(id: string, enabled: boolean) {
    await socialsFetch(`/v1/topics/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
    reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/social"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold">Topics</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Roamer queries the X SearchTimeline for each enabled topic and
              classifies tweets against its profile.
            </p>
          </div>
        </div>
        <Link href="/dashboard/social/topics/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> New topic
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : topics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No topics yet.</p>
            <Link href="/dashboard/social/topics/new">
              <Button className="mt-4">Create the first one</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topics.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/dashboard/social/topics/${t.id}`}>
                        <h2 className="font-semibold hover:underline">
                          {t.name}
                        </h2>
                      </Link>
                      <Badge variant="secondary">{t.domain}</Badge>
                      {t.enabled ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline">disabled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl">
                      {t.description}
                    </p>
                    <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded block max-w-2xl truncate">
                      {t.query}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={t.enabled ? "outline" : "default"}
                      onClick={() => toggleEnabled(t.id, !t.enabled)}
                    >
                      {t.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Link href={`/dashboard/social/topics/${t.id}`}>
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    threshold <b className="text-foreground">{t.threshold}</b>
                  </span>
                  <span>
                    followers{" "}
                    <b className="text-foreground">
                      {t.minFollowers.toLocaleString()}–
                      {t.maxFollowers.toLocaleString()}
                    </b>
                  </span>
                  <span>
                    lang <b className="text-foreground">{t.lang}</b>
                  </span>
                  <span>
                    max age <b className="text-foreground">{t.maxAgeHours}h</b>
                  </span>
                  <span>
                    last run{" "}
                    <b className="text-foreground">
                      {t.lastRunAt
                        ? new Date(t.lastRunAt).toLocaleString()
                        : "never"}
                    </b>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
