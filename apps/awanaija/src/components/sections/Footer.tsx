"use client";

import Image from "next/image";
import { LOGIN_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative bg-[oklch(0.10_0.008_160)] dark:bg-[oklch(0.06_0.008_160)] rounded-t-[3rem]">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Image
              src="/long_logo_dark.svg"
              alt="Our Nigeria"
              width={180}
              height={50}
              className="h-10 w-auto"
            />
            <p className="mt-5 max-w-sm text-sm text-white/40 leading-relaxed">
              Making Nigeria government spending transparent and accessible to
              every citizen. Because na your money.
            </p>
            {/* Social links */}
            <div className="mt-6 flex gap-4">
              <a
                href="https://x.com/awanigeria"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 transition-colors hover:text-white/70 hover-lift"
                aria-label="Follow on X"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/ournigeria"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 transition-colors hover:text-white/70 hover-lift"
                aria-label="View on GitHub"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-[family-name:var(--font-mono)] text-[10px] font-medium text-white/40 uppercase tracking-[0.2em]">
              Navigation
            </h3>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href="#features"
                  className="text-sm text-white/50 transition-colors hover:text-white hover-lift inline-block"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#process"
                  className="text-sm text-white/50 transition-colors hover:text-white hover-lift inline-block"
                >
                  Process
                </a>
              </li>
              <li>
                <a
                  href="#data"
                  className="text-sm text-white/50 transition-colors hover:text-white hover-lift inline-block"
                >
                  Data
                </a>
              </li>
              <li>
                <a
                  href={LOGIN_URL}
                  className="text-sm text-white/50 transition-colors hover:text-white hover-lift inline-block"
                >
                  Enter App
                </a>
              </li>
              <li>
                <a
                  href="/donate"
                  className="text-sm text-emerald-400/70 transition-colors hover:text-emerald-400 hover-lift inline-block"
                >
                  Support Us
                </a>
              </li>
            </ul>
          </div>

          {/* Status */}
          <div>
            <h3 className="font-[family-name:var(--font-mono)] text-[10px] font-medium text-white/40 uppercase tracking-[0.2em]">
              System
            </h3>
            <ul className="mt-5 space-y-3">
              <li className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-[family-name:var(--font-mono)] text-xs text-emerald-400">
                  All Systems Operational
                </span>
              </li>
              <li>
                <span className="text-sm text-white/50">
                  Data from public government records
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Our Nigeria. We build am with love for Naija.
          </p>
          <p className="font-[family-name:var(--font-mono)] text-[10px] text-white/20 uppercase tracking-[0.2em]">
            v0.1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
