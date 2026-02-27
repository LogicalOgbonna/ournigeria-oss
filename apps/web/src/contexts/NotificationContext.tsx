"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { SystemBanner, Notification } from "@/types/notifications";
import { dummyBanners, dummyNotifications } from "@/data/dummy-notifications";

const DISMISSED_KEY = "ournigeria:dismissed-banners";

interface NotificationContextValue {
  banners: SystemBanner[];
  notifications: Notification[];
  unreadCount: number;
  dismissBanner: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function getDismissedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [notifications, setNotifications] =
    useState<Notification[]>(dummyNotifications);

  useEffect(() => {
    setDismissedIds(getDismissedIds());
  }, []);

  const banners = useMemo(() => {
    const now = new Date();
    return dummyBanners.filter((b) => {
      if (dismissedIds.includes(b.id)) return false;
      if (b.expiresAt && new Date(b.expiresAt) < now) return false;
      return true;
    });
  }, [dismissedIds]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const dismissBanner = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = [...prev, id];
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const value = useMemo(
    () => ({
      banners,
      notifications,
      unreadCount,
      dismissBanner,
      markAsRead,
      markAllAsRead,
    }),
    [banners, notifications, unreadCount, dismissBanner, markAsRead, markAllAsRead],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
