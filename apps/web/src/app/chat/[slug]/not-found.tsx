import Link from "next/link";
import { Sparkles, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ChatNotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-400/10 dark:bg-emerald-400/5 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-emerald-500/8 dark:bg-emerald-500/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/6 dark:bg-amber-400/3 blur-3xl" />
      </div>

      {/* Dot grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-[var(--font-heading)] text-base font-bold text-slate-800 dark:text-slate-100">
              Our
              <span className="text-emerald-600 dark:text-emerald-400">
                Nigeria
              </span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Center content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4">
        <div className="flex max-w-md flex-col items-center text-center">
          {/* Icon */}
          <div className="animate-fade-in-up mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-sm">
            <EyeOff className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in-up stagger-1 font-[var(--font-heading)] text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 opacity-0">
            This conversation is private
          </h1>

          {/* Subtext */}
          <p className="animate-fade-in-up stagger-2 mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 opacity-0">
            The owner has made this conversation private and it&apos;s no longer
            publicly accessible.
          </p>

          {/* CTA */}
          <Link
            href="/"
            className="animate-fade-in-up stagger-3 mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-emerald-500 hover:to-emerald-600 hover:shadow-md opacity-0"
          >
            <Sparkles className="h-4 w-4" />
            Explore Nigerian Budgets
          </Link>

          {/* Footer note */}
          <p className="animate-fade-in-up stagger-4 mt-10 text-xs text-slate-400 dark:text-slate-500 opacity-0">
            Public conversations can be toggled by their owners at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
