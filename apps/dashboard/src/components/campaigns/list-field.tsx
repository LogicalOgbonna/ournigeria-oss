"use client";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GeoOption } from "@/lib/hooks/use-geo-list";

/**
 * One labelled Select over a cached `{ code, name }` list, with the
 * loading/empty/error states those lists actually produce. Shared by the race
 * scope pickers and the party picker so a failed list looks the same
 * everywhere — a silently empty dropdown reads as "Nigeria has no states".
 */
export function ListField({
  id,
  label,
  placeholder,
  value,
  options,
  loading,
  error,
  disabled,
  emptyHint,
  onRetry,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string | null;
  options: GeoOption[];
  loading: boolean;
  error: string | null;
  disabled?: boolean;
  emptyHint?: string;
  onRetry: () => void;
  onChange: (code: string) => void;
}) {
  // A stored code the list cannot name yet — the state list failed to load, or
  // the seat's owning state could not be resolved. Radix only shows the
  // placeholder for an EMPTY value (shouldShowPlaceholder), so an unmatched
  // value renders blank: the raw code is drawn into the trigger by hand instead.
  // An operator must always be able to see which seat the ticket holds.
  const unresolved = value !== null && !options.some((o) => o.code === value);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {loading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <Select
          value={value ?? ""}
          onValueChange={onChange}
          disabled={disabled || !!error || options.length === 0}
        >
          <SelectTrigger id={id} className="w-full">
            {unresolved ? (
              <span className="min-w-0 truncate font-mono text-xs">{value}</span>
            ) : (
              <SelectValue
                placeholder={options.length === 0 ? (emptyHint ?? placeholder) : placeholder}
              />
            )}
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.code} value={o.code}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {error ? (
        <p className="text-xs text-destructive">
          {error}{" "}
          <button type="button" className="underline underline-offset-2" onClick={onRetry}>
            Retry
          </button>
        </p>
      ) : null}
    </div>
  );
}
