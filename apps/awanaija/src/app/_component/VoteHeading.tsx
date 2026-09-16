"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * What the hero says people should know before they vote. The first entry is
 * what the server renders (and what reduced-motion viewers keep), so it has to
 * read as a complete line on its own.
 */
export const VOTE_PHRASES = [
  "who's on the ballot",
  "what they promised",
  "what they have done",
] as const;

/** Per-character typing pace; deleting is quicker, as on a real keyboard. */
const TYPE_MS = 65;
const DELETE_MS = 35;
/** How long a finished phrase sits before it is erased. */
const HOLD_MS = 2000;
/** Beat between erasing one phrase and starting the next. */
const GAP_MS = 350;

/**
 * The hero's two-line title: "Know ‹phrase›," in the muted heading face over
 * "before you vote" in the emerald serif — same type ramp as HeroHeading
 * (Figma 132:1529 / 132:1528), with the phrase cycling on a typewriter.
 *
 * Assistive tech gets ONE stable heading (the sr-only h1); the animated copy
 * is aria-hidden so screen readers are not read a stream of half-words.
 *
 * Hydration-safe: the server renders the first phrase in full and the loop
 * starts from that state (hold, then erase), so nothing pops on mount.
 */
export function VoteHeading({ className }: { readonly className?: string }) {
  const phrase = useTypewriter(VOTE_PHRASES);

  return (
    // The h1 WRAPS the real headline rather than being a second, hidden copy
    // of it: awanaija is the SEO surface, so the page's only top-level heading
    // has to be the text people actually see. The stable sentence rides along
    // as an sr-only child and the animated copy is aria-hidden, so the
    // accessible name is computed from that one child alone.
    <h1 className={cn(className)}>
      <span className="sr-only">Know {VOTE_PHRASES[0]}, before you cast your vote</span>

      <span
        aria-hidden
        className="block font-heading text-[24px] font-medium leading-[28px] tracking-[-0.4px] text-muted-foreground lg:text-[36px] lg:leading-[40px]"
      >
        Know{" "}
        <em className="font-normal italic text-foreground">
          {phrase}
          <span
            className="animate-cursor-blink ml-[1px] inline-block h-[0.85em] w-[2px] translate-y-[0.1em] rounded-full bg-emerald-500 align-baseline"
          />
        </em>
        ,
      </span>
      <span
        aria-hidden
        // AskBlock's light/dark gradient pair, not HeroHeading's. HeroHeading
        // hardcodes the dark ramp (emerald-300/400/200), which washes out to
        // near-invisible over the light hero backdrop — and this is now the
        // largest line on the page. Same note as ComingSoon.tsx.
        className="block bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 bg-clip-text font-serif text-[37px] italic leading-[40px] tracking-[-0.4px] text-transparent dark:from-emerald-300 dark:via-emerald-400 dark:to-emerald-200 lg:text-[64px] lg:leading-[64px]"
      >
        before you cast your vote
      </span>
    </h1>
  );
}

/**
 * Cycles through `phrases`: type, hold, erase, next. Starts from the FIRST
 * phrase fully typed (what the server painted), so the first visible motion is
 * the erase rather than a flash to empty. Honours `prefers-reduced-motion` by
 * never starting — the first phrase simply stays.
 */
function useTypewriter(phrases: readonly string[]): string {
  const [text, setText] = useState(phrases[0]);

  useEffect(() => {
    if (phrases.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let index = 0;
    let length = phrases[0].length;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      const current = phrases[index];
      let delay: number;

      if (deleting) {
        length -= 1;
        if (length === 0) {
          deleting = false;
          index = (index + 1) % phrases.length;
          delay = GAP_MS;
        } else {
          delay = DELETE_MS;
        }
      } else {
        length += 1;
        if (length === current.length) {
          deleting = true;
          delay = HOLD_MS;
        } else {
          delay = TYPE_MS;
        }
      }

      setText((deleting ? current : phrases[index]).slice(0, length));
      timer = setTimeout(step, delay);
    };

    // The server-rendered phrase is complete: hold it, then begin erasing.
    deleting = true;
    timer = setTimeout(step, HOLD_MS);
    return () => clearTimeout(timer);
  }, [phrases]);

  return text;
}
