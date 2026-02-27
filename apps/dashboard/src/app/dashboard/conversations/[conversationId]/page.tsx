"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User } from "lucide-react";
import { MessageThread, type ChatMessage } from "@/components/conversations/message-thread";
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

const placeholderConversation: ConversationDetail = {
  id: "conv-1",
  title: "What is Lagos state budget for education?",
  userId: "user-1",
  userIdentifier: "+2348012345678",
  flagged: false,
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  messages: [
    {
      id: "msg-1",
      role: "user",
      content: "What is Lagos state budget for education in 2025?",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "msg-2",
      role: "assistant",
      content:
        "Based on the 2025 Lagos State budget, the allocation for education is approximately N215.8 billion. This represents about 15.2% of the total state budget.\n\nKey allocations include:\n- Basic Education: N82.3 billion\n- Secondary Education: N65.1 billion\n- Tertiary Education: N45.2 billion\n- SUBEB Fund: N23.2 billion\n\nThis is a 12% increase from the 2024 education budget of N192.7 billion.",
      createdAt: new Date(Date.now() - 3500000).toISOString(),
      sources: [
        { title: "Lagos 2025 Approved Budget - Education Sector", filePath: "budgets/lagos/2025-approved.pdf", score: 0.94 },
        { title: "Lagos 2024 Budget Performance Report", filePath: "budgets/lagos/2024-performance.pdf", score: 0.82 },
      ],
    },
    {
      id: "msg-3",
      role: "user",
      content: "How does that compare to Kano state?",
      createdAt: new Date(Date.now() - 3000000).toISOString(),
    },
    {
      id: "msg-4",
      role: "assistant",
      content:
        "Kano State allocated approximately N98.4 billion to education in 2025, which represents about 18.6% of its total budget.\n\nWhile Lagos spends more in absolute terms (N215.8B vs N98.4B), Kano actually allocates a higher percentage of its budget to education (18.6% vs 15.2%).\n\nKey differences:\n- Lagos focuses more on tertiary education infrastructure\n- Kano has higher per-student spending on basic education\n- Both states increased education budgets from 2024",
      createdAt: new Date(Date.now() - 2800000).toISOString(),
      sources: [
        { title: "Kano 2025 Approved Budget", filePath: "budgets/kano/2025-approved.pdf", score: 0.91 },
        { title: "Lagos 2025 Approved Budget - Education Sector", filePath: "budgets/lagos/2025-approved.pdf", score: 0.87 },
      ],
    },
  ],
};

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch(`/conversations/${conversationId}`)
      .then(setConversation)
      .catch(() => setConversation({ ...placeholderConversation, id: conversationId }))
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

  if (!conversation) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/dashboard/conversations"><ArrowLeft className="h-4 w-4" /></Link>
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
          setConversation((c) => c ? { ...c, flagged: !c.flagged } : c);
          adminFetch(`/conversations/${conversationId}/flag`, {
            method: "POST",
            body: JSON.stringify({ flagged: !conversation.flagged }),
          }).catch(() => {});
        }}
      />
    </div>
  );
}
