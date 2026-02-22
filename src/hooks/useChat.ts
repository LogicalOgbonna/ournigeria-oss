"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Message, AIResponseContent } from "@/types";

interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
  lastMessageRole: string | null;
  messageCount: number;
}

// Shape the sidebar expects
export interface ConversationForUI {
  id: string;
  title: string;
  lastMessage: string | null;
  lastMessageRole: string | null;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function useChat() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationForUI[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string>("");
  const idCounter = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const generateId = () => {
    idCounter.current += 1;
    return `msg-${Date.now()}-${idCounter.current}`;
  };

  // Sync activeConversationId to the URL query param `c`
  const setConversationUrl = useCallback(
    (id: string | null) => {
      if (id) {
        router.replace(`?c=${id}`, { scroll: false });
      } else {
        router.replace("/", { scroll: false });
      }
    },
    [router],
  );

  // Fetch conversation list from API
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data: ConversationSummary[] = await res.json();

      setConversations(
        data.map((c) => ({
          id: c.id,
          title: c.title,
          lastMessage: c.lastMessage,
          lastMessageRole: c.lastMessageRole,
          messageCount: c.messageCount,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })),
      );
    } catch {
      // Silently fail — sidebar just shows empty
    }
  }, []);

  // Load a conversation's full messages from the API
  const loadConversation = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/conversations/${id}`);
        if (!res.ok) return;

        const data = await res.json();

        const msgs: Message[] = data.messages.map(
          (m: {
            id: string;
            role: "user" | "assistant";
            content: string;
            richContent?: AIResponseContent;
            createdAt: string;
          }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            richContent: m.richContent ?? undefined,
            timestamp: new Date(m.createdAt),
          }),
        );

        setMessages(msgs);
        setActiveConversationId(id);
        setConversationUrl(id);
        setStreamingText("");
      } catch {
        // Failed to load — stay on current state
      }
    },
    [setConversationUrl],
  );

  // Initialize: create user, fetch conversations, and resume from URL if present
  const userInitialized = useRef(false);
  useEffect(() => {
    async function init() {
      if (userInitialized.current) return;
      userInitialized.current = true;

      // Ensure user exists (creates if needed, sets cookie)
      try {
        await fetch("/api/user", { method: "POST" });
      } catch {
        // Non-fatal
      }

      await fetchConversations();

      // Resume conversation from URL query param
      const urlConvId = searchParams.get("c");
      if (urlConvId) {
        loadConversation(urlConvId);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      // Abort any in-flight stream
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingText("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            conversationId: activeConversationId,
          }),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Chat request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let richContent: AIResponseContent | null = null;
        let newConvId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              switch (event.type) {
                case "meta":
                  newConvId = event.conversationId;
                  if (!activeConversationId) {
                    setActiveConversationId(newConvId);
                    setConversationUrl(newConvId);
                  }
                  break;

                case "text":
                  fullText += event.content;
                  setStreamingText(fullText);
                  break;

                case "status":
                  break;

                case "done":
                  richContent = event.richContent;
                  break;

                case "error":
                  throw new Error(event.content);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        // Finalize the assistant message
        const assistantMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: richContent?.text ?? fullText,
          richContent: richContent ?? undefined,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingText("");

        // Refresh conversation list
        fetchConversations();
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        const errorMessage: Message = {
          id: generateId(),
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setStreamingText("");
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, fetchConversations, setConversationUrl],
  );

  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setActiveConversationId(null);
    setStreamingText("");
    setIsLoading(false);
    setConversationUrl(null);
  }, [setConversationUrl]);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/conversations/${id}`, { method: "DELETE" });
        fetchConversations();

        if (activeConversationId === id) {
          setMessages([]);
          setActiveConversationId(null);
          setConversationUrl(null);
        }
      } catch {
        // Failed to delete
      }
    },
    [activeConversationId, fetchConversations, setConversationUrl],
  );

  return {
    messages,
    isLoading,
    streamingText,
    sendMessage,
    conversations,
    activeConversationId,
    startNewChat,
    loadConversation,
    deleteConversation: handleDeleteConversation,
  };
}
