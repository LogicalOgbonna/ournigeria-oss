"use client";

import { useState, useCallback } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import {
  Heart,
  CreditCard,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

type DonationType = "one-time" | "monthly";
type PaymentProvider = "paystack" | "flutterwave";

interface PresetAmount {
  label: string;
  kobo: number;
}

const PRESET_AMOUNTS: PresetAmount[] = [
  { label: "\u20A6500", kobo: 50000 },
  { label: "\u20A61,000", kobo: 100000 },
  { label: "\u20A65,000", kobo: 500000 },
  { label: "\u20A610,000", kobo: 1000000 },
  { label: "\u20A650,000", kobo: 5000000 },
];

const CRYPTO_WALLETS = [
  // { network: "Ethereum (ETH)", address: "0x1234567890abcdef1234567890abcdef12345678" },
  // { network: "Bitcoin (BTC)", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
  // { network: "USDT (TRC-20)", address: "TXyz1234567890abcdefghijklmnopqrst" },
  { network: "Solana (SOL)", address: "4F7M9tEkmbSpBHbeG8mq55J3NsSyD9h6XdAjReDc9kP1" },
];

export default function DonatePage() {
  const [donationType, setDonationType] = useState<DonationType>("monthly");
  const [selectedAmount, setSelectedAmount] = useState<number>(500000);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [email, setEmail] = useState("");
  const [donorName, setDonorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCryptoAddresses, setShowCryptoAddresses] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const amountInKobo = isCustom
    ? Math.round(Number.parseFloat(customAmount || "0") * 100)
    : selectedAmount;

  const handleAmountSelect = (kobo: number) => {
    setIsCustom(false);
    setSelectedAmount(kobo);
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setCustomAmount("");
  };

  const handleCopyAddress = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  }, []);

  const handleDonate = async (provider: PaymentProvider) => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (amountInKobo < 10000) {
      setError("Minimum donation is \u20A6100.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/donate/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInKobo,
          email,
          provider: provider.toUpperCase(),
          callbackUrl: `${window.location.origin}/donate/success`,
          isRecurring: donationType === "monthly",
          donorName: donorName || undefined,
          currency: "NGN",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to initialize payment. Please try again.");
      }

      const data = await res.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment URL returned. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[oklch(0.10_0.005_160)]">
      <Navbar />

      {/* Impact Hero Section */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5">
            <Heart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-[family-name:var(--font-mono)] text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Support the Mission
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-serif)] text-4xl text-slate-900 dark:text-white leading-tight">
            Help Us Track Every Naira
          </h1>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <p className="font-[family-name:var(--font-mono)] text-2xl font-medium text-emerald-600 dark:text-emerald-400">
                708K+
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Documents</p>
            </div>
            <div className="text-center">
              <p className="font-[family-name:var(--font-mono)] text-2xl font-medium text-emerald-600 dark:text-emerald-400">
                37
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">States</p>
            </div>
            <div className="text-center">
              <p className="font-[family-name:var(--font-mono)] text-2xl font-medium text-emerald-600 dark:text-emerald-400">
                Free for All
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Always</p>
            </div>
          </div>

          <p className="mt-6 text-slate-500 dark:text-slate-400 leading-relaxed">
            Every donation keeps this platform free for all Nigerians
          </p>
        </div>
      </section>

      {/* Donation Form Section */}
      <section className="relative pb-16 sm:pb-20">
        <div className="mx-auto max-w-lg px-6">
          {/* One-time / Monthly Toggle */}
          <div className="mb-8 flex items-center justify-center">
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 p-1">
              <button
                onClick={() => setDonationType("one-time")}
                className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                  donationType === "one-time"
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                One-time
              </button>
              <button
                onClick={() => setDonationType("monthly")}
                className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                  donationType === "monthly"
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Amount Selector */}
          <div className="mb-6">
            <label className="mb-3 block font-[family-name:var(--font-mono)] text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Select Amount
            </label>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset.kobo}
                  onClick={() => handleAmountSelect(preset.kobo)}
                  disabled={loading}
                  className={`h-12 rounded-xl border text-sm font-medium transition-all font-[family-name:var(--font-mono)] sm:flex-1 ${
                    !isCustom && selectedAmount === preset.kobo
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/20"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={handleCustomSelect}
                disabled={loading}
                className={`h-12 rounded-xl border text-sm font-medium transition-all sm:flex-1 ${
                  isCustom
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/20"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                Custom
              </button>
            </div>

            {isCustom && (
              <div className="mt-3 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  {"\u20A6"}
                </span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  disabled={loading}
                  min="100"
                  className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 pl-8 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>
            )}
          </div>

          {/* Email Input */}
          <div className="mb-4">
            <label className="mb-2 block font-[family-name:var(--font-mono)] text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Email Address <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          {/* Name Input */}
          <div className="mb-8">
            <label className="mb-2 block font-[family-name:var(--font-mono)] text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Your Name <span className="text-slate-400 dark:text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="How should we call you?"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              disabled={loading}
              className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Payment Methods */}
          <div className="space-y-4">
            <label className="block font-[family-name:var(--font-mono)] text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payment Method
            </label>

            {/* Paystack */}
            <button
              onClick={() => handleDonate("paystack")}
              disabled={loading}
              className="group relative flex h-14 w-full items-center justify-center gap-3 rounded-xl border-2 border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/5 px-6 text-slate-900 dark:text-white transition-all hover:border-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium">Pay with Paystack</span>
                  <span className="ml-auto font-[family-name:var(--font-mono)] text-sm text-emerald-600 dark:text-emerald-400">
                    Recommended
                  </span>
                </>
              )}
            </button>

            {/* Flutterwave */}
            <button
              onClick={() => handleDonate("flutterwave")}
              disabled={loading}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-6 text-slate-900 dark:text-white transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  <span className="font-medium">Pay with Flutterwave</span>
                </>
              )}
            </button>

            {/* Crypto */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
              <h3 className="mb-3 font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900 dark:text-white">
                Donate with Crypto
              </h3>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Support us using cryptocurrency through Giveth or direct transfers.
              </p>

              <a
                href="https://giveth.io/project/our-nigeria"
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 font-medium text-slate-900 dark:text-white transition-all hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Donate via Giveth
                <ExternalLink className="h-4 w-4" />
              </a>

              <button
                onClick={() => setShowCryptoAddresses(!showCryptoAddresses)}
                className="flex w-full items-center justify-between text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
              >
                <span>Or send directly</span>
                {showCryptoAddresses ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showCryptoAddresses && (
                <div className="mt-4 space-y-3">
                  {CRYPTO_WALLETS.map((wallet) => (
                    <div
                      key={wallet.network}
                      className="rounded-lg border border-slate-100 dark:border-slate-600/50 bg-slate-50 dark:bg-slate-900/50 p-3"
                    >
                      <p className="mb-1 font-[family-name:var(--font-mono)] text-xs text-slate-500 dark:text-slate-400">
                        {wallet.network}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate font-[family-name:var(--font-mono)] text-xs text-slate-700 dark:text-slate-300">
                          {wallet.address}
                        </code>
                        <button
                          onClick={() => handleCopyAddress(wallet.address)}
                          className="flex-shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white"
                          title="Copy address"
                        >
                          {copiedAddress === wallet.address ? (
                            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-8">
            <blockquote className="font-[family-name:var(--font-serif)] text-xl italic text-slate-800 dark:text-white leading-relaxed">
              &ldquo;100% of your donation goes directly to keeping OurNigeria running &mdash;
              server costs, AI processing, and data infrastructure. No salaries, no overhead.
              Just transparency.&rdquo;
            </blockquote>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                <span>Hosting & Infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                <span>AI & Embeddings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                <span>Data Processing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
