"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GraduationCap, HeartPulse, Building2 } from "lucide-react";
import { SHUFFLER_ITEMS, TYPEWRITER_MESSAGES, GEO_ZONES } from "@/lib/constants";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

const shufflerIcons = [GraduationCap, HeartPulse, Building2];

// ═══ Card 1: Budget Category Shuffler ═══
function ShufflerCard() {
  const [order, setOrder] = useState([0, 1, 2]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrder((prev) => {
        const next = [...prev];
        const last = next.pop()!;
        next.unshift(last);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold">
          Budget Categories
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time allocation tracking across all sectors
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {order.map((itemIndex, stackPos) => {
          const item = SHUFFLER_ITEMS[itemIndex];
          const Icon = shufflerIcons[itemIndex];
          return (
            <div
              key={item.label}
              className={cn(
                "rounded-2xl border p-4 transition-all duration-500",
                stackPos === 0
                  ? "bg-card shadow-md border-emerald-200/60 dark:border-emerald-700/40"
                  : "bg-card/60 shadow-sm"
              )}
              style={{
                transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-500",
                    stackPos === 0
                      ? "bg-emerald-600 dark:bg-emerald-500"
                      : "bg-emerald-100 dark:bg-emerald-900/40"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4 transition-colors duration-500",
                      stackPos === 0
                        ? "text-white"
                        : "text-emerald-600 dark:text-emerald-400"
                    )} />
                  </div>
                  <span className="font-semibold">{item.label}</span>
                </div>
                <span className="font-[family-name:var(--font-mono)] text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {item.amount}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden mr-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    style={{
                      width: itemIndex === 0 ? "78%" : itemIndex === 1 ? "65%" : "52%",
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
                <span className="font-[family-name:var(--font-mono)] text-xs text-emerald-600 dark:text-emerald-400">
                  {item.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══ Card 2: AI Telemetry Typewriter ═══
function TypewriterCard() {
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const lineIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const tick = useCallback(() => {
    const messages = TYPEWRITER_MESSAGES;
    const li = lineIndexRef.current;
    const ci = charIndexRef.current;

    if (li >= messages.length) {
      // Reset after pause
      timeoutRef.current = setTimeout(() => {
        setCompletedLines([]);
        setCurrentLine("");
        lineIndexRef.current = 0;
        charIndexRef.current = 0;
        tick();
      }, 2500);
      return;
    }

    const msg = messages[li];
    if (ci < msg.length) {
      setCurrentLine(msg.slice(0, ci + 1));
      charIndexRef.current = ci + 1;
      timeoutRef.current = setTimeout(tick, 25 + Math.random() * 35);
    } else {
      // Line done
      setCompletedLines((prev) => [...prev, msg]);
      setCurrentLine("");
      lineIndexRef.current = li + 1;
      charIndexRef.current = 0;
      timeoutRef.current = setTimeout(tick, 600);
    }
  }, []);

  useEffect(() => {
    tick();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold">
            AI Analysis Feed
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Watch our AI process budget data in real time
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 dark:bg-emerald-950/50">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>

      <div className="flex-1 rounded-xl bg-[oklch(0.12_0.01_160)] dark:bg-[oklch(0.08_0.01_160)] p-4 font-[family-name:var(--font-mono)] text-xs overflow-hidden">
        <div className="space-y-1.5">
          {completedLines.map((line, i) => (
            <div key={i} className="text-emerald-400/80">{line}</div>
          ))}
          {currentLine && (
            <div className="text-emerald-400">
              {currentLine}
              <span className="animate-cursor-blink ml-0.5 text-emerald-500">
                █
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ Card 3: Geo-Zone Explorer ═══
function ExplorerCard() {
  const [activeZone, setActiveZone] = useState<number | null>(null);
  const stepRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const zoneIndex = stepRef.current % GEO_ZONES.length;
      setActiveZone(zoneIndex);
      stepRef.current += 1;
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold">
          State Explorer
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Navigate budget data across all geo-political zones
        </p>
      </div>

      <div className="flex-1">
        <div className="grid grid-cols-3 gap-2">
          {GEO_ZONES.map((zone, i) => (
            <button
              key={zone.name}
              className={cn(
                "relative rounded-xl p-3 text-center transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
                activeZone === i
                  ? "bg-emerald-600 text-white scale-[0.96] shadow-lg shadow-emerald-500/30 dark:bg-emerald-500"
                  : "bg-muted/60 hover:bg-muted"
              )}
            >
              <span className="font-[family-name:var(--font-mono)] text-sm font-bold block">
                {zone.name}
              </span>
              <span
                className={cn(
                  "block text-[10px] mt-0.5 transition-colors duration-300",
                  activeZone === i ? "text-white/70" : "text-muted-foreground"
                )}
              >
                {zone.states} states
              </span>
              {activeZone === i && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-emerald-900" />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active zone info */}
        <div className="mt-3 rounded-xl bg-muted/40 p-3 transition-all duration-300">
          {activeZone !== null ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted-foreground uppercase tracking-wider">
                  Selected Zone
                </span>
                <p className="text-sm font-semibold">{GEO_ZONES[activeZone].full}</p>
              </div>
              <div className="text-right">
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-muted-foreground uppercase tracking-wider">
                  States
                </span>
                <p className="font-[family-name:var(--font-mono)] text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {GEO_ZONES[activeZone].states}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              Scanning zones...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ Main Features Section ═══
export function Features() {
  const { ref, isInView } = useInView({ threshold: 0.05 });
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isInView) return;
    let ctx: { revert: () => void } | null = null;

    const init = async () => {
      const gsap = (await import("gsap")).default;
      ctx = gsap.context(() => {
        gsap.fromTo(
          ".feature-card",
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: "power3.out",
          }
        );
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, [isInView]);

  return (
    <section ref={sectionRef} id="features" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-14" ref={ref}>
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Capabilities
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Wetin You Fit Do
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three powerful tools to make Nigeria government spending transparent
          </p>
        </div>

        {/* 3 Interactive cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="feature-card rounded-[2rem] border bg-card p-6 shadow-sm opacity-0 hover-lift">
            <ShufflerCard />
          </div>
          <div className="feature-card rounded-[2rem] border bg-card p-6 shadow-sm opacity-0 hover-lift">
            <TypewriterCard />
          </div>
          <div className="feature-card rounded-[2rem] border bg-card p-6 shadow-sm opacity-0 hover-lift">
            <ExplorerCard />
          </div>
        </div>
      </div>
    </section>
  );
}
