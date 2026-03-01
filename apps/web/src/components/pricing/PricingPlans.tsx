"use client";

import { Check, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const TIERS = [
  {
    name: "Free",
    price: "₦0",
    description: "For casual citizens & students.",
    buttonText: "Current Plan",
    buttonVariant: "outline" as const,
    disabled: true,
    features: [
      { name: "10 messages / day", included: true },
      { name: "Budget & Corruption Analysis", included: true },
      { name: "Pidgin English Support", included: true },
      { name: "GovSpend Search", limit: "3 / day", included: true },
      { name: "Conversation History", limit: "24 Hours", included: true },
      { name: "Impact Analysis", included: false },
      { name: "Chart Exports", included: false },
      { name: "Long-Context RAG", included: false },
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
    disabled: false,
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
    disabled: false,
    features: [
      { name: "Unlimited messages", limit: "Fair Use", included: true },
      { name: "Unlimited History", included: true },
      { name: "Unlimited Impact Analysis", included: true },
      { name: "Source Doc Download", included: true },
      { name: "Long-Context RAG", limit: "Full PDFs", included: true },
      { name: "Premium AI Models", included: true },
      { name: "Priority Email Support", included: true },
      { name: "Custom Data Ingestion", included: false },
    ],
  },
];

export function PricingPlans({
  onUpgrade,
}: {
  onUpgrade?: (plan: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {TIERS.map((tier) => (
        <Card
          key={tier.name}
          className={cn(
            "relative flex flex-col p-6 shadow-sm transition-all",
            tier.popular
              ? "border-emerald-500 shadow-emerald-500/10 shadow-md md:scale-[1.02] z-10"
              : "hover:border-emerald-200 dark:hover:border-emerald-800",
          )}
        >
          {tier.popular && (
            <div className="absolute -top-3 left-0 right-0 mx-auto w-fit rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Most Popular
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {tier.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 h-8">
              {tier.description}
            </p>
          </div>

          <div className="mb-4 flex items-baseline text-3xl font-bold text-slate-900 dark:text-white">
            {tier.price}
            {tier.period && (
              <span className="ml-1 text-sm font-normal text-slate-500 dark:text-slate-400">
                {tier.period}
              </span>
            )}
          </div>

          <Button
            variant={tier.buttonVariant}
            className={cn(
              "mb-6 w-full",
              tier.popular && "bg-emerald-600 hover:bg-emerald-700 text-white",
            )}
            disabled={tier.disabled}
            onClick={() => onUpgrade?.(tier.name)}
          >
            {tier.popular && <Zap className="mr-1.5 h-3.5 w-3.5" />}
            {tier.buttonText}
          </Button>

          <div className="flex-1">
            <ul className="space-y-2.5 text-xs">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  {feature.included ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-700 mt-0.5" />
                  )}
                  <span
                    className={cn(
                      feature.included
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {feature.name}
                    {feature.limit && (
                      <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">
                        ({feature.limit})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ))}
    </div>
  );
}
