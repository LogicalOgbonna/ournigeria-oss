import { Suspense } from "react";
import Image from "next/image";
import { LoginFormWrapper } from "./LoginFormWrapper";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-400/10 dark:bg-emerald-400/5 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-emerald-500/8 dark:bg-emerald-500/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/6 dark:bg-amber-400/3 blur-3xl" />
      </div>

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        {/* Floating logo */}
        <div className="animate-fade-in-up mb-8 text-center">
          <Image
            src="/long_logo_dark.svg"
            alt="OurNigeria"
            width={250}
            height={70}
            className="mx-auto mb-2 hidden dark:block"
            priority
          />
          <Image
            src="/long_logo_dark.svg"
            alt="OurNigeria"
            width={250}
            height={70}
            className="mx-auto mb-2 block brightness-0 dark:hidden"
            priority
          />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Explore how Nigeria spends your money
          </p>
        </div>

        {/* Login card */}
        <div className="animate-fade-in-up stagger-2 w-full opacity-0">
          <Suspense>
            <LoginFormWrapper />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="animate-fade-in-up stagger-4 mt-8 text-center text-xs text-slate-400 dark:text-slate-500 opacity-0">
          Your data is private and never shared.
        </p>
      </div>
    </div>
  );
}
