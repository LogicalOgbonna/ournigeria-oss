// JSON-LD helpers for the geo pages (state / LGA / ward).

/**
 * Serialize JSON-LD safely. State/LGA/ward pages embed official names + bios that are
 * user-submittable (via the proposals/identify flow), so escape "<" to prevent a
 * "</script>" breakout (XSS). Mirrors the helper in officials/[slug]/page.tsx.
 */
export function ldJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

/** Build a schema.org BreadcrumbList from an ordered list of {name, item(url)} crumbs. */
export function breadcrumbLd(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  };
}
