"use client";

import { X, Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Ready";
  const s = Math.ceil(ms / 1000);
  const d = Math.floor(s / (24 * 3600));
  const h = Math.floor((s % (24 * 3600)) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rs = s % 60;
  
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (rs > 0 || parts.length === 0) parts.push(`${rs}s`);
  
  return parts.join(" ");
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function normalizeToMs(t: number): number {
  return t < 1e12 ? t * 1000 : t;
}

export interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Absolute UNIX ms when each in-window use rolls off and a question becomes available. */
  expirations: number[];
  retryAfterMs?: number | null;
}

/**
 * Shown when chat returns 429. Shows a live countdown per upcoming slot (sorted soonest first).
 */
export function RateLimitModal({
  isOpen,
  onClose,
  expirations,
  retryAfterMs,
}: RateLimitModalProps) {
  const [mounted, setMounted] = useState(false);
  const now = useNow(1000);

  const rows = useMemo(() => {
    const ms = (expirations as number[]).map(normalizeToMs);
    const withIdx = ms
      .map((at) => ({ at, remaining: at - now }))
      .filter((r) => r.remaining > 0)
      .sort((a, b) => a.at - b.at);
    if (withIdx.length > 0) return withIdx;
    if (typeof retryAfterMs === "number" && retryAfterMs > 0) {
      return [{ at: now + retryAfterMs, remaining: retryAfterMs }];
    }
    return [];
  }, [expirations, now, retryAfterMs]);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const first = rows[0];
  // Calculate progress for a roughly 5-hour window to match design snippet loosely.
  const windowMs = 5 * 60 * 60 * 1000;
  const progress = first ? Math.max(0, Math.min(1, 1 - first.remaining / windowMs)) : 1;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="relative w-full max-w-[720px] overflow-hidden rounded-2xl border border-slate-800 bg-[#0A0F14] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* HEADER */}
        <div className="px-6 sm:px-12 pt-8 pb-4 text-center md:text-left">
          <div className="font-mono text-[10px] font-semibold tracking-[0.15em] text-emerald-400 uppercase mb-3">
            FREE QUESTIONS USED
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Two ways to <em className="text-emerald-400 not-italic">keep going.</em>
          </h2>
          <p className="mx-auto md:mx-0 mt-3 max-w-full text-sm text-slate-300 leading-relaxed">
            OurNigeria runs on donations — no ads, no data sales. One person currently pays the bills.
          </p>
        </div>

        {/* WHAT MONEY DOES */}
        <div className="mx-6 sm:mx-8 mt-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">What your money does</div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">~$1,000 / month</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { pct: "61%", k: "AI inference", v: "Every question runs through a model. This is the biggest line item." },
              { pct: "21%", k: "Servers",      v: "Hosting, scraping, the database that watches FAAC drops." },
              { pct: "14%", k: "Storage & search", v: "S3 storage, embeddings, live web fetch when the corpus is stale." },
              { pct: "4%",  k: "Domain & ops", v: "Email, SSL, the boring stuff that keeps the site online." },
            ].map((it, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="font-mono text-xl font-bold text-emerald-400 tracking-tight">{it.pct}</div>
                <div className="text-xs font-bold text-slate-100">{it.k}</div>
                <div className="text-[11px] leading-relaxed text-slate-400">{it.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TWO PATHS */}
        <div className="flex flex-col md:grid md:grid-cols-[1fr_1px_1.15fr] gap-4 md:gap-0 px-4 sm:px-6 py-6">
          
          {/* DONATE (Mobile First) */}
          <div className="relative rounded-2xl md:rounded-none border border-emerald-500/30 md:border-transparent bg-emerald-500/5 md:bg-transparent px-5 py-5 text-left md:text-center flex flex-col md:items-center order-1 md:order-3">
            <div className="absolute right-4 top-0 -translate-y-1/2 md:right-4 md:-top-2 md:translate-y-0 rounded-full bg-amber-400 px-3 py-1 font-mono text-[9px] font-bold tracking-[0.15em] text-amber-950">
              RECOMMENDED
            </div>
            
            <div className="flex items-start md:items-center md:flex-col gap-4 md:gap-0">
              <div 
                className="shrink-0 flex h-14 w-14 md:h-24 md:w-24 items-center justify-center rounded-full shadow-[0_12px_36px_-12px_rgba(16,185,129,0.5)] md:mb-5"
                style={{ background: "radial-gradient(circle at 35% 30%, #34d399, #047857)" }}
              >
                <Heart className="h-6 w-6 md:h-8 md:w-8" fill="#02110b" color="#02110b" />
              </div>
              
              <div className="flex flex-col">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400 mb-1 md:mb-6">Path 2 · Donate</div>
                <div className="font-sans text-xl md:text-2xl font-bold tracking-tight text-white">
                  Support the mission
                </div>
              </div>
            </div>

            <p className="mt-4 md:mt-2 mb-6 max-w-full md:max-w-[220px] text-xs leading-relaxed text-slate-400 md:mx-auto">
              Your donation helps keep the platform free for everyone, including yourself.
            </p>
            <Link href="/donate" className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-[#02110b] transition-colors hover:bg-emerald-400">
              <Heart className="h-3.5 w-3.5 fill-[#02110b]" />
              Donate & continue
            </Link>
          </div>

          {/* Divider */}
          <div className="hidden md:block bg-slate-800/50 my-4 order-2" />

          {/* WAIT */}
          <div className="rounded-2xl md:rounded-none border border-slate-800 md:border-transparent bg-slate-900/30 md:bg-transparent px-5 py-5 text-left md:text-center flex flex-col md:items-center order-3 md:order-1">
            <div className="flex items-start md:items-center md:flex-col gap-4 md:gap-0">
              <div className="relative shrink-0 flex h-14 w-14 md:h-24 md:w-24 items-center justify-center md:mb-5">
                <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
                  <circle
                    cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={(2 * Math.PI * 46) * (1 - progress)}
                    className="text-slate-600 md:text-emerald-500 transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span className="absolute font-mono text-[8px] md:text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 md:text-emerald-500">Wait</span>
              </div>
              
              <div className="flex flex-col">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1 md:mb-6">Path 1 · Free</div>
                <div className="font-sans text-xl md:text-2xl font-bold tracking-tight text-white">
                  {first ? formatCountdown(first.remaining) : "Ready"}
                </div>
              </div>
            </div>

            <p className="mt-4 md:mt-2 mb-6 max-w-full md:max-w-[200px] text-xs leading-relaxed text-slate-400 md:mx-auto">
              Wait for your next free question. We&apos;ll be here when you get back.
            </p>
            <button onClick={onClose} className="mt-auto w-full rounded-xl border border-slate-700/60 bg-slate-800/30 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
              I&apos;ll wait this time
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/60 bg-slate-900/20 px-6 sm:px-8 py-4 text-[9px]">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono font-semibold uppercase tracking-[0.15em] text-slate-500 mb-3 sm:mb-0">
            <span>· Built by Nigerians in Lagos</span>
            <span>· No ads, ever</span>
            <span>· Open books</span>
          </div>
          <div className="font-mono font-bold uppercase tracking-[0.15em] text-emerald-500">
            A few backers this month
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
