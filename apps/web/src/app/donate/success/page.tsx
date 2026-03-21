"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle, ArrowLeft, Heart } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface DonationResult {
  status: string;
  amount: number;
  currency: string;
  provider: string;
  isRecurring: boolean;
  createdAt: string;
}

function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return `\u20A6${naira.toLocaleString("en-NG")}`;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const [donation, setDonation] = useState<DonationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!reference) {
      setTimeout(() => {
        setLoading(false);
        setError(true);
      }, 0);
      return;
    }

    fetch(apiUrl(`/api/donate/verify/${reference}`), { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to verify donation. Please try again.");
        return r.json();
      })
      .then((data: DonationResult) => {
        setDonation(data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [reference]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Verifying your donation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
            <button
              onClick={() => router.push("/donate")}
              className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4 mb-4">
              <XCircle className="h-10 w-10 text-red-500 dark:text-red-400" />
            </div>
            <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-slate-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              We couldn&apos;t verify your donation. If you were charged, please
              contact us and we&apos;ll sort it out.
            </p>
            <button
              onClick={() => router.push("/donate")}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = donation.status === "COMPLETED";

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Donation
          </span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center text-center max-w-sm">
          {/* Icon */}
          <div
            className={`rounded-full p-4 mb-5 ${
              isSuccess
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : "bg-amber-100 dark:bg-amber-900/30"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Loader2 className="h-12 w-12 text-amber-500 dark:text-amber-400" />
            )}
          </div>

          {/* Title */}
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {isSuccess ? "Thank you!" : "Payment Processing"}
          </h1>

          {/* Amount */}
          <p className="text-3xl font-bold font-[family-name:var(--font-mono)] text-emerald-600 dark:text-emerald-400 mb-2">
            {formatNaira(donation.amount)}
          </p>

          {/* Description */}
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            {isSuccess
              ? "Your donation has been received. You're helping keep government spending transparent for all Nigerians."
              : "Your payment is still being processed. It should be confirmed shortly."}
          </p>

          {donation.isRecurring && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-4">
              Monthly recurring donation
            </p>
          )}

          {/* Reference */}
          <p className="text-xs text-slate-400 dark:text-slate-500 font-[family-name:var(--font-mono)] mb-8">
            Ref: {reference}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Back to Chat
            </button>
            <button
              onClick={() => router.push("/donate")}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Heart className="h-4 w-4" />
              Donate Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DonateSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
