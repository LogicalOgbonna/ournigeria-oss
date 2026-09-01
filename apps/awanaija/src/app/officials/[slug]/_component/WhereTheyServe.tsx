import Link from "next/link";
import { ArrowUpRight, Building2, Landmark, Map, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RelatedLink } from "@/components/civic/RelatedLinks";

// Keyed on the sublabel strings built by OfficialProfile's serveLinks — reword
// a tier there and the icon silently falls back to MapPin.
const TIER_ICONS: Record<string, LucideIcon> = {
  State: Landmark,
  "Local Government": Building2,
  Ward: MapPin,
  Constituency: Map,
};

/**
 * "Where they serve" jurisdiction cells (Figma 529:47 / 541:578, elevated) —
 * tier kicker with icon over the jurisdiction name in brand green, one linked
 * cell per reachable jurisdiction page, hover arrow so the cells read as links.
 * Renders nothing without items.
 */
export function WhereTheyServe({ items }: { items: RelatedLink[] }) {
  if (!items.length) return null;

  return (
    // testid intentionally mirrors RelatedLinks — the related-links e2e spec
    // keys on it for the official-page jurisdictions test.
    <section className="space-y-6" data-testid="related-links">
      <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-ink-bright">
        Where they serve
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item) => {
          const Icon = (item.sublabel && TIER_ICONS[item.sublabel]) || MapPin;
          return (
            <Link
              key={`${item.href}::${item.label}`}
              href={item.href}
              title={item.label}
              className="group relative block rounded-[11px] border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-emerald-400 dark:border-line-night dark:bg-surface-night dark:hover:border-emerald-500"
            >
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-[#9fb0a0]">
                <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-brand-green" aria-hidden />
                {item.sublabel}
              </span>
              <span className="mt-2 block truncate font-sans text-2xl leading-tight text-emerald-600 dark:text-brand-green">
                {item.label}
              </span>
              <ArrowUpRight
                className="absolute right-4 top-4 h-4 w-4 text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-brand-green"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
