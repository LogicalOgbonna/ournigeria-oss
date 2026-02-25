"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Message, AIResponseContent, ToolId, Language } from "@/types";
import { apiUrl } from "@/lib/api";

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

export function useChat(conversationId?: string) {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationForUI[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(conversationId ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] =
    useState(!!conversationId);
  const [streamingText, setStreamingText] = useState<string>("");
  const [statusText, setStatusText] = useState<string>("");
  const idCounter = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const generateId = () => {
    idCounter.current += 1;
    return `msg-${Date.now()}-${idCounter.current}`;
  };

  // Fetch conversation list from API
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/conversations"), {
        credentials: "include",
      });
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

  // Load the conversation when conversationId is provided
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    fetchConversations();

    if (!conversationId) return;

    async function loadInitialConversation() {
      setIsLoadingConversation(true);
      try {
        const res = await fetch(
          apiUrl(`/api/conversations/${conversationId}`),
          {
            credentials: "include",
          },
        );
        if (!res.ok) {
          router.replace("/");
          return;
        }

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
        setActiveConversationId(conversationId!);
      } catch {
        router.replace("/");
      } finally {
        setIsLoadingConversation(false);
      }
    }

    loadInitialConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    async (content: string, tool?: ToolId | null, language?: Language) => {
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
      setStatusText("");

      try {
        const res = await fetch(apiUrl("/api/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            message: content,
            conversationId: activeConversationId,
            ...(tool && { tool }),
            ...(language && language !== "en" && { language }),
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
                  if (!activeConversationId && event.conversationId) {
                    setActiveConversationId(event.conversationId);
                    // Update URL without triggering navigation so the
                    // stream isn't interrupted by a re-mount.
                    window.history.replaceState(
                      null,
                      "",
                      `/${event.conversationId}`,
                    );
                  }
                  break;

                case "text":
                  fullText += event.content;
                  setStreamingText(fullText);
                  setStatusText("");
                  break;

                case "status":
                  setStatusText(event.content ?? "");
                  break;

                case "done":
                  richContent = event.richContent;
                  setStatusText("");
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
        setStatusText("");

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
        setStatusText("");
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, fetchConversations],
  );

  // Navigate to a conversation by URL
  const loadConversation = useCallback(
    (id: string) => {
      router.push(`/${id}`);
    },
    [router],
  );

  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    router.push("/");
  }, [router]);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(apiUrl(`/api/conversations/${id}`), {
          method: "DELETE",
          credentials: "include",
        });
        fetchConversations();

        if (activeConversationId === id) {
          router.push("/");
        }
      } catch {
        // Failed to delete
      }
    },
    [activeConversationId, fetchConversations, router],
  );

  return {
    messages,
    isLoading,
    isLoadingConversation,
    streamingText,
    statusText,
    sendMessage,
    conversations,
    activeConversationId,
    startNewChat,
    loadConversation,
    deleteConversation: handleDeleteConversation,
  };
}
