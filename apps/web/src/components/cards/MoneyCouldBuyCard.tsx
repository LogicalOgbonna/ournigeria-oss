"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
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
  Download,
  Truck,
  Baby,
  Wheat,
  Laptop,
  Stethoscope,
  Building2,
  Users,
  Briefcase,
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
  truck: Truck,
  baby: Baby,
  wheat: Wheat,
  laptop: Laptop,
  stethoscope: Stethoscope,
  building: Building2,
  users: Users,
  briefcase: Briefcase,
};

const bgColors = [
  "from-emerald-50 to-emerald-100/50 border-emerald-200/60 dark:from-emerald-950/50 dark:to-emerald-900/30 dark:border-emerald-800/40",
  "from-blue-50 to-blue-100/50 border-blue-200/60 dark:from-blue-950/50 dark:to-blue-900/30 dark:border-blue-800/40",
  "from-amber-50 to-amber-100/50 border-amber-200/60 dark:from-amber-950/50 dark:to-amber-900/30 dark:border-amber-800/40",
  "from-violet-50 to-violet-100/50 border-violet-200/60 dark:from-violet-950/50 dark:to-violet-900/30 dark:border-violet-800/40",
  "from-rose-50 to-rose-100/50 border-rose-200/60 dark:from-rose-950/50 dark:to-rose-900/30 dark:border-rose-800/40",
  "from-cyan-50 to-cyan-100/50 border-cyan-200/60 dark:from-cyan-950/50 dark:to-cyan-900/30 dark:border-cyan-800/40",
  "from-orange-50 to-orange-100/50 border-orange-200/60 dark:from-orange-950/50 dark:to-orange-900/30 dark:border-orange-800/40",
  "from-teal-50 to-teal-100/50 border-teal-200/60 dark:from-teal-950/50 dark:to-teal-900/30 dark:border-teal-800/40",
  "from-indigo-50 to-indigo-100/50 border-indigo-200/60 dark:from-indigo-950/50 dark:to-indigo-900/30 dark:border-indigo-800/40",
];

const iconColors = [
  "text-emerald-600 dark:text-emerald-400",
  "text-blue-600 dark:text-blue-400",
  "text-amber-600 dark:text-amber-400",
  "text-violet-600 dark:text-violet-400",
  "text-rose-600 dark:text-rose-400",
  "text-cyan-600 dark:text-cyan-400",
  "text-orange-600 dark:text-orange-400",
  "text-teal-600 dark:text-teal-400",
  "text-indigo-600 dark:text-indigo-400",
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
  subtitle?: string;
  amount: number;
  items: MoneyEquivalent[];
}

export function MoneyCouldBuyCard({
  title,
  subtitle,
  amount,
  items,
}: MoneyCouldBuyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${title.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download image:", err);
    } finally {
      setDownloading(false);
    }
  }, [title]);

  return (
    <Card
      ref={cardRef}
      className="animate-scale-in overflow-hidden border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-0"
    >
      <div className="border-b border-slate-100 dark:border-slate-700 px-5 py-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {title}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            What {formatNaira(amount)} could fund
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="shrink-0 ml-3 mt-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          title="Download as image"
        >
          <Download
            className={`h-4 w-4 ${downloading ? "animate-pulse" : ""}`}
          />
        </button>
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
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                <AnimatedCount target={item.count} />
              </p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {item.label}
              </p>
              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                {item.unitLabel}
              </p>
              {item.contextNote && (
                <p className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500 italic">
                  {item.contextNote}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
