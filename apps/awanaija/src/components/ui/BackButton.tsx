"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { currentIndex, previousLabel } from "@/lib/nav-history";

interface BackButtonProps {
  /**
   * Where to go when there is no in-app page to return to (deep link, opened in
   * a new tab, arrived from search/social). Also the middle/cmd-click target.
   */
  fallbackHref: string;
  /**
   * Name of the fallback destination, used only when there's no in-app history
   * — e.g. "officials" renders "Back to officials". Omit for a bare "Back".
   */
  fallbackLabel?: string;
  /** Extra classes (spacing, theme color overrides). */
  className?: string;
  /** Leading icon. Defaults to a left arrow; pass `null` to hide it. */
  icon?: ReactNode;
}

/**
 * Harmonized "back" affordance. Deterministic by design: a normal left-click
 * returns to the *actual previous page* via browser history, and the label
 * names that page ("Back to Lagos State") rather than a hardcoded parent — the
 * label always matches where the click actually goes.
 *
 * It renders a real anchor to `fallbackHref`, so cmd/middle-click opens the
 * parent in a new tab, crawlers/no-JS see a valid link, and when there's no
 * in-app history (deep link / fresh tab) a plain click falls through to
 * `fallbackHref` labelled "Back to {fallbackLabel}".
 */
export function BackButton({
  fallbackHref,
  fallbackLabel,
  className,
  icon,
}: BackButtonProps) {
  const router = useRouter();

  // Server + first client render show the fallback label so hydration matches;
  // an effect then resolves the real previous page (client-only history state).
  const fallback = fallbackLabel ? `Back to ${fallbackLabel}` : "Back";
  const [label, setLabel] = useState(fallback);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const idx = currentIndex();
    if (idx > 0) {
      // There is an in-app page to return to. Name it if we recorded a label,
      // otherwise a generic "Back" (still goes to the real previous page).
      const prev = previousLabel(idx);
      setCanGoBack(true);
      setLabel(prev ? `Back to ${prev}` : "Back");
    } else {
      setCanGoBack(false);
      setLabel(fallback);
    }
  }, [fallback]);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Let modified clicks (new tab / new window) behave as a normal link.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (canGoBack) {
      e.preventDefault();
      router.back();
    }
    // else: allow default navigation to fallbackHref
  }

  return (
    <Link
      href={fallbackHref}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {icon ?? <ArrowLeft className="h-4 w-4" />}
      {label}
    </Link>
  );
}
