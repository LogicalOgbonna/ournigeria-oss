"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGeoList, type GeoOption } from "@/lib/hooks/use-geo-list";
import {
  CONSTITUENCY_TYPE,
  ELECTION_TYPES,
  ELECTION_TYPE_LABEL,
  SCOPE_FOR,
  seatStateCode,
  type ElectionType,
} from "@/lib/campaigns";

export const DEFAULT_ELECTION_YEAR = 2027;
const MIN_YEAR = 1999;
const MAX_YEAR = 2100;

/** Exactly the four race-key columns the API accepts (admin-campaigns.schemas raceScopeFor). */
export interface RaceKeyValue {
  electionType: ElectionType;
  year: number;
  stateCode?: string | null;
  constituencyCode?: string | null;
  lgaCode?: string | null;
}

function ListField({
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

/**
 * Election type + year + the ONE scope picker that race type needs. Controlled:
 * every change emits the whole value, using the exact key names the API expects.
 *
 * `stateCode` is emitted ONLY for gubernatorial races — raceScopeFor() rejects a
 * payload carrying more than one scope column, so for constituency/LGA races the
 * state selection stays local and only the seat code is emitted.
 */
export function RaceKeyFields({
  value,
  onChange,
  disabled,
  idPrefix = "race",
}: {
  value: RaceKeyValue;
  onChange: (next: RaceKeyValue) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const scope = SCOPE_FOR[value.electionType];
  const constituencyType = CONSTITUENCY_TYPE[value.electionType] ?? null;

  const [localState, setLocalState] = useState<string | null>(null);
  const [yearText, setYearText] = useState(String(value.year ?? DEFAULT_ELECTION_YEAR));

  useEffect(() => {
    setYearText((prev) => (Number.parseInt(prev, 10) === value.year ? prev : String(value.year)));
  }, [value.year]);

  const states = useGeoList(scope ? "/api/geo/states" : null);

  // Gubernatorial keeps the state on the value; seat races keep it here.
  const selectedState = scope === "state" ? (value.stateCode ?? null) : localState;

  // Editing an existing seat ticket: the row only carries the seat code, so the
  // state selector is seeded back out of it once the state list has arrived.
  const seatCode = scope === "constituency" ? value.constituencyCode : scope === "lga" ? value.lgaCode : null;
  useEffect(() => {
    if (scope === "state" || !seatCode || localState || states.rows.length === 0) return;
    const owner = seatStateCode(seatCode, states.rows.map((s) => s.code));
    if (owner) setLocalState(owner);
  }, [scope, seatCode, localState, states.rows]);

  const seatUrl =
    !selectedState || scope === "state" || scope === null
      ? null
      : scope === "lga"
        ? `/api/geo/lgas?state=${encodeURIComponent(selectedState)}`
        : `/api/geo/constituencies?state=${encodeURIComponent(selectedState)}${
            constituencyType ? `&type=${constituencyType}` : ""
          }`;
  const seats = useGeoList(seatUrl);

  function setType(next: ElectionType) {
    const nextScope = SCOPE_FOR[next];
    const sameConstituency =
      nextScope === "constituency" &&
      scope === "constituency" &&
      CONSTITUENCY_TYPE[next] === constituencyType;
    // The state survives every move between scoped races in BOTH directions —
    // senate(Abia) → governor keeps Abia just as governor → senate does — so it
    // always reads from the effective selection, not from the emitted column
    // (which is null for seat races).
    setLocalState(nextScope === "constituency" || nextScope === "lga" ? selectedState : null);
    onChange({
      ...value,
      electionType: next,
      // Codes that no longer apply are dropped; a seat only survives a type
      // change when the new type reads the same list (chairman ↔ councillor).
      stateCode: nextScope === "state" ? selectedState : null,
      constituencyCode: sameConstituency ? (value.constituencyCode ?? null) : null,
      lgaCode: nextScope === "lga" && scope === "lga" ? (value.lgaCode ?? null) : null,
    });
  }

  /** Blur/Enter: clamp into [MIN_YEAR, MAX_YEAR], or revert the text if it is not a number. */
  function commitYear() {
    const parsed = Number.parseInt(yearText, 10);
    if (!Number.isFinite(parsed)) {
      setYearText(String(value.year));
      return;
    }
    const clamped = Math.min(MAX_YEAR, Math.max(MIN_YEAR, parsed));
    setYearText(String(clamped));
    if (clamped !== value.year) onChange({ ...value, year: clamped });
  }

  function setStateCode(code: string) {
    if (scope === "state") {
      onChange({ ...value, stateCode: code, constituencyCode: null, lgaCode: null });
      return;
    }
    setLocalState(code);
    // The previous seat belongs to the previous state.
    onChange({ ...value, stateCode: null, constituencyCode: null, lgaCode: null });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-type`}>Race</Label>
        <Select
          value={value.electionType}
          onValueChange={(v) => setType(v as ElectionType)}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-type`} className="w-full">
            <SelectValue placeholder="Select a race" />
          </SelectTrigger>
          <SelectContent>
            {ELECTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {ELECTION_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-year`}>Election year</Label>
        <Input
          id={`${idPrefix}-year`}
          type="number"
          inputMode="numeric"
          step={1}
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={yearText}
          disabled={disabled}
          // Typing is local only — emitting per keystroke would push "2" and
          // "20" at the parent (and at the race-key uniqueness check) on the way
          // to "2027". The value commits on blur/Enter, clamped.
          onChange={(e) => setYearText(e.target.value)}
          onBlur={commitYear}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const parsed = Number.parseInt(yearText, 10);
            // Enter is only swallowed when it actually changes something —
            // on an unchanged year it stays an ordinary form submit.
            if (Number.isFinite(parsed) && parsed !== value.year) e.preventDefault();
            commitYear();
          }}
        />
      </div>

      {scope ? (
        <ListField
          id={`${idPrefix}-state`}
          label="State"
          placeholder="Select a state"
          value={selectedState}
          options={states.rows}
          loading={states.loading}
          error={states.error}
          disabled={disabled}
          onRetry={states.retry}
          onChange={setStateCode}
        />
      ) : null}

      {scope === "constituency" ? (
        <ListField
          id={`${idPrefix}-constituency`}
          label={
            constituencyType === "senatorial"
              ? "Senatorial district"
              : constituencyType === "federal"
                ? "Federal constituency"
                : "State constituency"
          }
          placeholder="Select a seat"
          emptyHint={selectedState ? "No seats found for this state" : "Pick a state first"}
          value={value.constituencyCode ?? null}
          options={seats.rows}
          loading={seats.loading}
          error={seats.error}
          disabled={disabled || !selectedState}
          onRetry={seats.retry}
          onChange={(code) =>
            onChange({ ...value, stateCode: null, constituencyCode: code, lgaCode: null })
          }
        />
      ) : null}

      {scope === "lga" ? (
        <ListField
          id={`${idPrefix}-lga`}
          label="LGA"
          placeholder="Select an LGA"
          emptyHint={selectedState ? "No LGAs found for this state" : "Pick a state first"}
          value={value.lgaCode ?? null}
          options={seats.rows}
          loading={seats.loading}
          error={seats.error}
          disabled={disabled || !selectedState}
          onRetry={seats.retry}
          onChange={(code) =>
            onChange({ ...value, stateCode: null, constituencyCode: null, lgaCode: code })
          }
        />
      ) : null}
    </div>
  );
}
