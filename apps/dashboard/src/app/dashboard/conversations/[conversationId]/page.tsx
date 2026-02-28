"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User } from "lucide-react";
import {
  MessageThread,
  type ChatMessage,
} from "@/components/conversations/message-thread";
import { ExportButton } from "@/components/conversations/export-button";
import { adminFetch } from "@/lib/api";

interface ConversationDetail {
  id: string;
  title: string | null;
  userId: string;
  userIdentifier: string;
  flagged: boolean;
  createdAt: string;
  messages: ChatMessage[];
}

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch(`/conversations/${conversationId}`)
      .then(setConversation)
      .catch(() => setConversation(null))
      .finally(() => setLoading(false));
  }, [conversationId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Conversation not found</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/dashboard/conversations">Back to conversations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/dashboard/conversations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold truncate max-w-xl">
            {conversation.title || "Untitled conversation"}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <Link
              href={`/dashboard/users/${conversation.userId}`}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <User className="h-3 w-3" />
              {conversation.userIdentifier}
            </Link>
            <span className="text-xs text-muted-foreground">
              {new Date(conversation.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        <ExportButton
          conversationId={conversation.id}
          title={conversation.title || "Untitled"}
          messages={conversation.messages}
        />
      </div>

      <MessageThread
        messages={conversation.messages}
        flagged={conversation.flagged}
        onToggleFlag={() => {
          setConversation((c) => (c ? { ...c, flagged: !c.flagged } : c));
          adminFetch(`/conversations/${conversationId}/flag`, {
            method: "POST",
            body: JSON.stringify({ flagged: !conversation.flagged }),
          }).catch(() => {});
        }}
      />
    </div>
  );
}
