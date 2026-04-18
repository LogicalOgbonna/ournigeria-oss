import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Database,
  Quote,
  Send,
  Shield,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { LOGIN_URL, STATS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const telegramHref = `https://t.me/${
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ournigeria_dev_bot"
}`;

export function VariantFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground antialiased",
        className
      )}
    >
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

export function VariantBackdrop({
  tone = "emerald",
  className,
}: {
  tone?: "emerald" | "neutral" | "warm";
  className?: string;
}) {
  const tint =
    tone === "warm"
      ? "from-amber-100/50 via-background to-background dark:from-amber-950/25"
      : tone === "neutral"
        ? "from-muted/40 via-background to-background dark:from-muted/15"
        : "from-emerald-50/70 via-background to-background dark:from-emerald-950/35";

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-b", tint)} />
      <div className="absolute top-[12%] right-[6%] h-80 w-80 rounded-full bg-emerald-400/10 blur-[100px] dark:bg-emerald-500/10" />
      <div className="absolute bottom-[8%] left-[4%] h-96 w-96 rounded-full bg-emerald-500/8 blur-[110px] dark:bg-emerald-400/6" />
      {tone === "warm" ? (
        <div className="absolute top-[40%] left-[30%] h-64 w-64 rounded-full bg-amber-400/8 blur-[90px] dark:bg-amber-500/10" />
      ) : null}
    </div>
  );
}

export function KitContainer({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function KitOverline({ children }: { children: ReactNode }) {
  return (
    <p className="font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
      {children}
    </p>
  );
}

export function KitBackLink() {
  return (
    <KitContainer className="pt-24">
      <Link
        href="/landing-variants"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <span className="font-[family-name:var(--font-mono)] text-xs">
          ←
        </span>
        All variants
      </Link>
    </KitContainer>
  );
}

export function KitCtaRow({ className }: { className?: string }) {
  return (
    <div className={cn("mt-10 flex flex-wrap items-center gap-3", className)}>
      <Button
        asChild
        className="h-12 rounded-2xl bg-emerald-600 px-7 text-base font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
      >
        <a href={LOGIN_URL}>
          Open the app
          <ArrowRight className="h-4 w-4" />
        </a>
      </Button>
      <Button asChild variant="outline" className="h-12 rounded-2xl px-6 text-base">
        <a href={telegramHref} target="_blank" rel="noopener noreferrer">
          <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Telegram
        </a>
      </Button>
      <Link
        href="/"
        className="ml-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Main site
      </Link>
    </div>
  );
}

export function KitTrustStrip() {
  return (
    <div className="mt-14 grid gap-4 border-y border-border/60 py-8 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map((s) => (
        <div key={s.label} className="flex flex-col gap-1">
          <p className="font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {s.label}
          </p>
          <p className="font-[family-name:var(--font-mono)] text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
            {s.value}
            {s.suffix}
          </p>
          <p className="text-xs text-muted-foreground">{s.pidgin}</p>
        </div>
      ))}
    </div>
  );
}

export function KitSearchMock({
  label,
  query,
  footnote,
}: {
  label: string;
  query: string;
  footnote?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-1 shadow-xl shadow-black/5 backdrop-blur-md dark:bg-card/50">
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        <span className="ml-3 font-[family-name:var(--font-mono)] text-[10px] text-muted-foreground">
          app.ournigeria.ng
        </span>
      </div>
      <div className="space-y-3 px-4 py-5 sm:px-6 sm:py-6">
        <p className="font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/25 bg-emerald-50/40 px-4 py-3 dark:bg-emerald-950/25">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium leading-relaxed text-foreground">
              {query}
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-500/70" />
          </div>
        </div>
        {footnote ? (
          <p className="text-xs text-muted-foreground">{footnote}</p>
        ) : null}
      </div>
    </div>
  );
}

