"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Send, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "";
const POLL_MS = 2000;
const MAX_POLL_MS = 5 * 60 * 1000;

type Phase = "idle" | "waiting" | "expired" | "error";

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

/**
 * ISP-block-resilient Telegram login. The browser never contacts
 * telegram.org/oauth.telegram.org — it opens a t.me deep link (native app over
 * MTProto) and polls our API, which is notified server→server via the webhook.
 */
export function TelegramDeepLinkLogin({ intent = "login" }: { intent?: "login" | "link" }) {
  const router = useRouter();
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
      setPhase("expired");
      return;
    }
    try {
      const res = await fetch(
        apiUrl(`/api/auth/telegram/poll?pollKey=${encodeURIComponent(pollKey)}`),
        { credentials: "include" },
      );
      const data = await res.json();
      if (data.status === "authenticated") {
        clearTimer();
        router.push("/");
        router.refresh();
        return;
      }
      if (data.status === "expired") {
        setPhase("expired");
        return;
      }
    } catch {
      // transient network error — keep polling
    }
    timerRef.current = setTimeout(poll, POLL_MS);
  }, [router]);

  const begin = useCallback(async () => {
    if (!BOT_USERNAME) {
      setPhase("error");
      return;
    }
    setPhase("waiting");
    try {
      const res = await fetch(apiUrl("/api/auth/telegram/start"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ intent }),
      });
      if (!res.ok) {
        setPhase("error");
        return;
      }
      const { startParam, pollKey } = await res.json();
      pollKeyRef.current = pollKey;
      startedAtRef.current = Date.now();
      const param = encodeURIComponent(startParam);
      const tgApp = `tg://resolve?domain=${BOT_USERNAME}&start=${param}`;
      setDeepLink(`https://t.me/${BOT_USERNAME}?start=${param}`);
      setAppLink(tgApp);
      timerRef.current = setTimeout(poll, POLL_MS);
      if (isMobile()) {
        // Launch the Telegram app right away via its custom scheme. Unlike an
        // https://t.me navigation, tg:// does NOT unload this page, so polling
        // keeps running here. The visible button below is the fallback if the
        // browser doesn't honour the auto-launch.
        window.location.href = tgApp;
      }
    } catch {
      setPhase("error");
    }
  }, [intent, poll]);

  useEffect(() => () => clearTimer(), []);

  if (phase === "idle") {
    return (
      <Button onClick={begin} className="w-full" size="lg">
        <Send className="mr-2 h-4 w-4" /> Continue with Telegram
      </Button>
    );
  }

  if (phase === "error") {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t start Telegram login. Try the WhatsApp tab, or try again.
        </p>
        <Button variant="outline" onClick={begin} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (phase === "expired") {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">This login link expired.</p>
        <Button onClick={begin} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" /> Generate a new link
        </Button>
      </div>
    );
  }

  // phase === "waiting"
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {mobile ? (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Opening Telegram… press <b>Start</b>, then come back here.
          </p>
          {(appLink || deepLink) && (
            <a href={appLink ?? deepLink ?? "#"} className="w-full">
              <Button size="lg" variant="outline" className="w-full">
                <Send className="mr-2 h-4 w-4" /> Didn&apos;t open? Tap to open Telegram
              </Button>
            </a>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400">
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
              className="text-xs text-slate-500 underline hover:text-slate-700 dark:hover:text-slate-300"
            >
              Open in Telegram Desktop instead
            </a>
          )}
        </>
      )}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-3 w-3 animate-spin" /> Waiting for confirmation…
      </div>
    </div>
  );
}
