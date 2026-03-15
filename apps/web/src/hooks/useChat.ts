"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Message,
  AIResponseContent,
  ThinkingStep,
  ToolId,
  Language,
} from "@/types";
import { apiUrl } from "@/lib/api";
import { redirectToLogin } from "@/lib/auth-redirect";

interface ConversationSummary {
  id: string;
  title: string;
  visibility: "private" | "public";
  slug: string | null;
  source: string;
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
  visibility: "private" | "public";
  slug: string | null;
  source: string;
  lastMessage: string | null;
  lastMessageRole: string | null;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function useChat(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationForUI[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(conversationId ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] =
    useState(!!conversationId);
  const [streamingText, setStreamingText] = useState<string>("");
  const [statusText, setStatusText] = useState<string>("");
  const [isLimitReached, setIsLimitReached] = useState(false);
  const idCounter = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const generateId = () => {
    idCounter.current += 1;
    return `msg-${Date.now()}-${idCounter.current}`;
  };

  // Fetch conversation list from API
  const fetchConversations = useCallback(async () => {
    try {
      setLoadError(false);
      const res = await fetch(apiUrl("/api/conversations"), {
        credentials: "include",
      });
      if (res.status === 401) {
        setIsCheckingAuth(false);
        redirectToLogin();
        return;
      }
      if (res.status === 403) {
        try {
          const body = await res.json();
          if (body.error === "banned") {
            sessionStorage.setItem("ban_reason", body.reason || "");
            window.location.replace("/banned");
            return;
          }
        } catch {}
      }
      if (!res.ok) {
        setLoadError(true);
        setIsCheckingAuth(false);
        return;
      }
      const data: ConversationSummary[] = await res.json();

      setConversations(
        data.map((c) => ({
          id: c.id,
          title: c.title,
          visibility: c.visibility ?? "private",
          slug: c.slug ?? null,
          source: c.source ?? "web",
          lastMessage: c.lastMessage,
          lastMessageRole: c.lastMessageRole,
          messageCount: c.messageCount,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })),
      );
      setIsCheckingAuth(false);
    } catch {
      setLoadError(true);
      setIsCheckingAuth(false);
    }
  }, []);

  // Fetch and display a conversation in-place (no navigation)
  const fetchAndShowConversation = useCallback(async (id: string) => {
    abortRef.current?.abort();
    setIsLoadingConversation(true);
    setStreamingText("");
    setStatusText("");

    try {
      const res = await fetch(apiUrl(`/api/conversations/${id}`), {
        credentials: "include",
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) {
        setMessages([]);
        setActiveConversationId(null);
        window.history.replaceState(null, "", "/");
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
      setActiveConversationId(id);
    } catch {
      setMessages([]);
      setActiveConversationId(null);
      window.history.replaceState(null, "", "/");
    } finally {
      setIsLoadingConversation(false);
    }
  }, []);

  // Load initial conversation on mount
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    fetchConversations();

    if (conversationId) {
      fetchAndShowConversation(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const id = path !== "/" && path !== "/login" ? path.slice(1) : null;

      if (id) {
        fetchAndShowConversation(id);
      } else {
        abortRef.current?.abort();
        setMessages([]);
        setActiveConversationId(null);
        setStreamingText("");
        setStatusText("");
        setIsLoadingConversation(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [fetchAndShowConversation]);

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

        if (res.status === 401) {
          redirectToLogin();
          return;
        }
        if (res.status === 403) {
          try {
            const body = await res.json();
            if (body.error === "banned") {
              sessionStorage.setItem("ban_reason", body.reason || "");
              window.location.replace("/banned");
              return;
            }
          } catch {}
        }
        if (res.status === 429) {
          setIsLimitReached(true);
          // Remove the "user" message we just optimistically added so they can try again later
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        if (!res.ok || !res.body) {
          throw new Error("Chat request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let richContent: AIResponseContent | null = null;
        let thinkingSteps: ThinkingStep[] = [];
        let currentConversationId = activeConversationId;

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
                    currentConversationId = event.conversationId;
                    setActiveConversationId(event.conversationId);
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
                  thinkingSteps = event.thinking ?? [];
                  setStatusText("");
                  break;

                case "error": {
                  // Server sent an explicit error — display it as the assistant message
                  const errorText =
                    event.content || "Something went wrong. Please try again.";
                  const serverErrorMessage: Message = {
                    id: generateId(),
                    role: "assistant",
                    content: errorText,
                    timestamp: new Date(),
                    isError: true,
                    retryable: event.retryable === true,
                  };
                  setMessages((prev) => [...prev, serverErrorMessage]);
                  setStreamingText("");
                  setStatusText("");
                  setIsLoading(false);
                  return;
                }
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
          thinking: thinkingSteps.length > 0 ? thinkingSteps : undefined,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingText("");
        setStatusText("");

        // Optimistic conversation list update (no network call)
        setConversations((prev) => {
          const msgPreview =
            richContent?.text?.slice(0, 100) ?? fullText.slice(0, 100);
          const existingIdx = prev.findIndex(
            (c) => c.id === currentConversationId,
          );

          if (existingIdx >= 0) {
            // Existing conversation — update and move to top
            const updated = {
              ...prev[existingIdx],
              lastMessage: msgPreview,
              lastMessageRole: "assistant" as const,
              messageCount: prev[existingIdx].messageCount + 1,
              updatedAt: new Date(),
            };
            return [updated, ...prev.filter((_, i) => i !== existingIdx)];
          }

          // New conversation — prepend
          const newConv: ConversationForUI = {
            id: currentConversationId!,
            title: content.slice(0, 60),
            visibility: "private",
            slug: null,
            source: "web",
            lastMessage: msgPreview,
            lastMessageRole: "assistant",
            messageCount: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return [newConv, ...prev];
        });
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
    [activeConversationId],
  );

  // Navigate to a conversation without full page reload
  const loadConversation = useCallback(
    (id: string) => {
      window.history.pushState(null, "", `/${id}`);
      fetchAndShowConversation(id);
    },
    [fetchAndShowConversation],
  );

  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setActiveConversationId(null);
    setStreamingText("");
    setStatusText("");
    setIsLoadingConversation(false);
    window.history.pushState(null, "", "/");
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(apiUrl(`/api/conversations/${id}`), {
          method: "DELETE",
          credentials: "include",
        });
        fetchConversations();

        if (activeConversationId === id) {
          setMessages([]);
          setActiveConversationId(null);
          setStreamingText("");
          setStatusText("");
          window.history.pushState(null, "", "/");
        }
      } catch {
        // Failed to delete
      }
    },
    [activeConversationId, fetchConversations],
  );

  const updateConversationLocally = useCallback(
    (
      id: string,
      updates: Partial<Pick<ConversationForUI, "visibility" | "slug">>,
    ) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    },
    [],
  );

  return {
    messages,
    isLoading,
    isCheckingAuth,
    isLoadingConversation,
    loadError,
    streamingText,
    statusText,
    sendMessage,
    conversations,
    activeConversationId,
    startNewChat,
    loadConversation,
    deleteConversation: handleDeleteConversation,
    updateConversationLocally,
    retryLoad: fetchConversations,
    isLimitReached,
    setIsLimitReached,
  };
}
