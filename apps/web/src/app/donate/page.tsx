"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Check,
  Copy,
  Heart,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { apiUrl } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
}

interface Donation {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  isRecurring: boolean;
  createdAt: string;
}

interface DonationHistoryResponse {
  donations: Donation[];
  total: number;
  page: number;
  limit: number;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

type DonationType = "one-time" | "monthly";
type Provider = "PAYSTACK" | "FLUTTERWAVE" | "CRYPTO";

const AMOUNT_PRESETS = [
  { label: "\u20A6500", value: 50000 },
  { label: "\u20A61K", value: 100000 },
  { label: "\u20A65K", value: 500000 },
  { label: "\u20A610K", value: 1000000 },
  { label: "\u20A650K", value: 5000000 },
  { label: "Custom", value: 0 },
] as const;

const CRYPTO_WALLETS = [
  {
    label: "Ethereum / Base / Optimism",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f5bA16",
  },
  {
    label: "Solana",
    address: "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV",
  },
] as const;

const GIVETH_URL = "https://giveth.io/project/ournigeria";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  if (naira >= 1_000_000) return `\u20A6${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 1_000) return `\u20A6${(naira / 1_000).toFixed(naira % 1_000 === 0 ? 0 : 1)}K`;
  return `\u20A6${naira.toLocaleString("en-NG")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function DonatePage() {
  const router = useRouter();

  // Profile
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Form state
  const [donationType, setDonationType] = useState<DonationType>("one-time");
  const [selectedPreset, setSelectedPreset] = useState(2); // default: 5K
  const [customAmount, setCustomAmount] = useState("");
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState<Provider>("PAYSTACK");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<Donation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Copy feedback
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  /* ---- Fetch profile ---- */
  useEffect(() => {
    fetch(apiUrl("/api/auth/profile"), { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Profile) => {
        setProfile(data);
        if (data.email) setEmail(data.email);
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  /* ---- Fetch donation history ---- */
  const fetchHistory = useCallback(() => {
    setHistoryLoading(true);
    fetch(apiUrl("/api/donate/history"), { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: DonationHistoryResponse) => {
        setHistory(data.donations);
      })
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /* ---- Derived amount ---- */
  const isCustom = AMOUNT_PRESETS[selectedPreset].value === 0;
  const amountKobo = isCustom
    ? Math.round(parseFloat(customAmount || "0") * 100)
    : AMOUNT_PRESETS[selectedPreset].value;

  /* ---- Submit ---- */
  const handleDonate = async () => {
    if (provider === "CRYPTO") return; // crypto section is informational
    if (amountKobo < 10000) {
      setError("Minimum donation is \u20A6100");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(apiUrl("/api/donate/initialize"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountKobo,
          email,
          provider,
          callbackUrl: `${window.location.origin}/donate/success`,
          isRecurring: donationType === "monthly",
          donorName: profile?.name || undefined,
          currency: "NGN",
          userId: profile?.id || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { message?: string }).message || "Payment initialization failed"
        );
      }

      const data = (await res.json()) as {
        authorization_url: string;
        reference: string;
      };

      window.location.href = data.authorization_url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  };

  /* ---- Copy wallet address ---- */
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddr(address);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  /* ---- Status badge ---- */
  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      COMPLETED:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
      PENDING:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
      FAILED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          map[status] || map.PENDING
        }`}
      >
        {status}
      </span>
    );
  };

  /* ================================================================ */
  /* Render                                                            */
  /* ================================================================ */

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Donate
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-heading)] text-[1.75rem] font-bold leading-[1.25] text-slate-900 dark:text-white">
            Support OurNigeria
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Your donation keeps this platform free and helps track government
            spending across Nigeria.
          </p>
        </div>

        {/* One-time / Monthly toggle */}
        <div className="mb-6 flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
          {(["one-time", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setDonationType(t)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                donationType === t
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {t === "one-time" ? "One-time" : "Monthly"}
            </button>
          ))}
        </div>

        {/* Amount selector */}
        <div className="mb-6">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 font-[family-name:var(--font-mono)]">
            Amount
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {AMOUNT_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => setSelectedPreset(i)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  selectedPreset === i
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {isCustom && (
            <div className="mt-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-[family-name:var(--font-mono)]">
                  {"\u20A6"}
                </span>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount in Naira"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors font-[family-name:var(--font-mono)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="mb-6">
          <label
            htmlFor="donate-email"
            className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            Email for receipt
          </label>
          <input
            id="donate-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={profileLoading}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50"
          />
        </div>

        {/* Payment method */}
        <div className="mb-6">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 font-[family-name:var(--font-mono)]">
            Payment method
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                { key: "PAYSTACK", label: "Paystack", desc: "Cards, Bank, USSD" },
                {
                  key: "FLUTTERWAVE",
                  label: "Flutterwave",
                  desc: "Cards, Bank, Mobile",
                },
                { key: "CRYPTO", label: "Crypto", desc: "ETH, SOL, USDC" },
              ] as const
            ).map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => setProvider(key)}
                className={`flex flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors ${
                  provider === key
                    ? "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    provider === key
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {label}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Crypto section (shown when Crypto is selected) */}
        {provider === "CRYPTO" && (
          <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Donate with Crypto
              </h3>
            </div>

            {/* Giveth link */}
            <a
              href={GIVETH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 mb-4 group transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
            >
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Donate via Giveth
                </p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-500 mt-0.5">
                  Tax-deductible crypto donations
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Wallet addresses */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Or send directly to our wallets:
            </p>
            <div className="space-y-2">
              {CRYPTO_WALLETS.map((w) => (
                <div
                  key={w.address}
                  className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3"
                >
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {w.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate text-xs text-slate-500 dark:text-slate-400 font-[family-name:var(--font-mono)]">
                      {w.address}
                    </code>
                    <button
                      onClick={() => copyAddress(w.address)}
                      className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title="Copy address"
                    >
                      {copiedAddr === w.address ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Donate button (hidden for crypto) */}
        {provider !== "CRYPTO" && (
          <button
            onClick={handleDonate}
            disabled={submitting || amountKobo < 10000}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Heart className="h-4 w-4" />
                Donate {amountKobo >= 10000 ? formatNaira(amountKobo) : ""}
                {donationType === "monthly" ? " / month" : ""}
              </>
            )}
          </button>
        )}

        {/* ---- Donation History ---- */}
        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Donation History
          </h2>

          {historyLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-700 py-12 text-center">
              <Heart className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You haven&apos;t donated yet.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Your first donation keeps OurNigeria free.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Date
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Provider
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((d) => (
                    <tr
                      key={d.id}
                      className="bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium font-[family-name:var(--font-mono)] text-slate-800 dark:text-slate-100">
                        {formatNaira(d.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400 capitalize">
                        {d.provider.toLowerCase()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {statusBadge(d.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
