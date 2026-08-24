import { ldJson } from "@/lib/seo";

/**
 * Renders one or more schema.org JSON-LD blocks as <script> tags, with the
 * "<" escaping applied (user-submittable official names/bios can otherwise
 * break out of the script). Accepts a single object or an array; falsy entries
 * are skipped, so callers can inline conditionals:
 *
 *   <JsonLd data={[breadcrumb, org, faq.mainEntity.length ? faq : null]} />
 */
export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const blocks = (Array.isArray(data) ? data : [data]).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(block) }}
        />
      ))}
    </>
  );
}
