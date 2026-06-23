"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, RefreshCw, Send } from "lucide-react";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "";
const API_BASE = "/api";
const POLL_MS = 2000;
const MAX_POLL_MS = 5 * 60 * 1000;
// Per-tab so a reloaded/OS-discarded tab (common on mobile while the user is in
// Telegram) can resume polling the same login instead of losing the pollKey.
const STORAGE_KEY = "tg_login";

type Phase = "idle" | "waiting" | "expired" | "error";

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

/**
 * ISP-block-resilient Telegram login. The browser never contacts
 * telegram.org/oauth.telegram.org — it opens a t.me deep link (native app over
 * MTProto) and polls our API, which is notified server→server via the webhook.
 *
 * On success the session cookie is already set by the poll endpoint; the parent
 * supplies `onAuthenticated` to decide what happens next (redirect, callback…).
 */
export function TelegramDeepLinkLogin({
  onAuthenticated,
}: {
  onAuthenticated: () => void | Promise<void>;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [appLink, setAppLink] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const pollKeyRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMobile(isMobile()), []);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const poll = useCallback(async () => {
    const pollKey = pollKeyRef.current;
    if (!pollKey) return;
    if (Date.now() - startedAtRef.current > MAX_POLL_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      setPhase("expired");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/auth/telegram/poll?pollKey=${encodeURIComponent(pollKey)}`,
        { credentials: "include" },
      );
      const data = await res.json();
      if (data.status === "authenticated") {
        clearTimer();
        sessionStorage.removeItem(STORAGE_KEY);
        await onAuthenticated();
        return;
      }
      if (data.status === "expired") {
        sessionStorage.removeItem(STORAGE_KEY);
        setPhase("expired");
        return;
      }
    } catch {
      // transient — keep polling
    }
    timerRef.current = setTimeout(poll, POLL_MS);
  }, [onAuthenticated]);

  const begin = useCallback(async () => {
    if (!BOT_USERNAME) {
      setPhase("error");
      return;
    }
    setPhase("waiting");
    try {
      const res = await fetch(`${API_BASE}/auth/telegram/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ intent: "login" }),
      });
      if (!res.ok) {
        setPhase("error");
        return;
      }
      const { startParam, pollKey } = await res.json();
      pollKeyRef.current = pollKey;
      startedAtRef.current = Date.now();
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ startParam, pollKey, startedAt: startedAtRef.current }),
      );
      const param = encodeURIComponent(startParam);
      const tgApp = `tg://resolve?domain=${BOT_USERNAME}&start=${param}`;
      setDeepLink(`https://t.me/${BOT_USERNAME}?start=${param}`);
      setAppLink(tgApp);
      timerRef.current = setTimeout(poll, POLL_MS);
      if (isMobile()) {
        // Launch the Telegram app right away via its custom scheme. Unlike an
        // https://t.me navigation, tg:// does NOT unload this page, so polling
        // keeps running here. The visible button below is the fallback.
        window.location.href = tgApp;
      }
    } catch {
      setPhase("error");
    }
  }, [poll]);

  // Resume a pending login if this tab was reloaded or restored by the OS while
  // the user was in Telegram — otherwise the in-memory pollKey would be lost.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        startParam?: string;
        pollKey?: string;
        startedAt?: number;
      };
      if (
        saved.pollKey &&
        saved.startParam &&
        typeof saved.startedAt === "number" &&
        Date.now() - saved.startedAt < MAX_POLL_MS
      ) {
        pollKeyRef.current = saved.pollKey;
        startedAtRef.current = saved.startedAt;
        const param = encodeURIComponent(saved.startParam);
        setDeepLink(`https://t.me/${BOT_USERNAME}?start=${param}`);
        setAppLink(`tg://resolve?domain=${BOT_USERNAME}&start=${param}`);
        setPhase("waiting");
        timerRef.current = setTimeout(poll, POLL_MS);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    // run once on mount; poll is stable across renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimer(), []);

  const primaryBtn =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90";

  if (phase === "idle") {
    return (
      <button type="button" onClick={() => void begin()} className={primaryBtn}>
        <Send className="h-4 w-4" /> Continue with Telegram
      </button>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex w-full flex-col items-center gap-3 text-center">
        <p className="text-sm text-destructive">Couldn&apos;t start Telegram login. Try again.</p>
        <button type="button" onClick={() => void begin()} className={primaryBtn}>
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  if (phase === "expired") {
    return (
      <div className="flex w-full flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">This login link expired.</p>
        <button type="button" onClick={() => void begin()} className={primaryBtn}>
          <RefreshCw className="h-4 w-4" /> Generate a new link
        </button>
      </div>
    );
  }

  // phase === "waiting"
  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      {mobile ? (
        <>
          <p className="text-sm text-muted-foreground">
            Opening Telegram… press <b>Start</b>, then come back here.
          </p>
          {(appLink || deepLink) && (
            <a href={appLink ?? deepLink ?? "#"} className={primaryBtn}>
              <Send className="h-4 w-4" /> Didn&apos;t open? Tap to open Telegram
            </a>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Scan with your phone&apos;s Telegram, then tap <b>Start</b>:
          </p>
          {deepLink && (
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG value={deepLink} size={196} />
            </div>
          )}
          {deepLink && (
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Open in Telegram Desktop instead
            </a>
          )}
        </>
      )}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Waiting for confirmation…
      </div>
    </div>
  );
}
