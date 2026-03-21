"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Copy,
  Check,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface VerifyResponse {
  status: "success" | "pending" | "failed";
  amount?: number;
  currency?: string;
  reference?: string;
  donorName?: string;
}

function DonateSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [state, setState] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!reference) {
      setState("error");
      setErrorMessage("No payment reference found.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/donate/verify/${reference}`);

        if (!res.ok) {
          throw new Error("Failed to verify payment.");
        }

        const result: VerifyResponse = await res.json();

        if (result.status === "success") {
          setState("success");
          setData(result);
        } else if (result.status === "pending") {
          setState("pending");
          setData(result);
        } else {
          setState("error");
          setErrorMessage("Payment was not successful. Please try again.");
        }
      } catch {
        setState("error");
        setErrorMessage("Could not verify your payment. Please contact support if you were charged.");
      }
    };

    verify();
  }, [reference]);

  const formatAmount = (kobo: number) => {
    const naira = kobo / 100;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(naira);
  };

  const shareText = "I just donated to OurNigeria - helping make government spending transparent for every Nigerian! Join me:";
  const shareUrl = "https://ournigeria.ng/donate";

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, []);

  return (
    <main className="min-h-screen dark bg-[oklch(0.10_0.005_160)] text-white">
      <Navbar />

      <section className="relative flex min-h-[70vh] items-center justify-center pt-32 pb-16">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[120px]" />

        <div className="relative mx-auto max-w-lg px-6 text-center">
          {/* Loading State */}
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
              <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-white">
                Verifying your payment...
              </h2>
              <p className="text-sm text-slate-400">
                Please wait while we confirm your donation.
              </p>
            </div>
          )}

          {/* Success State */}
          {state === "success" && (
            <div className="flex flex-col items-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-400" />

              <h1 className="mt-6 font-[family-name:var(--font-serif)] text-4xl text-white">
                Thank You!
              </h1>

              {data?.amount && (
                <p className="mt-4 font-[family-name:var(--font-mono)] text-3xl font-medium text-emerald-400">
                  {formatAmount(data.amount)}
                </p>
              )}

              <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                You don help us well well! Na people like you dey keep OurNigeria running.
              </p>

              {/* What the donation funds */}
              <div className="mt-8 w-full rounded-xl border border-slate-700 bg-slate-800/30 p-6 text-left">
                <h3 className="mb-4 font-[family-name:var(--font-heading)] text-sm font-semibold text-white uppercase tracking-wider">
                  Your donation helps fund:
                </h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                    Server infrastructure to keep the platform online 24/7
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                    AI processing costs for analyzing budget documents
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                    Vector embeddings for searching 708K+ documents
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                    Expanding coverage to more states and data sources
                  </li>
                </ul>
              </div>

              {/* Share Buttons */}
              <div className="mt-8 w-full">
                <p className="mb-4 font-[family-name:var(--font-mono)] text-xs text-slate-400 uppercase tracking-wider">
                  Spread the word
                </p>
                <div className="flex items-center justify-center gap-3">
                  {/* Twitter/X */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-5 text-sm text-slate-300 transition-all hover:border-slate-600 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-5 text-sm text-slate-300 transition-all hover:border-slate-600 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>

                  {/* Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    className="flex h-12 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-5 text-sm text-slate-300 transition-all hover:border-slate-600 hover:text-white"
                  >
                    {linkCopied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {linkCopied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>

              {/* Donate Again */}
              <Link
                href="/donate"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-600 px-8 font-medium text-white transition-all hover:bg-emerald-500"
              >
                Donate Again
              </Link>
            </div>
          )}

          {/* Pending State */}
          {state === "pending" && (
            <div className="flex flex-col items-center gap-4">
              <Clock className="h-16 w-16 text-yellow-400" />

              <h2 className="font-[family-name:var(--font-serif)] text-3xl text-white">
                Still Processing
              </h2>

              <p className="text-slate-300 leading-relaxed">
                Your payment is still being processed. This usually takes a few moments.
                Please check back shortly.
              </p>

              {reference && (
                <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-slate-500">
                  Reference: {reference}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-6 text-sm text-white transition-all hover:border-slate-600"
                >
                  <Loader2 className="h-4 w-4" />
                  Check Again
                </button>
                <Link
                  href="/donate"
                  className="inline-flex h-12 items-center rounded-xl bg-emerald-600 px-6 text-sm font-medium text-white transition-all hover:bg-emerald-500"
                >
                  Back to Donate
                </Link>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-16 w-16 text-red-400" />

              <h2 className="font-[family-name:var(--font-serif)] text-3xl text-white">
                Something Went Wrong
              </h2>

              <p className="text-slate-300 leading-relaxed">
                {errorMessage}
              </p>

              {reference && (
                <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-slate-500">
                  Reference: {reference}
                </p>
              )}

              <Link
                href="/donate"
                className="mt-6 inline-flex h-12 items-center rounded-xl bg-emerald-600 px-8 font-medium text-white transition-all hover:bg-emerald-500"
              >
                Try Again
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function DonateSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen dark bg-[oklch(0.10_0.005_160)] text-white">
          <Navbar />
          <section className="flex min-h-[70vh] items-center justify-center pt-32 pb-16">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
              <p className="text-slate-400">Loading...</p>
            </div>
          </section>
          <Footer />
        </main>
      }
    >
      <DonateSuccessContent />
    </Suspense>
  );
}
