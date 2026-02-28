"use client";

import { useState } from "react";
import type { ConversationForUI } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  MessageSquare,
  X,
  Clock,
  LogOut,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

interface ChatSidebarProps {
  conversations: ConversationForUI[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function getPreview(conv: ConversationForUI): string {
  if (!conv.lastMessage) return "No response yet";
  const text = conv.lastMessage;
  if (text.length <= 50) return text;
  return text.slice(0, 50).trimEnd() + "...";
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const router = useRouter();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      onDeleteConversation(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-200
          ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}
        `}
        onClick={onClose}
      />

      {/* Sidebar — overlays from the right */}
      <aside
        className={`
          fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900
          shadow-2xl transition-transform duration-200 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 px-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              History
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-800 dark:hover:text-emerald-300"
              onClick={handleNewChat}
              title="New chat"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <MessageSquare className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No conversations yet
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                Your chat history will appear here once you start a
                conversation.
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conv) => {
                const isActive = activeConversationId === conv.id;
                const isConfirming = confirmDeleteId === conv.id;
                const msgCount = conv.messageCount;

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelect(conv.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleSelect(conv.id);
                      }
                    }}
                    className={`
                      group relative cursor-pointer rounded-lg p-3 transition-colors
                      ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-200 dark:ring-emerald-800"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800"
                      }
                    `}
                  >
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`line-clamp-2 pr-6 text-[13px] leading-snug ${
                          isActive
                            ? "font-semibold text-emerald-900 dark:text-emerald-200"
                            : "font-medium text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {conv.title}
                      </p>

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className={`
                          absolute right-2 top-2 shrink-0 rounded-md p-1 transition-all
                          ${
                            isConfirming
                              ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
                              : "text-slate-300 dark:text-slate-600 opacity-0 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-500 dark:hover:text-red-400 group-hover:opacity-100"
                          }
                        `}
                        title={
                          isConfirming
                            ? "Click again to delete"
                            : "Delete conversation"
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Preview */}
                    <p className="mt-1 line-clamp-1 text-xs text-slate-400 dark:text-slate-500">
                      {getPreview(conv)}
                    </p>

                    {/* Meta row */}
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                      <span>{formatRelativeTime(conv.updatedAt)}</span>
                      <span className="text-slate-300 dark:text-slate-600">
                        &middot;
                      </span>
                      <span>
                        {msgCount} {msgCount === 1 ? "message" : "messages"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200/80 dark:border-slate-700/80 px-3 py-2.5">
          <button
            data-tour="profile-button"
            onClick={() => {
              onClose();
              router.push("/profile");
            }}
            className="rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
            title="Profile settings"
          >
            <User className="h-4 w-4" />
          </button>
          <button
            onClick={async () => {
              await fetch(apiUrl("/api/auth/logout"), {
                method: "POST",
                credentials: "include",
              });
              await fetch("/api/logout", { method: "POST" });
              localStorage.removeItem("ournigeria-conversations");
              router.push("/login");
            }}
            className="rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
