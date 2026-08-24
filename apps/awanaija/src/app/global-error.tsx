"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import type { CSSProperties } from "react";
import "./globals.css";

// global-error.tsx replaces the ROOT layout when it renders, so it inherits none
// of the app's fonts / Tailwind / theme. We re-import globals.css and re-supply
// the --font-* variables (loaded via a plain <link>, not next/font — next/font
// can't be re-instantiated here) so even this last-resort screen stays on brand.
const FONT_VARS = {
  "--font-sans": "'Instrument Sans', system-ui, sans-serif",
  "--font-heading": "'DM Sans', system-ui, sans-serif",
  "--font-serif": "'Instrument Serif', Georgia, serif",
  "--font-mono": "'IBM Plex Mono', ui-monospace, monospace",
} as CSSProperties;

// next-themes lives in the root layout we've replaced, so re-apply the user's
// choice (localStorage "theme", default system) before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||((!t||t==='system')&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}`;

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body style={FONT_VARS} className="font-sans antialiased">
        <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>

            <h1 className="font-serif text-[36px] leading-[1.15] text-foreground">
              Something went wrong
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              An unexpected error occurred and we&apos;ve logged it. You fit try
              again — if e persist, come back small.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Try again
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
              >
                Go home
              </a>
            </div>

            {error.digest && (
              <p className="mt-6 font-mono text-[11px] text-muted-foreground/70">
                Ref: {error.digest}
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
