import { Conversation, Message } from "@/types";

const STORAGE_KEY = "naija-budget-conversations";

export function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) return "New conversation";
  const text = firstUserMessage.content;
  if (text.length <= 40) return text;
  return text.slice(0, 40).trimEnd() + "...";
}

function serialize(conversations: Conversation[]): string {
  return JSON.stringify(conversations);
}

function deserialize(raw: string): Conversation[] {
  try {
    const parsed = JSON.parse(raw) as Conversation[];
    return parsed.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch {
    return [];
  }
}

export function getConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return deserialize(raw).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

export function saveConversation(conv: Conversation): void {
  const all = getConversations();
  const idx = all.findIndex((c) => c.id === conv.id);
  if (idx >= 0) {
    all[idx] = conv;
  } else {
    all.unshift(conv);
  }
  localStorage.setItem(STORAGE_KEY, serialize(all));
}

export function deleteConversation(id: string): void {
  const all = getConversations().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, serialize(all));
}
