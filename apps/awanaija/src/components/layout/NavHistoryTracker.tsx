"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { humanizeLabel, syncEntry } from "@/lib/nav-history";

/**
 * Registers the current page in the nav-history breadcrumb so a downstream
 * BackButton can name it ("Back to Abia State"). Rendered once per page via
 * PageLayout. Pass `label` for a nice name; otherwise it's derived from the path.
 */
export function NavHistoryTracker({ label }: { label?: string }) {
  const pathname = usePathname();

  useEffect(() => {
    syncEntry(label?.trim() || humanizeLabel(pathname));
  }, [pathname, label]);

  return null;
}
