"use client";

import { useEffect, useState } from "react";
import { MoneyEquivalent } from "@/types";
import { formatNaira, formatNumber } from "@/lib/format";
import { Card } from "@/components/ui/card";
import {
  Home,
  GraduationCap,
  Droplets,
  Lightbulb,
  School,
  Hospital,
  Route,
  Zap,
  HeartPulse,
  Shield,
  Swords,
  BookOpen,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  home: Home,
  school: School,
  hospital: Hospital,
  graduation: GraduationCap,
  droplet: Droplets,
  streetlight: Lightbulb,
  road: Route,
  zap: Zap,
  "heart-pulse": HeartPulse,
  shield: Shield,
  swords: Swords,
  "book-open": BookOpen,
};

const bgColors = [
  "from-emerald-50 to-emerald-100/50 border-emerald-200/60",
  "from-blue-50 to-blue-100/50 border-blue-200/60",
  "from-amber-50 to-amber-100/50 border-amber-200/60",
  "from-violet-50 to-violet-100/50 border-violet-200/60",
  "from-rose-50 to-rose-100/50 border-rose-200/60",
  "from-cyan-50 to-cyan-100/50 border-cyan-200/60",
  "from-orange-50 to-orange-100/50 border-orange-200/60",
  "from-teal-50 to-teal-100/50 border-teal-200/60",
  "from-indigo-50 to-indigo-100/50 border-indigo-200/60",
];

const iconColors = [
  "text-emerald-600",
  "text-blue-600",
  "text-amber-600",
  "text-violet-600",
  "text-rose-600",
  "text-cyan-600",
  "text-orange-600",
  "text-teal-600",
  "text-indigo-600",
];

function AnimatedCount({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{formatNumber(count)}</span>;
}

interface MoneyCouldBuyCardProps {
  title: string;
  amount: number;
  items: MoneyEquivalent[];
}

export function MoneyCouldBuyCard({
  title,
  amount,
  items,
}: MoneyCouldBuyCardProps) {
  return (
    <Card className="animate-scale-in overflow-hidden border-slate-200/80 bg-white p-0">
      <div className="border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <p className="text-xs text-slate-400">
          What {formatNaira(amount)} could fund
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3">
        {items.map((item, i) => {
          const Icon = iconMap[item.icon] || Home;
          return (
            <div
              key={i}
              className={`animate-fade-in-up rounded-xl border bg-gradient-to-br p-4 ${bgColors[i % bgColors.length]}`}
              style={{ animationDelay: `${i * 150 + 200}ms`, opacity: 0 }}
            >
              <Icon
                className={`mb-2 h-6 w-6 ${iconColors[i % iconColors.length]}`}
              />
              <p className="text-2xl font-bold text-slate-900">
                <AnimatedCount target={item.count} />
              </p>
              <p className="text-xs font-medium text-slate-700">{item.label}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {item.unitLabel}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
