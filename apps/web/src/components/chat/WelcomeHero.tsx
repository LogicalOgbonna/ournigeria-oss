"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pickRandomQuestions } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type { Language } from "@/types";
import Image from "next/image";
import {
  GraduationCap,
  TrendingUp,
  Home,
  BarChart3,
  Stethoscope,
  Building2,
  Sparkles,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap,
  TrendingUp,
  Home,
  BarChart3,
  Stethoscope,
  Building2,
};

interface WelcomeHeroProps {
  readonly onSuggestionClick: (question: string) => void;
}

export function WelcomeHero({ onSuggestionClick }: WelcomeHeroProps) {
  const [language, setLanguage] = useState<Language>(() => {
    if (globalThis.window !== undefined) {
      const stored = localStorage.getItem("ournigeria-language");
      if (stored === "pcm") return "pcm";
    }
    return "en";
  });

  const [questions, setQuestions] = useState(() =>
    pickRandomQuestions(language, 6),
  );

  useEffect(() => {
    const handleLanguageChange = (e: Event) => {
      const lang = (e as CustomEvent).detail;
      if (lang === "pcm" || lang === "en") {
        setLanguage(lang);
        setQuestions(pickRandomQuestions(lang, 6));
      }
    };
    globalThis.addEventListener("language-change", handleLanguageChange);
    return () =>
      globalThis.removeEventListener("language-change", handleLanguageChange);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 md:py-16">
      {/* Logo & Title */}
      <div className="animate-fade-in-up mb-8 text-center">
        <Image
          src="/long_logo_dark.svg"
          alt="OurNigeria"
          width={300}
          height={84}
          className="mx-auto mb-4 hidden dark:block"
          priority
        />
        <Image
          src="/long_logo_dark.svg"
          alt="OurNigeria"
          width={300}
          height={84}
          className="mx-auto mb-4 block brightness-0 dark:hidden"
          priority
        />
        <p className="mt-3 max-w-md text-base text-slate-500 dark:text-slate-400 md:text-lg">
          {t("welcome.subtitle", language)}
        </p>
      </div>

      {/* Suggested Questions Grid */}
      <div className="w-full max-w-2xl">
        <p className="mb-4 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
          {t("welcome.tryAsking", language)}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {questions.map((q, i) => {
            const Icon = iconMap[q.icon] || Sparkles;
            return (
              <Card
                key={q.text}
                className={`animate-fade-in-up stagger-${i + 1} group cursor-pointer border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 p-4 opacity-0 backdrop-blur-sm transition-all duration-200 hover:border-emerald-200 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:shadow-md hover:shadow-emerald-500/5`}
                onClick={() => onSuggestionClick(q.text)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50">
                    <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-snug text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      {q.text}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500"
                    >
                      {q.category}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
