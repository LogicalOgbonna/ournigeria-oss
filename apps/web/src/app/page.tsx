"use client";

import { useMemo } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function Home() {
  // Read the initial pathname once on mount to determine the conversation ID.
  // Subsequent navigation is handled in-place by useChat via pushState.
  const conversationId = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const path = window.location.pathname;
    return path !== "/" && path !== "/login" ? path.slice(1) : undefined;
  }, []);

  return <ChatContainer conversationId={conversationId} />;
}
