"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { TelegramDeepLinkLogin } from "@/components/auth/TelegramDeepLinkLogin";
import { Show } from "@/components/ui/Show";
import posthog from "posthog-js";

export function OtpModal({ onVerified, onClose }: { onVerified: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<"telegram" | "whatsapp">("telegram");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const API_BASE = "/api";

  async function waitForSession() {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) return true;
      } catch {}

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return false;
  }

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleSendOtp() {
    const fullPhone = phone.startsWith("+") ? phone : `+234${phone.replace(/^0/, "")}`;
    if (fullPhone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send OTP"); return; }
      setStep("code");
      setCountdown(60);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const fullPhone = phone.startsWith("+") ? phone : `+234${phone.replace(/^0/, "")}`;
    const codeStr = code.join("");
    if (codeStr.length !== 6) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber: fullPhone, code: codeStr }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed"); return; }
      const userId = data.user?.id ?? data.userId;
      if (userId) posthog.identify(String(userId));
      onVerified();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || "";
    setCode(newCode);
  }

  // Auto-submit when all 6 digits entered
  const codeStr = code.join("");
  useEffect(() => {
    if (codeStr.length === 6 && step === "code" && !isLoading) {
      handleVerifyOtp();
    }
  }, [codeStr]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Verify to contribute
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Sign in to submit your proposal.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-5">
          <button
            type="button"
            onClick={() => { setTab("telegram"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 pb-3 text-sm font-medium transition-colors ${
              tab === "telegram"
                ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
            Telegram
          </button>
          <button
            type="button"
            onClick={() => { setTab("whatsapp"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 pb-3 text-sm font-medium transition-colors ${
              tab === "whatsapp"
                ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <Show when={!!error}>
            <div className="flex items-start gap-2 p-2.5 mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </Show>

          <Show when={tab === "telegram"}>
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 dark:border-sky-700/50 bg-sky-50/80 dark:bg-sky-950/50 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                  Sign in via Telegram
                </span>
              </div>
              <div className="flex min-h-[40px] items-center justify-center">
                <TelegramDeepLinkLogin
                  onAuthenticated={async () => {
                    setError(null);
                    const ok = await waitForSession();
                    if (ok) {
                      onVerified();
                    } else {
                      setError("Telegram login did not finish correctly. Please try again.");
                    }
                  }}
                />
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  You&apos;ll confirm by tapping Start in Telegram. We only receive your Telegram ID.
                </p>
              </div>
            </div>
          </Show>
          <Show when={tab !== "telegram" && step === "phone"}>
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 dark:border-emerald-700/50 bg-emerald-50/80 dark:bg-emerald-950/50 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Sign in via WhatsApp
                </span>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone number
                </label>
                <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                  <span className="flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-400 border-r border-slate-300 dark:border-slate-700">
                    +234
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Enter" && phone.length >= 7) handleSendOtp(); }}
                    placeholder="XXX XXX XXXX"
                    className="flex-1 px-3 py-3 text-sm bg-white dark:bg-slate-800 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading || phone.length < 7}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Show when={isLoading}><Loader2 className="w-4 h-4 animate-spin" /></Show>
                {isLoading ? "Sending code..." : "Send verification code"}
              </button>
              <div className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  We&apos;ll send a 6-digit code to your WhatsApp. No password needed.
                </p>
              </div>
            </div>
          </Show>
          <Show when={tab !== "telegram" && step !== "phone"}>
            <div className="space-y-4">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setCode(["","","","","",""]); setError(null); }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Change number
                </button>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Enter the code sent to{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    +234{phone}
                  </span>
                </p>
              </div>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    disabled={isLoading}
                    className={`h-12 w-10 rounded-xl border-2 bg-white dark:bg-slate-800 text-center text-xl font-bold outline-none transition-all ${
                      digit
                        ? "border-emerald-400 dark:border-emerald-500 shadow-sm shadow-emerald-500/10"
                        : "border-slate-200 dark:border-slate-600"
                    } text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={codeStr.length !== 6 || isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Show when={isLoading}><Loader2 className="w-4 h-4 animate-spin" /></Show>
                {isLoading ? "Verifying..." : "Verify & continue"}
              </button>
              <div className="text-center">
                <span className="text-xs text-slate-400">Didn&apos;t get the code? </span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 0 || isLoading}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 dark:text-emerald-400"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                </button>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
