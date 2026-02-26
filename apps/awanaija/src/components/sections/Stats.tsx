"use client";

import { useEffect, useState, useCallback } from "react";
import { STATS } from "@/lib/constants";
import { useInView } from "@/hooks/useInView";

function useCountUp(target: number, isActive: boolean, duration = 2000) {
  const [count, setCount] = useState(0);

  const animate = useCallback(() => {
    if (!isActive) return;
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, isActive, duration]);

  useEffect(() => {
    animate();
  }, [animate]);

  return count;
}

function StatItem({
  value,
  suffix,
  label,
  pidgin,
  isActive,
}: {
  value: number;
  suffix: string;
  label: string;
  pidgin: string;
  isActive: boolean;
}) {
  const count = useCountUp(value, isActive);

  return (
    <div className="text-center">
      <p className="font-[family-name:var(--font-heading)] text-5xl font-bold text-white sm:text-6xl lg:text-7xl tabular-nums">
        {isActive ? count.toLocaleString() : "0"}
        {suffix}
      </p>
      <p className="mt-3 text-base font-semibold text-white/90">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-white/40 uppercase tracking-wider">
        {pidgin}
      </p>
    </div>
  );
}

export function Stats() {
  const { ref, isInView } = useInView({ threshold: 0.3 });

  return (
    <section id="data" className="relative overflow-hidden py-16 sm:py-20">
      {/* Emerald gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 via-emerald-600 to-emerald-800 dark:from-emerald-950 dark:via-emerald-800 dark:to-emerald-950" />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-3">
          {STATS.map((stat) => (
            <StatItem
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              pidgin={stat.pidgin}
              isActive={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
