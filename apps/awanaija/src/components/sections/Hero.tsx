"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Bot,
  TrendingUp,
  FileText,
  MessageCircle,
  Globe,
  Send,
  X,
} from "lucide-react";
import { LOGIN_URL } from "@/lib/constants";
import posthog from "posthog-js";

export function Hero() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close the channel dropdown when the user scrolls away from it.
  useEffect(() => {
    if (!isDropdownOpen) return;
    const close = () => setIsDropdownOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [isDropdownOpen]);

  return (
    <section
      className="relative min-h-[78dvh] overflow-hidden lg:min-h-[100dvh]"
    >
      {/* Deep gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/40 dark:via-background" />

      {/* Floating orbs */}
      <div className="absolute top-[15%] left-[8%] h-80 w-80 rounded-full bg-emerald-400/12 blur-[100px] animate-orb-1 dark:bg-emerald-400/6" />
      <div className="absolute bottom-[10%] right-[5%] h-[28rem] w-[28rem] rounded-full bg-emerald-500/8 blur-[120px] animate-orb-2 dark:bg-emerald-500/4" />
      <div className="absolute top-[40%] left-[50%] h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-300/8 blur-[80px] animate-orb-3 dark:bg-emerald-300/4" />

      <div
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="flex min-h-[78dvh] flex-col items-center justify-center gap-16 pb-16 pt-28 lg:min-h-[100dvh] lg:flex-row lg:items-center lg:justify-between lg:pb-0 lg:pt-0">
          {/* Left — Text content, pushed bottom-left on desktop */}
          <div className="flex max-w-2xl flex-col items-center text-center lg:items-start lg:text-left">

            {/* Headline — Carousel */}
            {/* LCP element — renders at full opacity immediately (no entrance fade) so
                Largest Contentful Paint isn't delayed by the animation. */}
            <div className="hero-line group relative h-[90px] sm:h-[180px] lg:h-[200px] w-full mt-2 mb-4 max-w-[95vw] lg:max-w-none overflow-hidden">
              <div
                className="absolute left-0 top-0 flex flex-col w-full animate-[carousel-headline_20s_linear_infinite]"
                style={{
                  animationTimingFunction: "cubic-bezier(0.8, 0, 0.2, 1)",
                }}
              >
                <h1 className="sr-only">Our Nigeria - Nigerian Budget, FAAC, and Civic Data Tracker</h1>
                {/* Item 1 */}
                <div className="w-full shrink-0 flex flex-col justify-center h-[90px] sm:h-[180px] lg:h-[200px] font-[family-name:var(--font-heading)] leading-[1.05] tracking-tight perspective-[1200px] items-center lg:items-start text-center lg:text-left gap-0 sm:gap-2">
                  <span className="block text-[1.4rem] font-medium text-muted-foreground sm:text-4xl lg:text-4xl transition-transform duration-500 group-hover:rotate-x-12 group-hover:translate-y-[-2px] pb-1 sm:pb-0">
                    To Fix Am,
                  </span>
                  <span className="block bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 bg-clip-text text-transparent font-[family-name:var(--font-serif)] text-[2.6rem] italic sm:text-7xl lg:text-[4rem] dark:from-emerald-300 dark:via-emerald-400 dark:to-emerald-200 transition-transform duration-500 group-hover:-rotate-y-6 group-hover:scale-105 origin-center lg:origin-left leading-[1.1] sm:leading-none relative">
                    We Must Know Am.
                  </span>
                </div>

                {/* Item 2 */}
                <div className="w-full shrink-0 flex flex-col justify-center h-[90px] sm:h-[180px] lg:h-[200px] font-[family-name:var(--font-heading)] leading-[1.05] tracking-tight perspective-[1200px] items-center lg:items-start text-center lg:text-left gap-0 sm:gap-2">
                  <span className="block text-[1.4rem] font-medium text-muted-foreground sm:text-4xl lg:text-4xl transition-transform duration-500 group-hover:rotate-x-12 group-hover:translate-y-[-2px] pb-1 sm:pb-0">
                    Together, For
                  </span>
                  <span className="block bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 bg-clip-text text-transparent font-[family-name:var(--font-serif)] text-[2.6rem] italic sm:text-7xl lg:text-[5.5rem] dark:from-emerald-300 dark:via-emerald-400 dark:to-emerald-200 transition-transform duration-500 group-hover:-rotate-y-6 group-hover:scale-105 origin-center lg:origin-left leading-[1.1] sm:leading-none relative">
                    Our Nigeria.
                  </span>
                </div>

                {/* Item 3 */}
                <div className="w-full shrink-0 flex flex-col justify-center h-[90px] sm:h-[180px] lg:h-[200px] font-[family-name:var(--font-heading)] leading-[1.05] tracking-tight perspective-[1200px] items-center lg:items-start text-center lg:text-left gap-0 sm:gap-2">
                  <span className="block text-[1.4rem] font-medium text-muted-foreground sm:text-4xl lg:text-4xl transition-transform duration-500 group-hover:rotate-x-12 group-hover:translate-y-[-2px] pb-1 sm:pb-0">
                    The Power Dey Your Hand,
                  </span>
                  <span className="block bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 bg-clip-text text-transparent font-[family-name:var(--font-serif)] text-[2.2rem] italic sm:text-7xl lg:text-[5.5rem] dark:from-emerald-300 dark:via-emerald-400 dark:to-emerald-200 transition-transform duration-500 group-hover:-rotate-y-6 group-hover:scale-105 origin-center lg:origin-left leading-[1.1] sm:leading-none relative">
                    Use Am.
                  </span>
                </div>

                {/* Item 4 */}
                <div className="w-full shrink-0 flex flex-col justify-center h-[90px] sm:h-[180px] lg:h-[200px] font-[family-name:var(--font-heading)] leading-[1.05] tracking-tight perspective-[1200px] items-center lg:items-start text-center lg:text-left gap-0 sm:gap-2">
                  <span className="block text-[1.4rem] font-medium text-muted-foreground sm:text-4xl lg:text-4xl transition-transform duration-500 group-hover:rotate-x-12 group-hover:translate-y-[-2px] pb-1 sm:pb-0">
                    Follow Your LGA Money,
                  </span>
                  <span className="block bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 bg-clip-text text-transparent font-[family-name:var(--font-serif)] text-[2.6rem] italic sm:text-7xl lg:text-[5.5rem] dark:from-emerald-300 dark:via-emerald-400 dark:to-emerald-200 transition-transform duration-500 group-hover:-rotate-y-6 group-hover:scale-105 origin-center lg:origin-left leading-[1.1] sm:leading-none relative">
                    No Gree.
                  </span>
                </div>

                {/* Item 1 Duplicate (for seamless looping) */}
                <div className="w-full shrink-0 flex flex-col justify-center h-[90px] sm:h-[180px] lg:h-[200px] font-[family-name:var(--font-heading)] leading-[1.05] tracking-tight perspective-[1200px] items-center lg:items-start text-center lg:text-left gap-0 sm:gap-2">
                  <span className="block text-[1.4rem] font-medium text-muted-foreground sm:text-4xl lg:text-4xl transition-transform duration-500 group-hover:rotate-x-12 group-hover:translate-y-[-2px] pb-1 sm:pb-0">
                    To Fix Am,
                  </span>
                  <span className="block bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 bg-clip-text text-transparent font-[family-name:var(--font-serif)] text-[2.6rem] italic sm:text-7xl lg:text-[4rem] dark:from-emerald-300 dark:via-emerald-400 dark:to-emerald-200 transition-transform duration-500 group-hover:-rotate-y-6 group-hover:scale-105 origin-center lg:origin-left leading-[1.1] sm:leading-none relative">
                    We Must Know Am.
                  </span>
                </div>
              </div>
            </div>

            {/* Subtext */}
            <p className="hero-sub mt-8 max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed">
              Knowledge is the first step to good citizenship. Explore{" "}
              <strong className="text-foreground">
                budgets, daily govspend, and corruption records
              </strong>{" "}
              across all <strong className="text-foreground">36 states and the FCT</strong>.
              Ask in plain English or Pidgin.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4 relative">
              <div
                className="relative"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <button
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    posthog.capture("hero_cta_clicked");
                  }}
                  className="hero-cta btn-magnetic inline-flex h-13 items-center gap-2.5 rounded-[1.5rem] bg-emerald-600 px-8 text-base font-semibold text-white opacity-0 animate-fade-in-up shadow-xl shadow-emerald-600/20 dark:bg-emerald-500 cursor-pointer"
                  style={{ animationDelay: "1.0s" }}
                >
                  <span className="btn-slide bg-emerald-700 dark:bg-emerald-600" />
                  <span className="relative z-10 flex items-center gap-2.5">
                    Start Asking Questions
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 pt-2 w-full min-w-[240px] z-50">
                    <div className="rounded-xl border border-border/50 bg-card p-2 shadow-xl shadow-black/10 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                    <a
                        href={LOGIN_URL}
                        onClick={() => posthog.capture("hero_platform_selected", { platform: "web" })}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Ask on Web
                      </a>
                      <a
                        href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ournigeria_dev_bot"}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => posthog.capture("hero_platform_selected", { platform: "telegram" })}
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Ask on Telegram
                      </a>
                      <button
                        onClick={() => {
                          posthog.capture("hero_platform_selected", { platform: "whatsapp" });
                          setIsModalOpen(true);
                          setIsDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted text-left cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Ask on WhatsApp
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trust */}
            <p className="hero-trust mt-8 font-[family-name:var(--font-mono)] text-xs tracking-wide text-muted-foreground/60 uppercase opacity-0 animate-fade-in" style={{ animationDelay: "1.3s" }}>
              Free to use &middot; No sign-up &middot; Multiple Datasets
            </p>
          </div>

          {/* Right — Mock chat interface card (desktop only; removed on mobile so it
              isn't mistaken for a real, typable chat) */}
          <div className="hero-card hidden w-full max-w-md opacity-0 animate-fade-in-up lg:block lg:max-w-lg perspective-[1200px]" style={{ animationDelay: "1.0s" }}>
            <div className="relative">
              {/* Main card */}
              <div className="rounded-[2rem] border border-border/50 bg-card/80 p-6 shadow-2xl shadow-black/5 backdrop-blur-sm dark:bg-card/60 dark:shadow-black/20">
                {/* Chat header */}
                <div className="mb-5 flex items-center gap-3 border-b border-border/50 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/50">
                    <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Our Nigeria</p>
                    <p className="font-[family-name:var(--font-mono)] text-[11px] text-emerald-600 dark:text-emerald-400">
                      system.ready
                    </p>
                  </div>
                  <div className="ml-auto flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-[carousel-dot-1_20s_linear_infinite]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-[carousel-dot-2_20s_linear_infinite]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-[carousel-dot-3_20s_linear_infinite]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-[carousel-dot-4_20s_linear_infinite]" />
                  </div>
                </div>

                {/* Chat items wrapper */}
                <div className="relative h-[280px] w-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 w-full flex flex-col gap-4 animate-[carousel-chat_20s_linear_infinite]"
                    style={{
                      animationTimingFunction: "cubic-bezier(0.8, 0, 0.2, 1)",
                    }}
                  >
                    {/* Item 1 - EFCC */}
                    <div className="w-full shrink-0 flex flex-col h-[280px] justify-center">
                      <div className="mb-3 ml-auto max-w-[80%] rounded-[1.25rem] rounded-br-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-sm dark:bg-emerald-500">
                        Which former governors EFCC dey investigate?
                      </div>
                      <div className="max-w-[85%] rounded-[1.25rem] rounded-bl-lg bg-muted/60 px-4 py-3 text-sm backdrop-blur-sm shadow-sm">
                        <p>
                          The EFCC is actively investigating several former
                          governors for alleged{" "}
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            misappropriation of public funds
                          </strong>{" "}
                          and money laundering. Recent cases include...
                        </p>
                        <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] text-muted-foreground/60">
                          src: EFCC Anti-Corruption Records
                        </p>
                      </div>
                    </div>

                    {/* Item 2 - Budgets */}
                    <div className="w-full shrink-0 flex flex-col h-[280px] justify-center">
                      <div className="mb-3 ml-auto max-w-[80%] rounded-[1.25rem] rounded-br-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-sm dark:bg-emerald-500">
                        How much did Lagos State budget for education in 2026?
                      </div>
                      <div className="max-w-[85%] rounded-[1.25rem] rounded-bl-lg bg-muted/60 px-4 py-3 text-sm backdrop-blur-sm shadow-sm">
                        <p>
                          In 2026, Lagos State allocated{" "}
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            ₦153.4 billion
                          </strong>{" "}
                          to the Education sector. This represents about 6.8% of
                          the total state budget.
                        </p>
                        <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] text-muted-foreground/60">
                          src: Lagos 2026 Approved Budget
                        </p>
                      </div>
                    </div>

                    {/* Item 3 - GovSpend */}
                    <div className="w-full shrink-0 flex flex-col h-[280px] justify-center">
                      <div className="mb-3 ml-auto max-w-[80%] rounded-[1.25rem] rounded-br-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-sm dark:bg-emerald-500">
                        Show me recent payments by the Ministry of Works
                      </div>
                      <div className="max-w-[85%] rounded-[1.25rem] rounded-bl-lg bg-muted/60 px-4 py-3 text-sm backdrop-blur-sm shadow-sm">
                        <p>
                          Recent major disbursements from the Federal Ministry
                          of Works include{" "}
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            ₦2.4 billion
                          </strong>{" "}
                          paid to Julius Berger for highway rehabilitation
                          projects.
                        </p>
                        <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] text-muted-foreground/60">
                          src: Daily GovSpend portal
                        </p>
                      </div>
                    </div>

                    {/* Item 4 - FAAC */}
                    <div className="w-full shrink-0 flex flex-col h-[280px] justify-center">
                      <div className="mb-3 ml-auto max-w-[80%] rounded-[1.25rem] rounded-br-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-sm dark:bg-emerald-500">
                        How much FAAC allocation enter Ikeja LG last month?
                      </div>
                      <div className="max-w-[85%] rounded-[1.25rem] rounded-bl-lg bg-muted/60 px-4 py-3 text-sm backdrop-blur-sm shadow-sm">
                        <p>
                          Last month, Ikeja Local Government received{" "}
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            ₦450.2 million
                          </strong>{" "}
                          from the Federal Account Allocation Committee (FAAC).
                        </p>
                        <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] text-muted-foreground/60">
                          src: FAAC Allocations
                        </p>
                      </div>
                    </div>

                    {/* Item 1 Duplicate (for seamless looping) */}
                    <div className="w-full shrink-0 flex flex-col h-[280px] justify-center">
                      <div className="mb-3 ml-auto max-w-[80%] rounded-[1.25rem] rounded-br-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-sm dark:bg-emerald-500">
                        Which former governors EFCC dey investigate?
                      </div>
                      <div className="max-w-[85%] rounded-[1.25rem] rounded-bl-lg bg-muted/60 px-4 py-3 text-sm backdrop-blur-sm shadow-sm">
                        <p>
                          The EFCC is actively investigating several former
                          governors for alleged{" "}
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            misappropriation of public funds
                          </strong>{" "}
                          and money laundering. Recent cases include...
                        </p>
                        <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] text-muted-foreground/60">
                          src: EFCC Anti-Corruption Records
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stat badges */}
              <div className="absolute -right-3 -top-3 opacity-0 animate-fade-in-up" style={{ animationDelay: "1.6s" }}>
                <div className="hero-float animate-float rounded-2xl border bg-card px-3.5 py-2.5 shadow-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold">Nigeria</p>
                      <p className="font-[family-name:var(--font-mono)] text-[9px] text-muted-foreground">
                        coverage.full
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="absolute -bottom-2 -left-3 opacity-0 animate-fade-in-up"
                style={{ animationDelay: "1.75s" }}
              >
                <div className="hero-float animate-float rounded-2xl border bg-card px-3.5 py-2.5 shadow-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold">5000+ Records</p>
                      <p className="font-[family-name:var(--font-mono)] text-[9px] text-muted-foreground">
                        status.indexed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-border/50 bg-card p-6 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <MessageCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">WhatsApp is coming</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;re currently working on bringing Our Nigeria to WhatsApp. In
                the meantime, please try our Telegram bot or the Web app.
              </p>
              <button
                onClick={() => setIsModalOpen(false)}
                className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
