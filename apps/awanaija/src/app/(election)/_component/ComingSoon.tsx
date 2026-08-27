import { HeroBackdrop } from "@/app/_component/HeroBackdrop";
import { NotifyTelegram } from "./NotifyTelegram";

/**
 * The holding page behind every election route that has no content yet. There
 * is no Figma frame for it — the layout was designed and approved as a canvas
 * mockup: one screen, the words "Coming soon." dominant, one line of copy, one
 * action, one status strip. Nothing else.
 *
 * Shared by `/election`, `/elections/<year>` and `/elections/<year>/<party>`,
 * which differ only in wording. The words are props rather than three copies of
 * the same markup, so the pages can't drift apart while they wait for content.
 *
 * The serif gradient is AskBlock's light/dark pair, not HeroHeading's, because
 * HeroHeading hardcodes the dark ramp (emerald-300/400/200) and it is close to
 * invisible on a light background.
 */
export function ComingSoon({
  eyebrow,
  lede,
  status,
}: {
  /** Mono line above the headline — "2027 general election · 180 days to go". */
  readonly eyebrow: string;
  /** The one paragraph under the headline. */
  readonly lede: React.ReactNode;
  /** Mono strip along the bottom. Empty entries are dropped. */
  readonly status: readonly string[];
}) {
  return (
    <div className="relative">
      <HeroBackdrop />

      {/* pt clears the fixed navbar; the bottom gap keeps the status strip above
          the floating Feedback / "Who governs you?" widgets on a 900px viewport. */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-28 pt-32 lg:px-8 lg:pt-28">
        <div className="flex items-center gap-3">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
          <span className="font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-muted-foreground">
            {eyebrow}
          </span>
        </div>

        <h1 className="mt-6 bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 bg-clip-text font-serif text-[92px] italic leading-[82px] tracking-[-0.4px] text-transparent dark:from-emerald-300 dark:via-emerald-400 dark:to-emerald-200 lg:text-[200px] lg:leading-[172px]">
          Coming
          <br />
          soon.
        </h1>

        <p className="mt-8 max-w-[640px] text-base leading-relaxed text-muted-foreground sm:text-lg lg:mt-11">
          {lede}
        </p>

        <div className="mt-8 lg:mt-10">
          <NotifyTelegram />
        </div>

        {/* text-balance so the three clauses split evenly instead of orphaning
            the last word on a narrow screen. */}
        <p className="mt-4 max-w-[340px] text-balance font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-muted-foreground lg:max-w-none">
          No account &middot; one message when e ready &middot; nothing else
        </p>

        <div className="mt-14 flex flex-col gap-2 border-t border-border pt-6 lg:mt-14 lg:flex-row lg:gap-8">
          {status.filter(Boolean).map((item) => (
            <span
              key={item}
              className="font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
