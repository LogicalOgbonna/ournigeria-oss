"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopicForm } from "@/components/socials/topic-form";

export default function NewTopicPage() {
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
          <h1 className="text-2xl font-heading font-bold">New topic</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Topic stays disabled until you flip the toggle.
          </p>
        </div>
      </div>
      <TopicForm />
    </div>
  );
}
