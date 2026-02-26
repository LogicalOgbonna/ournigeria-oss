"use client";

import { use } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  return <ChatContainer conversationId={conversationId} />;
}
