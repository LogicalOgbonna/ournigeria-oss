"use client";

import { Send } from "lucide-react";
import posthog from "posthog-js";

const TELEGRAM = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ournigeria_dev_bot"}`;

/**
 * The page's single action. Email capture was designed first, but nothing in
 * this app can store an address (even /contact just opens a `mailto:`), so the
 * one channel that actually works today is the Telegram bot — a control that
 * silently drops people's emails is worse than no control.
 */
export function NotifyTelegram() {
  return (
    <a
      href={TELEGRAM}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => posthog.capture("election_notify_clicked", { channel: "telegram" })}
      className="btn-magnetic inline-flex h-13 items-center gap-2.5 rounded-[1.5rem] bg-emerald-600 px-8 text-base font-semibold text-white shadow-xl shadow-emerald-600/20 dark:bg-emerald-500"
    >
      <span className="btn-slide bg-emerald-700 dark:bg-emerald-600" />
      <span className="relative z-10 flex items-center gap-2.5">
        <Send className="h-4 w-4" />
        Notify me on Telegram
      </span>
    </a>
  );
}
