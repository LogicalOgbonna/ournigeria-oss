import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { LOGIN_URL } from "@/lib/constants";

const tgBot =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ournigeria_dev_bot";
const telegramHref = `https://t.me/${tgBot}`;

type VariantShellProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  /** Short line under hero, e.g. "Spotlight: Lagos State" */
  spotlight?: string;
  children: React.ReactNode;
};

export function VariantShell({
  eyebrow,
  title,
  subtitle,
  spotlight,
  children,
}: VariantShellProps) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-border/40 pt-28 pb-16 sm:pt-32 sm:pb-20">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-background to-background dark:from-emerald-950/35 dark:via-background" />
          <div className="absolute top-[20%] right-[10%] h-72 w-72 rounded-full bg-emerald-400/10 blur-[90px] dark:bg-emerald-500/8" />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="mb-4 font-[family-name:var(--font-mono)] text-xs font-medium uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              {eyebrow}
            </p>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
              {title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
            {spotlight ? (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50/80 px-4 py-1.5 text-sm font-medium text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-200">
                <span className="font-[family-name:var(--font-mono)] text-xs text-amber-700/80 dark:text-amber-300/80">
                  spotlight
                </span>
                {spotlight}
              </p>
            ) : null}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href={LOGIN_URL}
                className="inline-flex items-center gap-2 rounded-[1.25rem] bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Start on the web
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[1.25rem] border border-border bg-card px-6 py-3.5 text-base font-medium text-foreground transition hover:bg-muted/60"
              >
                <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Ask on Telegram
              </a>
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Back to main site
              </Link>
            </div>
          </div>
        </section>

        <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="space-y-12 text-base leading-relaxed text-muted-foreground [&_h2]:mt-0 [&_h2]:scroll-mt-28 [&_h2]:font-[family-name:var(--font-heading)] [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-8 [&_h3]:font-[family-name:var(--font-heading)] [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/90">
            {children}
          </div>
        </article>

        <section className="border-y border-border/50 bg-emerald-50/40 py-12 dark:bg-emerald-950/20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center sm:px-6">
            <p className="font-[family-name:var(--font-heading)] text-xl font-semibold text-foreground">
              Ready to ask your first question?
            </p>
            <p className="max-w-xl text-sm text-muted-foreground">
              Every answer on OurNigeria is built to point you back to public
              sources—budget PDFs, GovSpend line items, FAAC tables, and
              anti-corruption filings—so you can verify, share, and follow up.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={LOGIN_URL}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500"
              >
                Open the app
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-medium"
              >
                Try Telegram
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

/** Inline stat card for variant pages */
export function VariantStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm">
      <p className="font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-mono)] text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs text-muted-foreground leading-snug">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
