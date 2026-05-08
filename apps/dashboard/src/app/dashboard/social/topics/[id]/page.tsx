"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { socialsFetch } from "@/lib/api";
import { TopicForm } from "@/components/socials/topic-form";
import type { SocialsTopicRow } from "@/components/socials/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditTopicPage({ params }: PageProps) {
  const { id } = use(params);
  const [topic, setTopic] = useState<SocialsTopicRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socialsFetch(`/v1/topics/${id}`)
      .then((row: SocialsTopicRow) => setTopic(row))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/social/topics"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold">
            {topic ? topic.name : "Edit topic"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Last run{" "}
            {topic?.lastRunAt
              ? new Date(topic.lastRunAt).toLocaleString()
              : "never"}
          </p>
        </div>
      </div>
      {loading || !topic ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <TopicForm initial={topic} topicId={id} />
      )}
    </div>
  );
}
