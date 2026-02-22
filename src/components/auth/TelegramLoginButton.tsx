"use client";

import { useEffect, useRef } from "react";

const TELEGRAM_WIDGET_URL = "https://telegram.org/js/telegram-widget.js?22";
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export function TelegramLoginButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !BOT_USERNAME || initialized.current) return;
    initialized.current = true;

    const baseUrl = APP_URL || window.location.origin;
    const authUrl = `${baseUrl}/api/auth/telegram`;

    const script = document.createElement("script");
    script.src = TELEGRAM_WIDGET_URL;
    script.async = true;
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-auth-url", authUrl);
    script.setAttribute("data-request-access", "write");

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
    <div
      ref={containerRef}
      className="flex min-h-[40px] items-center justify-center"
    />
  );
}
