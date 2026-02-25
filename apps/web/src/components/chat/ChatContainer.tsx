"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { WelcomeHero } from "./WelcomeHero";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatSidebar } from "./ChatSidebar";
import { Sparkles, RotateCcw, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Markdown } from "./Markdown";

function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="animate-fade-in-up flex items-start gap-3 px-4 py-3">
      <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 md:flex">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 max-w-full md:max-w-[85%]">
        <div className="rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          <Markdown>{text}</Markdown>
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-emerald-500 animate-pulse rounded-sm" />
        </div>
      </div>
    </div>
  );
}

function StatusBanner({ text }: { text: string }) {
  return (
    <div className="animate-fade-in-up flex items-center gap-2 px-4 py-2 md:pl-[3.25rem]">
      <div className="flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {text}
      </div>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-end px-4 py-3">
        <div className="h-10 w-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="hidden h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700 md:block" />
        <div className="max-w-[85%] flex-1 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="flex justify-end px-4 py-3">
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="hidden h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700 md:block" />
        <div className="max-w-[85%] flex-1 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

interface ChatContainerProps {
  conversationId?: string;
}

export function ChatContainer({ conversationId }: ChatContainerProps) {
  const {
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
    deleteConversation,
  } = useChat(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasMessages = messages.length > 0 || !!streamingText;

  // Scroll once when the user sends a message (so their bubble is visible)
  useEffect(() => {
    if (isLoading && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [isLoading]);

  // Scroll to a loaded conversation's bottom once (without animation)
  useEffect(() => {
    if (
      !isLoadingConversation &&
      conversationId &&
      messages.length > 0 &&
      scrollRef.current
    ) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingConversation]);

  // Scroll once when the final message lands (streaming done)
  useEffect(() => {
    if (!isLoading && messages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [isLoading, messages.length]);

  const handleSend = (
    message: string,
    tool?: import("@/types").ToolId | null,
    language?: import("@/types").Language,
  ) => {
    sendMessage(message, tool, language);
  };

  return (
    <div className="flex h-dvh flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar overlay */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={startNewChat}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-[var(--font-heading)] text-base font-bold text-slate-800 dark:text-slate-100">
              Our
              <span className="text-emerald-600 dark:text-emerald-400">
                Nigeria
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewChat}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                New chat
              </Button>
            )}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl">
          {isLoadingConversation ? (
            <MessagesSkeleton />
          ) : !hasMessages ? (
            <WelcomeHero onSuggestionClick={handleSend} />
          ) : (
            <div className="py-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onFollowUpClick={handleSend}
                />
              ))}
              {streamingText && <StreamingBubble text={streamingText} />}
              {isLoading && !streamingText && (
                <TypingIndicator statusText={statusText} />
              )}
              {isLoading && streamingText && statusText && (
                <StatusBanner text={statusText} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
