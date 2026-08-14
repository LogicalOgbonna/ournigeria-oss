/**
 * Additive election module rendered on state/LGA/constituency pages ONLY when the
 * election gate is open for that entity. Placeholder — the content agent replaces
 * the internals. Keep the `data-election-section` attribute for SSR validation.
 */
export function ElectionSection({
  scope,
  name,
}: {
  scope: "state" | "lga" | "constituency";
  name: string;
}) {
  return (
    <section
      data-election-section={scope}
      className="rounded-2xl border border-primary/30 bg-primary/5 p-6"
      aria-label={`Election information for ${name}`}
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        Election season
      </p>
      <h2 className="mt-1 text-xl font-bold">{name} — election information</h2>
      <p className="mt-2 text-muted-foreground">
        Election coverage for this {scope} is now live.
      </p>
    </section>
  );
}
