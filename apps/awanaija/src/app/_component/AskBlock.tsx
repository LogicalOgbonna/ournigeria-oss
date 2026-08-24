"use client";

import { ChevronDown, Globe, MessageCircle, Send } from "lucide-react";
import posthog from "posthog-js";
import { Show } from "@/components/ui/Show";
import { LOGIN_URL } from "@/lib/constants";
import { ChatDemo } from "./ChatDemo";
import { useDropdown } from "./useDropdown";

const TELEGRAM = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "ournigeria_dev_bot"}`;

/**
 * "To Fix Am, We Must Know Am." — the pitch and the primary CTA, with the mock
 * chat card alongside. Figma 132:1525 / 132:1530 / 132:1534.
 */
export function AskBlock() {
  const { open, setOpen, ref } = useDropdown();

  return (
    <section className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
      <div>
        <p className="font-heading text-[1.4rem] font-medium leading-tight tracking-tight text-muted-foreground sm:text-4xl">
          To Fix Am,
        </p>
        <p className="bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 bg-clip-text font-serif text-[2.6rem] italic leading-[1.1] tracking-tight text-transparent dark:from-emerald-300 dark:via-emerald-400 dark:to-emerald-200 sm:text-7xl lg:text-[4rem] lg:leading-none">
          We Must Know Am.
        </p>

        <p className="mt-8 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
          Knowledge is the first step to good citizenship. Explore{" "}
          <strong className="text-foreground">
            budgets, daily govspend, corruption records, public officials, and bills
          </strong>{" "}
          across all <strong className="text-foreground">36 states and the FCT</strong>. Ask in
          plain English or Pidgin.
        </p>

        <div ref={ref} className="relative mt-10 inline-block">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => {
              setOpen(!open);
              posthog.capture("hero_cta_clicked");
            }}
            className="btn-magnetic inline-flex h-13 items-center gap-2.5 rounded-[1.5rem] bg-emerald-600 px-8 text-base font-semibold text-white shadow-xl shadow-emerald-600/20 dark:bg-emerald-500"
          >
            <span className="btn-slide bg-emerald-700 dark:bg-emerald-600" />
            <span className="relative z-10 flex items-center gap-2.5">
              Start Asking Questions
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </span>
          </button>

          <Show when={open}>
            <div className="absolute left-0 top-full z-50 w-full min-w-[240px] pt-2">
              <div className="rounded-xl border border-border/50 bg-card p-2 shadow-xl shadow-black/10 backdrop-blur-sm">
                <Channel href={LOGIN_URL} platform="web" icon={<Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}>
                  Ask on Web
                </Channel>
                <Channel href={TELEGRAM} platform="telegram" external icon={<Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}>
                  Ask on Telegram
                </Channel>
                <Channel href={TELEGRAM} platform="whatsapp" external icon={<MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}>
                  Ask on WhatsApp
                </Channel>
              </div>
            </div>
          </Show>
        </div>

        <p className="mt-8 font-mono text-xs uppercase tracking-wide text-muted-foreground/60">
          Free to use &middot; No sign-up &middot; Multiple Datasets
        </p>
      </div>

      {/* Removed on mobile so it isn't mistaken for a real, typable chat. */}
      <div className="hidden w-full lg:block">
        <ChatDemo />
      </div>
    </section>
  );
}

function Channel({
  href,
  platform,
  icon,
  external,
  children,
}: {
  readonly href: string;
  readonly platform: string;
  readonly icon: React.ReactNode;
  readonly external?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={() => posthog.capture("hero_platform_selected", { platform })}
      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
    >
      {icon}
      {children}
    </a>
  );
}
