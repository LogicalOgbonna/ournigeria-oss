"use client";

import { useNotifications } from "@/contexts/NotificationContext";
import { AlertCircle, Megaphone, AlertTriangle, X } from "lucide-react";
import type { SystemBanner } from "@/types/notifications";

const bannerStyles: Record<
  SystemBanner["type"],
  { bg: string; icon: typeof AlertCircle }
> = {
  incident: { bg: "bg-red-600", icon: AlertCircle },
  announcement: { bg: "bg-emerald-600", icon: Megaphone },
  warning: { bg: "bg-amber-500", icon: AlertTriangle },
};

export function SystemBanners() {
  const { banners, dismissBanner } = useNotifications();

  if (banners.length === 0) return null;

  return (
    <div className="relative z-20 flex flex-col">
      {banners.map((banner) => {
        const { bg, icon: Icon } = bannerStyles[banner.type];
        return (
          <div
            key={banner.id}
            className={`${bg} animate-fade-in flex items-center gap-3 px-4 py-2.5 text-sm text-white`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="font-semibold">{banner.title}</span>
              <span className="truncate opacity-90">{banner.message}</span>
              {banner.link && (
                <a
                  href={banner.link.url}
                  className="shrink-0 underline underline-offset-2 hover:opacity-80"
                >
                  {banner.link.text}
                </a>
              )}
            </div>
            {banner.dismissible && (
              <button
                onClick={() => dismissBanner(banner.id)}
                className="shrink-0 rounded p-0.5 hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
