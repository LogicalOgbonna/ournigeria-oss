import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Show } from "@/components/ui/Show";

export type RelatedLink = {
  href: string;
  label: string;
  sublabel?: string;
};

/**
 * Retention Phase 1 — in-session related-entity links.
 * A grid of link cards giving one-shot SEO visitors somewhere to go next.
 * Presentational + server-compatible; also the seam the Phase 3 question
 * cards plug into. Renders nothing when there are no items (never an empty box).
 */
export function RelatedLinks({
  title,
  items,
  columns = 3,
}: {
  title: string;
  items: RelatedLink[];
  columns?: 2 | 3;
}) {
  if (!items.length) return null;

  const cols =
    columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-3";

  return (
    <section className="space-y-6" data-testid="related-links">
      <h2 className="font-heading text-2xl font-semibold">{title}</h2>
      <div className={`grid ${cols} gap-4`}>
        {items.map((item) => (
          <Link
            key={`${item.href}::${item.label}`}
            href={item.href}
            className="group bg-card border border-border hover:border-emerald-500/50 transition-colors rounded-[8px] p-4 flex items-center justify-between gap-3"
          >
            <span className="min-w-0">
              <span className="block truncate font-sans font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {item.label}
              </span>
              <Show when={!!item.sublabel}>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.sublabel}
                </span>
              </Show>
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
