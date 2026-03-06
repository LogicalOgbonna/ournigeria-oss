"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { SystemBanner, Notification } from "@/types/notifications";
import { apiUrl } from "@/lib/api";
import { redirectToLogin, isRedirecting } from "@/lib/auth-redirect";

const POLL_INTERVAL = 60_000; // 1 minute

interface NotificationContextValue {
  banners: SystemBanner[];
  notifications: Notification[];
  unreadCount: number;
  dismissBanner: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [banners, setBanners] = useState<SystemBanner[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (isRedirecting()) return;
    try {
      const res = await fetch(apiUrl("/api/notifications"), {
        credentials: "include",
      });
      if (res.status === 401) {
        stopPolling();
        redirectToLogin();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently fail — user may not be logged in
    }
  }, [stopPolling]);

  const fetchBanners = useCallback(async () => {
    if (isRedirecting()) return;
    try {
      const res = await fetch(apiUrl("/api/notifications/banners"), {
        credentials: "include",
      });
      if (res.status === 401) {
        stopPolling();
        redirectToLogin();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setBanners(data.banners ?? []);
    } catch {
      // silently fail
    }
  }, [stopPolling]);

  const fetchAll = useCallback(() => {
    fetchNotifications();
    fetchBanners();
  }, [fetchNotifications, fetchBanners]);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  const dismissBanner = useCallback(
    async (id: string) => {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      try {
        await fetch(apiUrl(`/api/notifications/banners/${id}/dismiss`), {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // revert on error by re-fetching
        fetchBanners();
      }
    },
    [fetchBanners],
  );

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await fetch(apiUrl(`/api/notifications/${id}/read`), {
          method: "PATCH",
          credentials: "include",
        });
      } catch {
        fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch(apiUrl("/api/notifications/read-all"), {
        method: "POST",
        credentials: "include",
      });
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

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
