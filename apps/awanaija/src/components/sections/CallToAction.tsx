"use client";

import { ArrowRight, Heart } from "lucide-react";
import { LOGIN_URL } from "@/lib/constants";

export function CallToAction() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-28">
      {/* Deep gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 dark:from-emerald-900 dark:via-emerald-950 dark:to-black" />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[150px]" />

      {/* Nigerian flag accent — green/white/green */}
      <div className="absolute top-0 left-0 right-0 flex h-1">
        <div className="flex-1 bg-emerald-400/60" />
        <div className="flex-1 bg-white/40" />
        <div className="flex-1 bg-emerald-400/60" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex h-1">
        <div className="flex-1 bg-emerald-400/60" />
        <div className="flex-1 bg-white/40" />
        <div className="flex-1 bg-emerald-400/60" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <h2 className="font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
          Our Nigeria.
          <br />
          <span className="font-[family-name:var(--font-serif)] italic text-emerald-300">
            Make We Fix Am.
          </span>
        </h2>

        <p className="mt-8 text-xl text-white/60 max-w-lg mx-auto leading-relaxed">
          Na our country, na our money, na our institutions. You deserve to know
          wetin dey happen.
        </p>

        <div className="mt-12">
          <a
            href={LOGIN_URL}
            className="btn-magnetic inline-flex h-16 items-center gap-3 rounded-[2rem] bg-white px-12 text-lg font-semibold text-emerald-800 shadow-2xl shadow-black/20"
          >
            <span className="btn-slide bg-emerald-50" />
            <span className="relative z-10 flex items-center gap-3">
              Start Exploring Now
              <ArrowRight className="h-5 w-5" />
            </span>
          </a>
        </div>

        <p className="mt-8 font-[family-name:var(--font-mono)] text-xs text-white/30 uppercase tracking-[0.2em]">
          Free &middot; No sign-up &middot; Built for every Nigerian
        </p>

        <div className="mt-6">
          <a
            href="/donate"
            className="inline-flex items-center gap-2 text-sm text-emerald-300/70 transition-colors hover:text-emerald-200"
          >
            <Heart className="h-4 w-4" />
            <span>Support this project with a donation</span>
          </a>
        </div>
      </div>
    </section>
  );
}
