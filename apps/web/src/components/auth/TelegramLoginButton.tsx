"use client";

import { useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";

const TELEGRAM_WIDGET_URL = "https://telegram.org/js/telegram-widget.js?22";
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export function TelegramLoginButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !BOT_USERNAME || initialized.current) return;
    initialized.current = true;

    const baseAuthUrl = apiUrl("/api/auth/telegram");
    const authUrl = baseAuthUrl.startsWith("http")
      ? baseAuthUrl
      : `${window.location.origin}${baseAuthUrl}`;

    const script = document.createElement("script");
    script.src = TELEGRAM_WIDGET_URL;
    script.async = true;
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-auth-url", authUrl);
    script.setAttribute("data-request-access", "write");

    script.onload = () => {
      setLoading(false);
    };

    container.appendChild(script);
  }, []);

  if (!BOT_USERNAME) {
    return (
      <p className="text-center text-sm text-slate-400 dark:text-slate-500">
        Telegram login is not configured.
      </p>
    );
  }

  return (
    <div className="flex min-h-[40px] items-center justify-center">
      {loading && (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
      )}
      <div
        ref={containerRef}
        className={`flex items-center justify-center ${loading ? "h-0 overflow-hidden" : ""}`}
      />
    </div>
  );
}
