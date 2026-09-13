"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGeoList } from "@/lib/hooks/use-geo-list";

/**
 * Carve-outs on a nationwide event: the states whose seats sit OUTSIDE the
 * cycle (off-cycle governorships and the like). Only rendered for nationwide
 * events — the API rejects excludedStates on a scoped row.
 *
 * A Select that appends + a badge per picked state, rather than a checkbox
 * grid: the common case is two or three carve-outs out of 37.
 */
export function ExcludedStatesField({
  value,
  onChange,
  disabled,
  id = "election-excluded-states",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  id?: string;
}) {
  const states = useGeoList("/api/geo/states");
  const picked = new Set(value);
  const remaining = states.rows.filter((s) => !picked.has(s.code));
  const nameOf = (code: string) =>
    states.rows.find((s) => s.code === code)?.name ?? code;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Excluded states</Label>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((code) => (
            <Badge key={code} variant="secondary" className="gap-1 pr-1">
              {nameOf(code)}
              <button
                type="button"
                aria-label={`Remove ${nameOf(code)}`}
                className="rounded-sm p-0.5 hover:bg-muted-foreground/20 disabled:opacity-50"
                disabled={disabled}
                onClick={() => onChange(value.filter((c) => c !== code))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      {/* value="" after every pick: the Select is an appender, not a holder. */}
      <Select
        value=""
        onValueChange={(code) => onChange([...value, code])}
        disabled={disabled || !!states.error || remaining.length === 0}
      >
        <SelectTrigger id={id} className="w-full sm:w-[260px]">
          <SelectValue placeholder="Add an off-cycle state…" />
        </SelectTrigger>
        <SelectContent>
          {remaining.map((s) => (
            <SelectItem key={s.code} value={s.code}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        States carved OUT of this nationwide event (off-cycle governorships).
      </p>
      {states.error ? (
        <p className="text-xs text-destructive">
          {states.error}{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={states.retry}
          >
            Retry
          </button>
        </p>
      ) : null}
    </div>
  );
}
