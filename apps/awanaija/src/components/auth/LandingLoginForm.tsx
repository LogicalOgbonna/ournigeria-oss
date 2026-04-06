"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, MessageCircleCheck, Send, ShieldCheck, type LucideIcon } from "lucide-react";
import { APP_URL } from "@/lib/constants";
import { toast } from "sonner";

declare global {
  var onTelegramAuth: (user: Record<string, string | number>) => void;
}

const TELEGRAM_WIDGET_URL = "https://telegram.org/js/telegram-widget.js?22";
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
const API_BASE = "/api";

const AUTH_TABS: { id: "telegram" | "whatsapp"; label: string; icon: LucideIcon }[] = [
  { id: "telegram", label: "Telegram", icon: Send },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircleCheck },
];

function getSafeRedirectTarget(value: string | null): string {
  if (!value) return APP_URL;

  try {
    const target = new URL(value);
    const appOrigin = new URL(APP_URL).origin;
    if (target.origin === appOrigin) return target.toString();
  } catch {}

  return APP_URL;
}

function buildAppRedirectUrl(target: string, authToken?: string): string {
  if (!authToken) return target;

  const url = new URL(target);
  url.searchParams.set("nb_auth", authToken);
  return url.toString();
}

function normalizePhoneNumber(raw: string) {
  let cleaned = raw.replaceAll(/[\s\-().]/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = `+234${cleaned.slice(1)}`;
  }
  if (!cleaned.startsWith("+") && cleaned.startsWith("234")) {
    cleaned = `+${cleaned}`;
  }
  return cleaned;
}

