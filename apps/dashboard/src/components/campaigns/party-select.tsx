"use client";

import { useMemo } from "react";
import { ListField } from "@/components/campaigns/list-field";
import { publicFetch } from "@/lib/api";
import { useAsyncList } from "@/lib/hooks/use-geo-list";

export interface PartyOption {
  acronym: string;
  name: string;
  isActive: boolean;
}

/**
 * One in-flight/settled promise for the life of the page, same contract as
 * `loadGeo`: the registered-party list is ~23 rows and does not change during a
 * session. Module-level so the reference stays stable for `useAsyncList`.
 */
let partiesPromise: Promise<PartyOption[]> | null = null;

export function loadParties(): Promise<PartyOption[]> {
  if (partiesPromise) return partiesPromise;
  // The public list returns the whole party card (seats, officers, logo); only
  // the three columns the picker renders are kept.
  partiesPromise = (publicFetch("/api/parties") as Promise<PartyOption[]>)
    .then((rows) =>
      rows
        .map((p) => ({ acronym: p.acronym, name: p.name, isActive: p.isActive }))
        .sort((a, b) => a.acronym.localeCompare(b.acronym)),
    )
    .catch((err: unknown) => {
      // A failed load must not be cached forever — Retry re-issues the fetch.
      partiesPromise = null;
      throw err;
    });
  return partiesPromise;
}

/** The party list with the usual rows/loading/error/retry state. */
export function useParties() {
  return useAsyncList<PartyOption>(loadParties);
}

/**
 * The party a ticket runs under. Value is the acronym exactly as the API stores
 * it (`partyAcronym`, upper-cased server-side); de-registered parties stay in
 * the list so a historic race can still be recorded, marked "inactive".
 */
export function PartySelect({
  value,
  onChange,
  id = "party",
  label = "Party",
  disabled,
}: {
  value: string | null;
  onChange: (acronym: string) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
}) {
  const { rows, loading, error, retry } = useParties();
  const options = useMemo(
    () =>
      rows.map((p) => ({
        code: p.acronym,
        name: `${p.acronym} — ${p.name}${p.isActive ? "" : " (inactive)"}`,
      })),
    [rows],
  );

  return (
    <ListField
      id={id}
      label={label}
      placeholder="Select a party"
      emptyHint="No parties found"
      value={value}
      options={options}
      loading={loading}
      error={error}
      disabled={disabled}
      onRetry={retry}
      onChange={onChange}
    />
  );
}
