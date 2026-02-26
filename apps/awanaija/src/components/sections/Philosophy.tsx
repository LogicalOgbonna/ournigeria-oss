"use client";

import { useEffect, useRef } from "react";
import { useInView } from "@/hooks/useInView";

export function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null);
  const { ref: triggerRef, isInView } = useInView({ threshold: 0.2 });

  useEffect(() => {
    if (!isInView) return;
    let ctx: { revert: () => void } | null = null;

    const init = async () => {
      const gsap = (await import("gsap")).default;

      ctx = gsap.context(() => {
        gsap.fromTo(
          ".philo-word",
          { opacity: 0.15, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.04,
            ease: "power2.out",
          }
        );
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, [isInView]);

  const beforeWords = "Most budget platforms give you".split(" ");
  const beforeHighlight = "raw PDFs and spreadsheets.".split(" ");
  const afterWords = "We give you".split(" ");
  const afterHighlight = "answers.";

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[oklch(0.12_0.01_160)] py-20 sm:py-28 dark:bg-[oklch(0.08_0.01_160)]"
    >
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div ref={triggerRef} className="relative mx-auto max-w-5xl px-6 sm:px-10 lg:px-16">
        {/* The manifesto */}
        <div className="space-y-10 sm:space-y-14">
          {/* "Before" statement — neutral, smaller */}
          <p className="text-xl sm:text-2xl lg:text-3xl font-light text-white/50 leading-relaxed tracking-tight">
            {beforeWords.map((word, i) => (
              <span key={`b-${i}`} className="philo-word inline-block mr-[0.3em]">
                {word}
              </span>
            ))}
            {beforeHighlight.map((word, i) => (
              <span
                key={`bh-${i}`}
                className="philo-word inline-block mr-[0.3em] text-white/70"
              >
                {word}
              </span>
            ))}
          </p>

          {/* "After" statement — massive, editorial, emerald accent */}
          <p className="text-3xl sm:text-5xl lg:text-7xl leading-[1.1] tracking-tight">
            {afterWords.map((word, i) => (
              <span
                key={`a-${i}`}
                className="philo-word inline-block mr-[0.3em] font-[family-name:var(--font-heading)] font-bold text-white"
              >
                {word}
              </span>
            ))}
            <span className="philo-word inline-block font-[family-name:var(--font-serif)] italic text-emerald-400">
              {afterHighlight}
            </span>
          </p>
        </div>

        {/* Decorative line */}
        <div className="mt-16 sm:mt-20 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/40 to-transparent" />
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-emerald-500/60 uppercase tracking-[0.3em]">
            Our philosophy
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-emerald-500/40 to-transparent" />
        </div>
      </div>
    </section>
  );
}