export function LandingLoginForm() {
  const searchParams = useSearchParams();
  const redirectTarget = useMemo(
    () => getSafeRedirectTarget(searchParams.get("returnTo")),
    [searchParams],
  );

  const [activeTab, setActiveTab] = useState<"telegram" | "whatsapp">("telegram");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const telegramRef = useRef<HTMLDivElement>(null);
  const telegramLoaded = useRef(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!cancelled && res.ok) {
          const tokenRes = await fetch(`${API_BASE}/auth/session-token`, {
            credentials: "include",
          });
          if (!cancelled && tokenRes.ok) {
            const { authToken } = await tokenRes.json();
            globalThis.location.replace(buildAppRedirectUrl(redirectTarget, authToken));
            return;
          }
          globalThis.location.replace(redirectTarget);
          return;
        }
      } catch {}

      if (!cancelled) {
        setIsCheckingSession(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [redirectTarget]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (step !== "otp") return;
    const timeout = setTimeout(() => otpRefs.current[0]?.focus(), 100);
    return () => clearTimeout(timeout);
  }, [step]);

  useEffect(() => {
    if (activeTab === "telegram") return;
    telegramLoaded.current = false;
    if (telegramRef.current) {
      telegramRef.current.innerHTML = "";
    }
  }, [activeTab]);

  useEffect(() => {
    if (
      activeTab !== "telegram" ||
      isCheckingSession ||
      !BOT_USERNAME ||
      !telegramRef.current ||
      telegramLoaded.current
    ) {
      return;
    }

    const container = telegramRef.current;
    telegramLoaded.current = true;
    container.innerHTML = "";

    globalThis.onTelegramAuth = function (user: Record<string, string | number>) {
      void (async () => {
        const stringifiedUser = Object.fromEntries(
          Object.entries(user).map(([k, v]) => [k, String(v)]),
        );

        setIsSubmitting(true);

        try {
          const res = await fetch(`${API_BASE}/auth/telegram/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(stringifiedUser),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({
              error: "Telegram login failed. Please try again.",
            }));
            toast.error(data.error || "Telegram login failed. Please try again.");
            return;
          }

          const data = await res.json();
          globalThis.location.replace(buildAppRedirectUrl(redirectTarget, data.authToken));
        } catch {
          toast.error("Network error during Telegram login. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      })();
    };

    const script = document.createElement("script");
    script.src = TELEGRAM_WIDGET_URL;
    script.async = true;
    script.dataset.telegramLogin = BOT_USERNAME;
    script.dataset.size = "large";
    script.dataset.onauth = "onTelegramAuth(user)";
    script.dataset.requestAccess = "write";
    container.appendChild(script);
  }, [activeTab, isCheckingSession, redirectTarget]);

  const otpCode = otpDigits.join("");

  useEffect(() => {
    if (otpCode.length === 6 && step === "otp" && !isSubmitting) {
      void handleVerifyOtp();
    }
  }, [otpCode, step, isSubmitting]);

  function handleOtpChange(index: number, value: string) {
    const digit = value.replaceAll(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  async function handleSendOtp() {
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber: normalizePhoneNumber(phoneNumber) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send OTP");
        return;
      }
      setStep("otp");
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(60);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phoneNumber: normalizePhoneNumber(phoneNumber),
          code: otpCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Verification failed");
        return;
      }

      globalThis.location.replace(buildAppRedirectUrl(redirectTarget, data.authToken));
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-[#0B1215] px-4 pb-12 pt-32 sm:px-6 lg:px-8">
      {/* Subtle background dot pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#2e364f_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />

      <div className="relative w-full max-w-[420px]">
        {/* Header */}
        <div className="mb-2 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400/80 mb-3">
            CITIZEN LOGIN
          </p>
          <h1 className="text-3xl font-heading font-semibold tracking-tight text-white">
            Hold power to account
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Sign in to track budgets, public spending, and elected officials across Nigeria.
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#131B24] p-6 shadow-xl sm:p-8">
            <div className="mb-8 flex border-b border-slate-800">
              {AUTH_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 pb-4 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "border-b-2 border-emerald-500 text-emerald-500"
                      : "border-b-2 border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "telegram" && (
            <div className="flex flex-col">
              <div className="mb-6 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 text-sm font-medium text-sky-400">
                  <Send className="h-4 w-4" />
                  Sign in via Telegram
                </div>
              </div>

              <p className="mb-8 text-center text-slate-400">
                Click the button below to sign in with your Telegram account.
              </p>

              <div className="flex flex-col items-center justify-center">
                {isCheckingSession ? (
                  <div className="flex h-[48px] items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <div ref={telegramRef} className="flex min-h-[48px] items-center justify-center" />
                )}
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-xl bg-slate-800/40 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <p className="text-sm text-slate-400">
                  You&apos;ll confirm in Telegram&apos;s secure popup. We only receive your Telegram ID.
                </p>
              </div>
            </div>
          )}

          {activeTab === "whatsapp" && step === "phone" && (
            <div className="flex flex-col">
              <div className="mb-6 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
                  <MessageCircleCheck className="h-4 w-4" />
                  Sign in via WhatsApp
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="mb-3 block text-sm font-medium text-slate-200">
                  Phone number
                </label>
                <div className="flex w-full items-center rounded-xl border border-slate-800 bg-[#1A222C] px-3 py-2 transition focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <span className="mr-3 text-slate-500">+234</span>
                  <input
                    id="phone"
                    type="tel"
                    disabled
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="XXX XXX XXXX"
                    className="w-full bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleSendOtp()}
                disabled={isSubmitting || phoneNumber.length < 10}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a3c36] px-4 py-2 text-base font-semibold text-slate-950 transition hover:bg-[#642e2e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Coming Soon
                <ArrowRight className="h-5 w-5" />
              </button>

              <div className="mt-8 flex items-start gap-3 rounded-xl bg-slate-800/40 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <p className="text-sm text-slate-400">
                  We&apos;ll send a 6-digit code to your WhatsApp. No password needed.
                </p>
              </div>
            </div>
          )}

          {activeTab === "whatsapp" && step === "otp" && (
            <div className="flex flex-col">
              <div className="mb-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtpDigits(["", "", "", "", "", ""]);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <p className="font-mono text-xs text-slate-400">{phoneNumber}</p>
              </div>

              <div className="mb-6 grid grid-cols-6 gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      otpRefs.current[index] = node;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
                        otpRefs.current[index - 1]?.focus();
                      }
                    }}
                    className="h-12 rounded-xl border border-slate-700 bg-slate-900/50 text-center text-lg font-semibold text-white outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => void handleVerifyOtp()}
                disabled={otpCode.length !== 6 || isSubmitting}
                className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Verify OTP
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => void handleSendOtp()}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className="text-sm font-medium text-emerald-500 transition hover:text-emerald-400 disabled:cursor-not-allowed disabled:text-slate-500"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Your data is private and never shared.
        </p>
      </div>
    </section>
  );
}