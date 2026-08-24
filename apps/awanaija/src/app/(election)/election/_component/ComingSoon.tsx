import { HeroBackdrop } from "@/app/_component/HeroBackdrop";
import { NotifyTelegram } from "./NotifyTelegram";

/**
 * The `/election` holding page. There is no Figma frame for it — the layout was
 * designed and approved as a canvas mockup: one screen, the words "Coming soon."
 * dominant, one line of copy, one action, one status strip. Nothing else.
 *
 * The serif gradient is AskBlock's light/dark pair, not HeroHeading's, because
 * HeroHeading hardcodes the dark ramp (emerald-300/400/200) and it is close to
 * invisible on a light background.
 */
export function ComingSoon({
  daysToGo,
  coverage,
}: {
  /** Days until the general election — recomputed on every ISR revalidate. */
  readonly daysToGo: number;
  /** "36 states + FCT · 774 LGAs · 8,809 wards", from /api/geo/stats. */
  readonly coverage: string;
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
            2027 general election &middot; {daysToGo} days to go
          </span>
        </div>

        <h1 className="mt-6 bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 bg-clip-text font-serif text-[92px] italic leading-[82px] tracking-[-0.4px] text-transparent dark:from-emerald-300 dark:via-emerald-400 dark:to-emerald-200 lg:text-[200px] lg:leading-[172px]">
          Coming
          <br />
          soon.
        </h1>

        <p className="mt-8 max-w-[640px] text-base leading-relaxed text-muted-foreground sm:text-lg lg:mt-11">
          Your whole ballot &mdash; president down to ward councillor, for
          wherever you live. We dey build am seat by seat.
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
          <span className="font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-muted-foreground">
            1 of 7 seats filled
          </span>
          <span className="font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-muted-foreground">
            presidential race confirmed
          </span>
          <span className="font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-muted-foreground">
            {coverage}
          </span>
        </div>
      </section>
    </div>
  );
}
