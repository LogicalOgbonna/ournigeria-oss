"use client";

import { useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/api";

declare global {
  interface Window {
    onTelegramAuth: (user: Record<string, string | number>) => void;
  }
}

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
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    // Instead of directly redirecting via GET, use a POST request for linking if authenticated
    window.onTelegramAuth = async function (user: Record<string, string | number>) {
      let isLoggedIn = false;
      try {
        // First check if user has an active session via the profile endpoint
        const profileRes = await fetch(apiUrl("/api/auth/profile"), {
          credentials: "include",
        });
        isLoggedIn = profileRes.ok;
      } catch (e) {
        console.error("Error checking profile", e);
      }

      if (isLoggedIn) {
        try {
          // User is already logged in, do a secure POST request to link accounts
          // Ensure all values are strings since Telegram widget might send numbers
          const stringifiedUser = Object.fromEntries(
            Object.entries(user).map(([k, v]) => [k, String(v)]),
          );

          const linkRes = await fetch(apiUrl("/api/auth/telegram/link"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stringifiedUser),
            credentials: "include",
          });

          if (linkRes.ok) {
            // Success - redirect or show success state
            window.location.href = "/";
          } else {
            console.error("Failed to link account:", await linkRes.text());
            window.location.href = "/login?error=telegram_link_failed";
          }
        } catch (e) {
          console.error("Error linking account", e);
          window.location.href = "/login?error=telegram_link_failed";
        }
        return; // Prevent falling through to the GET login flow
      }

      // Fallback to the standard GET login flow if not logged in
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(user).map(([k, v]) => [k, String(v)])),
      ).toString();
      window.location.href = `${authUrl}?${params}`;
    };
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
