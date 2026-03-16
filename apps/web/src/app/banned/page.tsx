"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldX } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function BannedPage() {
  const router = useRouter();
  const [reason] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("ban_reason");
    }
    return null;
  });

  useEffect(() => {
    // Re-check ban status — if unbanned, redirect to home
    fetch(apiUrl("/api/auth/profile"), { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          sessionStorage.removeItem("ban_reason");
          router.replace("/");
        }
      })
      .catch(() => {});
  }, [router]);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-400/10 dark:bg-red-400/5 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-red-500/8 dark:bg-red-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/25">
          <ShieldX className="h-8 w-8 text-white" />
        </div>

        <h1 className="font-[var(--font-heading)] text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Account Suspended
        </h1>

        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          {reason ||
            "Your account has been suspended due to a violation of our usage policies."}
        </p>

        <div className="mt-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 w-full">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            If you believe this is a mistake, please contact us at{" "}
            <a
              href="mailto:support@ournigeria.ng"
              className="text-emerald-600 dark:text-emerald-400 underline"
            >
              support@ournigeria.ng
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
