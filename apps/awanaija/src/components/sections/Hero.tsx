"use client";

import { useEffect, useRef } from "react";
import {
  ArrowRight,
  ChevronDown,
  Bot,
  TrendingUp,
  FileText,
} from "lucide-react";
import { APP_URL } from "@/lib/constants";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | null = null;

    const init = async () => {
      const gsap = (await import("gsap")).default;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(
          ".hero-badge",
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 },
        )
          .fromTo(
            ".hero-line",
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 },
            "-=0.3",
          )
          .fromTo(
            ".hero-sub",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6 },
            "-=0.4",
          )
          .fromTo(
            ".hero-cta",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
            "-=0.3",
          )
          .fromTo(
            ".hero-trust",
            { opacity: 0 },
            { opacity: 1, duration: 0.5 },
            "-=0.2",
          )
          .fromTo(
            ".hero-card",
            { opacity: 0, x: 60, rotateY: 8 },
            { opacity: 1, x: 0, rotateY: 0, duration: 1, ease: "power2.out" },
            "-=0.8",
          )
          .fromTo(
            ".hero-float",
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.5, stagger: 0.15 },
            "-=0.4",
          );
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] overflow-hidden"
    >
      {/* Deep gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/40 dark:via-background" />

      {/* Floating orbs */}
      <div className="absolute top-[15%] left-[8%] h-80 w-80 rounded-full bg-emerald-400/12 blur-[100px] animate-orb-1 dark:bg-emerald-400/6" />
      <div className="absolute bottom-[10%] right-[5%] h-[28rem] w-[28rem] rounded-full bg-emerald-500/8 blur-[120px] animate-orb-2 dark:bg-emerald-500/4" />
      <div className="absolute top-[40%] left-[50%] h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-300/8 blur-[80px] animate-orb-3 dark:bg-emerald-300/4" />

      <div
        ref={contentRef}
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="flex min-h-[100dvh] flex-col items-center justify-end gap-16 pb-24 pt-32 lg:flex-row lg:items-center lg:justify-between lg:pb-0 lg:pt-0">
          {/* Left — Text content, pushed bottom-left on desktop */}
          <div className="flex max-w-2xl flex-col items-center text-center lg:items-start lg:text-left">
            {/* Badge */}
            <div className="hero-badge mb-8 opacity-0">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-4 py-1.5 text-sm font-medium text-emerald-700 backdrop-blur-sm dark:border-emerald-700/40 dark:bg-emerald-950/50 dark:text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Na Our Country
              </span>
            </div>

            {/* Headline — sans + serif contrast */}
            <h1 className="font-[family-name:var(--font-heading)] leading-[1.05] tracking-tight">
              <span className="hero-line block text-2xl font-medium text-muted-foreground opacity-0 sm:text-3xl">
                Together, For
              </span>
              <span className="hero-line block bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 bg-clip-text text-transparent font-[family-name:var(--font-serif)] text-6xl italic opacity-0 sm:text-7xl lg:text-[5.5rem] dark:from-emerald-300 dark:via-emerald-400 dark:to-emerald-200">
                Our Nigeria
              </span>
              <span className="hero-line block text-2xl font-medium text-muted-foreground opacity-0 sm:text-3xl">
                Make We Fix Am.
              </span>
            </h1>

            {/* Subtext */}
            <p className="hero-sub mt-8 max-w-lg text-base text-muted-foreground opacity-0 sm:text-lg leading-relaxed">
              Explore{" "}
              <strong className="text-foreground">
                budgets, daily govspend, and corruption records
              </strong>{" "}
              across all <strong className="text-foreground">36 states</strong>.
              Ask in plain English or Pidgin. Get answers backed by real data.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href={APP_URL}
                className="hero-cta btn-magnetic inline-flex h-13 items-center gap-2.5 rounded-[1.5rem] bg-emerald-600 px-8 text-base font-semibold text-white opacity-0 shadow-xl shadow-emerald-600/20 dark:bg-emerald-500"
              >
                <span className="btn-slide bg-emerald-700 dark:bg-emerald-600" />
                <span className="relative z-10 flex items-center gap-2.5">
                  Start Asking Questions
                  <ArrowRight className="h-4 w-4" />
                </span>
              </a>
              <a
                href="#process"
                className="hero-cta inline-flex h-13 items-center gap-2 rounded-[1.5rem] px-6 text-base font-medium text-muted-foreground opacity-0 transition-colors hover:text-foreground"
              >
                See How E Work
                <ChevronDown className="h-4 w-4" />
              </a>
            </div>

            {/* Trust */}
            <p className="hero-trust mt-8 font-[family-name:var(--font-mono)] text-xs tracking-wide text-muted-foreground/60 uppercase opacity-0">
              Free to use &middot; No sign-up &middot; Multiple Datasets
            </p>
          </div>

          {/* Right — Mock chat interface card */}
          <div className="hero-card w-full max-w-md opacity-0 lg:max-w-lg perspective-[1200px]">
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
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                </div>

                {/* User question */}
                <div className="mb-3 ml-auto max-w-[80%] rounded-[1.25rem] rounded-br-lg bg-emerald-600 px-4 py-3 text-sm text-white dark:bg-emerald-500">
                  Which former governors EFCC dey investigate?
                </div>

                {/* AI response */}
                <div className="max-w-[85%] rounded-[1.25rem] rounded-bl-lg bg-muted/60 px-4 py-3 text-sm backdrop-blur-sm">
                  <p>
                    The EFCC is actively investigating several former governors
                    for alleged{" "}
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

              {/* Floating stat badges */}
              <div className="hero-float absolute -right-3 -top-3 animate-float rounded-2xl border bg-card px-3.5 py-2.5 shadow-lg opacity-0">
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
              <div
                className="hero-float absolute -bottom-2 -left-3 animate-float rounded-2xl border bg-card px-3.5 py-2.5 shadow-lg opacity-0"
                style={{ animationDelay: "2s" }}
              >
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
    </section>
  );
}
