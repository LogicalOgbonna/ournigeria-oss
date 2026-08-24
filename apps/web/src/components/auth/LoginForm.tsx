"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Send,
  type LucideIcon,
} from "lucide-react";
import { TelegramDeepLinkLogin } from "@/components/auth/TelegramDeepLinkLogin";
import { apiUrl } from "@/lib/api";

type Step = "phone" | "otp";

interface LoginFormProps {
  error?: string;
}

interface Provider {
  id: string;
  label: string;
  icon: LucideIcon;
  content: React.ReactNode;
}

export function LoginForm({ error: externalError }: LoginFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("telegram");
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [error, setError] = useState(externalError || "");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync external error (e.g. from Telegram redirect)
  useEffect(() => {
    if (externalError) setError(externalError);
  }, [externalError]);

  // Focus first OTP input on step change
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const otpCode = otpDigits.join("");

  const startResendCooldown = useCallback(() => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setError("");
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replaceAll(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleSendOTP = async () => {
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      setStep("otp");
      startResendCooldown();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber, code: otpCode }),
      });

      const data = await res.json();
      if (res.status === 403 && data.error === "banned") {
        sessionStorage.setItem("ban_reason", data.reason || "");
        router.push("/banned");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      router.push("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6 && step === "otp" && !isLoading) {
      handleVerifyOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend OTP");
        return;
      }

      setOtpDigits(["", "", "", "", "", ""]);
      startResendCooldown();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const providers: Provider[] = [
    {
      id: "telegram",
      label: "Telegram",
      icon: Send,
      content: (
        <div className="space-y-5">
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 dark:border-sky-700/50 bg-sky-50/80 dark:bg-sky-950/50 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
              <Send className="h-3 w-3" />
              Sign in via Telegram
            </div>
          </div>

          <TelegramDeepLinkLogin intent="login" />

          <div className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              You&apos;ll confirm by tapping Start in Telegram. We only receive
              your Telegram ID.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      content: (
        <>
          {step === "phone" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 dark:border-emerald-700/50 bg-emerald-50/80 dark:bg-emerald-950/50 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <MessageCircle className="h-3 w-3" />
                  Sign in via WhatsApp
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Phone number
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 dark:text-slate-500">
                    +234
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="XXX XXX XXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && phoneNumber.trim())
                        handleSendOTP();
                    }}
                    disabled={isLoading}
                    className="h-12 pl-14 text-base"
                  />
                </div>
              </div>

              <Button
                className="h-12 w-full gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-base font-semibold shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]"
                onClick={handleSendOTP}
                disabled={!phoneNumber.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    Send verification code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  We&apos;ll send a 6-digit code to your WhatsApp. No password
                  needed.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtpDigits(["", "", "", "", "", ""]);
                    setError("");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Change number
                </button>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Enter the code sent to{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {phoneNumber}
                  </span>
                </p>
              </div>

              <div
                className="flex justify-center gap-2"
                onPaste={handleOtpPaste}
              >
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`Digit ${i + 1}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={isLoading}
                    className={`
                      h-13 w-11 rounded-xl border-2 bg-white dark:bg-slate-800 text-center text-xl font-bold
                      outline-none transition-all duration-150
                      ${
                        digit
                          ? "border-emerald-400 dark:border-emerald-500 text-slate-800 dark:text-slate-100 shadow-sm shadow-emerald-500/10"
                          : "border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100"
                      }
                      focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
                      disabled:opacity-50
                    `}
                  />
                ))}
              </div>

              <Button
                className="h-12 w-full gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-base font-semibold shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]"
                onClick={handleVerifyOTP}
                disabled={otpCode.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Verify & sign in
                  </>
                )}
              </Button>

              <div className="text-center">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Didn&apos;t get the code?{" "}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700 disabled:text-slate-400 dark:text-emerald-400 dark:hover:text-emerald-300 dark:disabled:text-slate-500"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend code"}
                </button>
              </div>
            </div>
          )}
        </>
      ),
    },
   
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 p-6 shadow-xl shadow-slate-900/5 dark:shadow-slate-900/30 backdrop-blur-xl">
      {/* Tab bar */}
      <div className="mb-5 flex border-b border-slate-200 dark:border-slate-700">
        {providers.map((provider) => {
          const Icon = provider.icon;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleTabChange(provider.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 pb-3 text-sm font-medium transition-colors ${
                activeTab === provider.id
                  ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {provider.label}
            </button>
          );
        })}
      </div>

      {/* Active provider content — fixed min-height so switching tabs doesn't shift layout */}
      <div className="min-h-[268px]">
        {providers.find((p) => p.id === activeTab)?.content}
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-4 animate-fade-in rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
