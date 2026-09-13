"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DATE_PRECISIONS,
  PRECISION_LABEL,
  dateEncodingError,
  type DatePrecision,
} from "@/lib/elections";

/** The (precision, date) pair with its ONE legal encoding (plan 68 D4/D10.3). */
export interface ElectionDateValue {
  datePrecision: DatePrecision;
  /** Always API-shaped: null | "YYYY-MM-01" (month) | "YYYY-MM-DD" (day). */
  electionDate: string | null;
}

/**
 * INEC announces year → month → day in stages, so the precision control comes
 * first and DRIVES which date input exists — the encoding rule is enforced by
 * construction (year keeps no date at all, month stores day 01) and re-checked
 * with a named error for the half a keyboard can still get wrong (an emptied
 * date box on month/day precision).
 */
export function ElectionDateFields({
  value,
  onChange,
  disabled,
  idPrefix = "election",
}: {
  value: ElectionDateValue;
  onChange: (next: ElectionDateValue) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const problem = dateEncodingError(value.datePrecision, value.electionDate);
  const dateId = `${idPrefix}-date`;
  const problemId = `${dateId}-problem`;

  function setPrecision(next: DatePrecision) {
    if (next === "year") {
      onChange({ datePrecision: "year", electionDate: null });
      return;
    }
    // A stored day collapses to its month when precision widens; month → day
    // keeps the -01 until the operator picks the real day.
    const date =
      next === "month" && value.electionDate
        ? `${value.electionDate.slice(0, 7)}-01`
        : value.electionDate;
    onChange({ datePrecision: next, electionDate: date || null });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-precision`}>Date precision</Label>
        <Select
          value={value.datePrecision}
          onValueChange={(v) => setPrecision(v as DatePrecision)}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-precision`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_PRECISIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {PRECISION_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.datePrecision === "year" ? (
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Election date</Label>
          <p className="pt-2 text-xs text-muted-foreground">
            Only the cycle year is known — no date is stored until INEC narrows it.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor={dateId}>
            {value.datePrecision === "month" ? "Election month" : "Election date"}
          </Label>
          <Input
            id={dateId}
            type={value.datePrecision === "month" ? "month" : "date"}
            value={
              value.datePrecision === "month"
                ? (value.electionDate?.slice(0, 7) ?? "")
                : (value.electionDate ?? "")
            }
            disabled={disabled}
            aria-invalid={problem ? true : undefined}
            aria-describedby={problem ? problemId : undefined}
            onChange={(e) => {
              const raw = e.target.value;
              onChange({
                ...value,
                electionDate: raw
                  ? value.datePrecision === "month"
                    ? `${raw}-01`
                    : raw
                  : null,
              });
            }}
          />
          {problem ? (
            <p id={problemId} className="text-xs text-destructive">
              {problem}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
