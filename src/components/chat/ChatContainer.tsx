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
import { Markdown } from "./Markdown";

function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="animate-fade-in-up flex items-start gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 max-w-[92%] md:max-w-[85%]">
        <div className="rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
          <Markdown>{text}</Markdown>
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-emerald-500 animate-pulse rounded-sm" />
        </div>
      </div>
    </div>
  );
}

export function ChatContainer() {
  const {
    messages,
    isLoading,
    streamingText,
    sendMessage,
    conversations,
    activeConversationId,
    startNewChat,
    loadConversation,
    deleteConversation,
  } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasMessages = messages.length > 0 || !!streamingText;

  // Auto-scroll to bottom on new messages or streaming text
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading, streamingText]);

  const handleSend = (message: string, tool?: import("@/types").ToolId | null) => {
    sendMessage(message, tool);
  };

  return (
    <div className="flex h-dvh flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
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
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-[var(--font-heading)] text-base font-bold text-slate-800">
              Naija<span className="text-emerald-600">Budget</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewChat}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                New chat
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-700"
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
          {!hasMessages ? (
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
              {isLoading && !streamingText && <TypingIndicator />}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