export function KitChatMock({
  user,
  reply,
  source,
}: {
  user: string;
  reply: ReactNode;
  source: string;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-card/90 shadow-2xl shadow-black/10 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/50">
          <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <CardTitle className="font-[family-name:var(--font-heading)] text-base">
            Our Nigeria
          </CardTitle>
          <CardDescription className="font-[family-name:var(--font-mono)] text-[11px] text-emerald-600 dark:text-emerald-400">
            assistant · sourced answers
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-emerald-600 px-4 py-3 text-sm text-white shadow-sm dark:bg-emerald-500">
          {user}
        </div>
        <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-border/50 bg-muted/50 px-4 py-3 text-sm leading-relaxed backdrop-blur-sm">
          {reply}
          <p className="mt-3 font-[family-name:var(--font-mono)] text-[10px] text-muted-foreground">
            src: {source}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export type BarDatum = { label: string; value: number; color: string };

export function KitHorizontalBars({
  title,
  data,
  footnote,
  className,
}: {
  title: string;
  data: BarDatum[];
  footnote?: string;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-[family-name:var(--font-heading)] text-lg font-semibold">
          {title}
        </p>
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mt-6 space-y-4">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{d.label}</span>
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-muted-foreground">
                {d.value}%
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  backgroundColor: d.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      {footnote ? (
        <p className="mt-5 text-xs text-muted-foreground">{footnote}</p>
      ) : null}
    </div>
  );
}

export function KitMiniKpis({
  items,
}: {
  items: { label: string; value: string; hint?: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm"
        >
          <p className="font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-2 font-[family-name:var(--font-mono)] text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-2 text-xs leading-snug text-muted-foreground">
              {item.hint}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function KitTestimonials({
  items,
}: {
  items: { quote: string; name: string; role: string }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {items.map((t) => (
        <figure
          key={t.name}
          className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm"
        >
          <Quote className="h-8 w-8 text-emerald-600/30 dark:text-emerald-400/30" />
          <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
            {t.quote}
          </blockquote>
          <figcaption className="mt-6 border-t border-border/50 pt-4">
            <p className="font-[family-name:var(--font-heading)] text-sm font-semibold">
              {t.name}
            </p>
            <p className="text-xs text-muted-foreground">{t.role}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function KitFeatureGrid({
  items,
}: {
  items: { title: string; body: string; icon?: ReactNode }[];
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {items.map((f) => (
        <div
          key={f.title}
          className="group rounded-2xl border border-border/60 bg-gradient-to-br from-card/90 to-card/40 p-6 shadow-sm transition hover:border-emerald-500/30"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {f.icon ?? <Database className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-[family-name:var(--font-heading)] text-lg font-semibold">
                {f.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function KitChecklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function KitCtaBand({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="border-y border-emerald-900/10 bg-emerald-50/50 py-16 dark:border-emerald-500/10 dark:bg-emerald-950/25">
      <KitContainer className="flex flex-col items-center gap-5 text-center">
        <Shield className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
        <h2 className="max-w-2xl font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button
            asChild
            className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-semibold hover:bg-emerald-700 dark:bg-emerald-500"
          >
            <a href={LOGIN_URL}>
              Start free
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl px-6 text-sm">
            <a href={telegramHref} target="_blank" rel="noopener noreferrer">
              Ask on Telegram
            </a>
          </Button>
        </div>
      </KitContainer>
    </section>
  );
}

export function KitDashboardMock({
  title,
  region,
  kpis,
  bars,
  hideBadge,
}: {
  title: string;
  region: string;
  kpis: { label: string; value: string; delta?: string }[];
  bars: BarDatum[];
  hideBadge?: boolean;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-gradient-to-b from-card to-card/40 p-6 shadow-2xl shadow-black/10 backdrop-blur-md">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <p className="font-[family-name:var(--font-heading)] text-xl font-semibold">
            {title}
          </p>
          <p className="text-sm text-muted-foreground">{region}</p>
        </div>
        {!hideBadge && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            Sample figures for demo layout
          </span>
        )}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border/50 bg-background/60 px-4 py-3"
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {k.label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-mono)] text-lg font-semibold text-emerald-700 dark:text-emerald-400">
              {k.value}
            </p>
            {k.delta ? (
              <p className="mt-1 text-[11px] text-muted-foreground">{k.delta}</p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-6">
        <KitHorizontalBars
          title="Sector emphasis (illustrative)"
          data={bars}
          footnote="Bars visualize composition for this landing mock—not live API output."
        />
      </div>
    </div>
  );
}

export function KitPidginBlock({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/50 p-6 dark:bg-emerald-950/30">
      <p className="font-[family-name:var(--font-heading)] text-lg font-semibold text-emerald-900 dark:text-emerald-100">
        {title}
      </p>
      <p className="mt-3 text-base leading-relaxed text-emerald-950/90 dark:text-emerald-50/90">
        {body}
      </p>
    </div>
  );
}

export function KitSectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {kicker ? <KitOverline>{kicker}</KitOverline> : null}
      <h2 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function KitCompareColumns({
  columns,
}: {
  columns: { title: string; tag?: string; rows: { label: string; value: string }[] }[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {columns.map((col) => (
        <div
          key={col.title}
          className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-[family-name:var(--font-heading)] text-lg font-semibold">
              {col.title}
            </p>
            {col.tag ? (
              <span className="rounded-full bg-muted px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {col.tag}
              </span>
            ) : null}
          </div>
          <dl className="mt-5 space-y-4">
            {col.rows.map((r) => (
              <div
                key={r.label}
                className="flex flex-col gap-1 border-b border-border/40 pb-3 last:border-0 last:pb-0"
              >
                <dt className="text-xs font-medium text-muted-foreground">
                  {r.label}
                </dt>
                <dd className="font-[family-name:var(--font-mono)] text-sm font-semibold text-foreground">
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
