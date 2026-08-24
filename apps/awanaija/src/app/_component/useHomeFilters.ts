"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * The homepage's filters live in the URL so a view is shareable and survives a
 * reload: `?parties=true` swaps the candidate rail for a party's slate, `?year`
 * picks the election cycle, `?party` picks whose slate to show.
 *
 * Same read/write shape as `app/officials/_component/OfficialsClientContent` —
 * plain `next/navigation`, no extra state library.
 */
export function useHomeFilters({
  defaultYear,
  defaultParty,
}: {
  readonly defaultYear: number;
  readonly defaultParty: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null) next.delete(key);
      else next.set(key, value);

      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const year = Number(params.get("year"));

  return {
    parties: params.get("parties") === "true",
    year: Number.isFinite(year) && year > 0 ? year : defaultYear,
    party: params.get("party") ?? defaultParty,
    setParties: (on: boolean) => set("parties", on ? "true" : null),
    setYear: (next: number) => set("year", String(next)),
    setParty: (acronym: string) => set("party", acronym),
  };
}
