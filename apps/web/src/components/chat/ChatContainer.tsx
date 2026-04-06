"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { WelcomeHero } from "./WelcomeHero";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatSidebar } from "./ChatSidebar";
import Image from "next/image";
import {
  Sparkles,
  MessageSquarePlus,
  Menu,
  Share2,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { ShareDialog } from "./ShareDialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SystemBanners } from "@/components/notifications/SystemBanner";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Markdown } from "./Markdown";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { PricingModal } from "@/components/pricing/PricingModal";

function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="animate-fade-in-up flex items-start gap-3 px-4 py-3">
      <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 md:flex">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 max-w-full md:max-w-[85%]">
        {/* Thinking indicator */}
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Researching and analyzing...</span>
        </div>
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

function ConnectionError({ onRetry }: { onRetry: () => void }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    onRetry();
    setTimeout(() => setIsRetrying(false), 2000);
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-6">
      {/* Floating background circles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-emerald-100/40 dark:bg-emerald-900/10 blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-emerald-100/30 dark:bg-emerald-900/10 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-6 text-center max-w-sm">
        {/* Animated icon */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-lg">
            <WifiOff className="h-9 w-9 text-slate-400 dark:text-slate-500" />
          </div>
          {/* Little bouncing dot */}
          <div
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-400 shadow-md animate-bounce"
            style={{ animationDuration: "1.5s" }}
          />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Omo, server dey sleep!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Our servers are taking a quick break. Don&apos;t worry, your budget
            questions aren&apos;t going anywhere.
          </p>
        </div>

        {/* Retry button */}
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          className="gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 text-sm font-medium text-white shadow-md transition-all hover:from-emerald-500 hover:to-emerald-600 hover:shadow-lg disabled:opacity-70"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`}
          />
          {isRetrying ? "Checking..." : "Try again"}
        </Button>

        {/* Subtle footer */}
        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          If this persists, check your internet connection
        </p>
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
    isCheckingAuth,
    isLoadingConversation,
    streamingText,
    statusText,
    sendMessage,
    conversations,
    activeConversationId,
    startNewChat,
    loadConversation,
    deleteConversation,
    updateConversationLocally,
    loadError,
    retryLoad,
    isLimitReached,
    setIsLimitReached,
  } = useChat(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
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

  if (loadError) {
    return <ConnectionError onRetry={retryLoad} />;
  }

  if (isCheckingAuth) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </div>
    );
  }

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

      <SystemBanners />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <a
            href={process.env.NEXT_PUBLIC_LOGIN_URL?.replace(/\/login$/, "") || "https://ournigeria.ng"}
            className="flex items-center gap-2"
          >
            <Image
              src="/long_logo_dark.svg"
              alt="OurNigeria"
              width={140}
              height={39}
              className="hidden dark:block"
            />
            <Image
              src="/long_logo_dark.svg"
              alt="OurNigeria"
              width={140}
              height={39}
              className="block brightness-0 dark:hidden"
            />
          </a>
          <div className="flex items-center gap-1">
            {hasMessages && activeConversationId && (
              <Button
                variant="ghost"
                size="icon"
                data-tour="share-button"
                onClick={() => setShareDialogOpen(true)}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 md:w-auto md:px-2"
                title="Share"
              >
                <Share2 className="h-4 w-4 md:mr-1 md:h-3 md:w-3" />
                <span className="hidden text-xs md:inline">Share</span>
              </Button>
            )}
            {hasMessages && (
              <Button
                variant="ghost"
                size="icon"
                data-tour="new-chat-button"
                onClick={startNewChat}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 md:w-auto md:px-2"
                title="New chat"
              >
                <MessageSquarePlus className="h-4 w-4 md:mr-1 md:h-3 md:w-3" />
                <span className="hidden text-xs md:inline">New chat</span>
              </Button>
            )}
            <ThemeToggle />
            <NotificationCenter />
            <Button
              variant="ghost"
              size="icon"
              data-tour="menu-button"
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
              {messages.map((message, index) => {
                // Only scan for previous user message on retryable errors (short-circuits for 99% of messages)
                const prevUserMsg =
                  message.isError && message.retryable
                    ? messages
                        .slice(0, index)
                        .reverse()
                        .find((m) => m.role === "user")?.content
                    : undefined;

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    conversationId={activeConversationId}
                    onFollowUpClick={handleSend}
                    onRetry={handleSend}
                    previousUserMessage={prevUserMsg}
                    isLoading={isLoading}
                  />
                );
              })}
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

      {/* Share Dialog */}
      {shareDialogOpen &&
        activeConversationId &&
        (() => {
          const activeConv = conversations.find(
            (c) => c.id === activeConversationId,
          );
          return (
            <ShareDialog
              conversationId={activeConversationId}
              visibility={activeConv?.visibility ?? "private"}
              slug={activeConv?.slug ?? null}
              onVisibilityChange={(visibility, slug) => {
                updateConversationLocally(activeConversationId, {
                  visibility,
                  slug,
                });
              }}
              onClose={() => setShareDialogOpen(false)}
            />
          );
        })()}

      <OnboardingTour
        hasMessages={hasMessages}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <PricingModal
        isOpen={isLimitReached}
        onClose={() => setIsLimitReached(false)}
      />
    </div>
  );
}
