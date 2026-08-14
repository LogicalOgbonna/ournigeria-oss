"use client";

import { useEffect, useRef } from "react";
import { Check, X, Zap } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Show } from "@/components/ui/Show";

const TIERS = [
  {
    name: "Free",
    price: "₦0",
    description: "For casual citizens & students.",
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
    features: [
      { name: "10 messages / day", included: true },
      { name: "Budget Analysis", included: true },
      { name: "Corruption Tracker", included: true },
      { name: "Pidgin English Support", included: true },
      { name: "GovSpend Search", limit: "3 / day", included: true },
      { name: "Conversation History", limit: "24 Hours", included: true },
      { name: "Impact Analysis", included: false },
      { name: "Chart Exports", included: false },
    ],
  },
  {
    name: "Starter",
    price: "₦1,500",
    period: "/mo",
    description: "For active citizens & local journalists.",
    buttonText: "Upgrade to Starter",
    buttonVariant: "default" as const,
    popular: true,
    features: [
      { name: "100 messages / day", included: true },
      { name: "Unlimited GovSpend Search", included: true },
      { name: "Conversation History", limit: "30 Days", included: true },
      { name: "Impact Analysis", limit: "5 / day", included: true },
      { name: "Chart Export (PNG/CSV)", included: true },
      { name: "Public Sharing", included: true },
      { name: "Source Doc Download", included: false },
      { name: "Long-Context RAG", included: false },
    ],
  },
  {
    name: "Pro",
    price: "₦5,000",
    period: "/mo",
    description: "For professional analysts & researchers.",
    buttonText: "Upgrade to Pro",
    buttonVariant: "outline" as const,
    features: [
      { name: "Unlimited messages (Fair Use)", included: true },
      { name: "Unlimited Conversation History", included: true },
      { name: "Unlimited Impact Analysis", included: true },
      { name: "Source Doc Download", included: true },
      { name: "Long-Context RAG (Full PDFs)", included: true },
      { name: "Premium AI Models", included: true },
      { name: "Priority Email Support", included: true },
      { name: "Custom Data Ingestion", included: false },
    ],
  },
  {
    name: "Institutional",
    price: "₦50,000+",
    period: "/mo",
    description: "For newsrooms, NGOs & agencies.",
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    features: [
      { name: "Everything in Pro", included: true },
      { name: "Pooled Unlimited Usage", included: true },
      { name: "Team Seats (5+ included)", included: true },
      { name: "Custom Data Ingestion", included: true },
      { name: "API Access (1,000 calls/mo)", included: true },
      { name: "White-label Reports", included: true },
      { name: "Dedicated Rep", included: true },
    ],
  },
];

export function Pricing() {
  const { ref, isInView } = useInView({ threshold: 0.05 });
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isInView) return;
    let ctx: { revert: () => void } | null = null;

    const init = async () => {
      const gsap = (await import("gsap")).default;
      ctx = gsap.context(() => {
        gsap.fromTo(
          ".pricing-card",
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
          },
        );
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, [isInView]);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/20 via-background to-background dark:from-emerald-900/20" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16" ref={ref}>
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Pricing
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Simple, Transparent Plans
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From casual citizens checking their local government to newsrooms
            running deep investigations.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4 md:grid-cols-2">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "pricing-card relative flex flex-col rounded-3xl border bg-card p-8 shadow-sm opacity-0",
                tier.popular
                  ? "border-emerald-500 shadow-emerald-500/10 shadow-xl lg:scale-105 z-10"
                  : "hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors",
              )}
            >
              <Show when={!!tier.popular}>
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Most Popular
                </div>
              </Show>

              <div className="mb-6">
                <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground h-10">
                  {tier.description}
                </p>
              </div>

              <div className="mb-6 flex items-baseline text-4xl font-bold">
                {tier.price}
                <Show when={!!tier.period}>
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    {tier.period}
                  </span>
                </Show>
              </div>

              <Button
                variant={tier.buttonVariant}
                className={cn(
                  "mb-8 w-full rounded-xl",
                  tier.popular &&
                    "bg-emerald-600 hover:bg-emerald-700 text-white",
                )}
              >
                <Show when={!!tier.popular}><Zap className="mr-2 h-4 w-4" /></Show>
                {tier.buttonText}
              </Button>

              <div className="flex-1">
                <ul className="space-y-3 text-sm">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Show when={feature.included}>
                        <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      </Show>
                      <Show when={!feature.included}>
                        <X className="h-4 w-4 shrink-0 text-muted-foreground/40 mt-0.5" />
                      </Show>
                      <span
                        className={cn(
                          feature.included
                            ? "text-foreground"
                            : "text-muted-foreground/60",
                        )}
                      >
                        {feature.name}
                        {"limit" in feature && feature.limit && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({feature.limit})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
