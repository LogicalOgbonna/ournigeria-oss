"use client";

import { Button } from "@/components/ui/button";
import { ListField } from "@/components/campaigns/list-field";
import { useGeoList } from "@/lib/hooks/use-geo-list";
import { CONSTITUENCY_TYPE } from "@/lib/campaigns";
import type { ElectionOffice } from "@/lib/elections";

/**
 * The four scope columns an election event carries — all nullable, all-null =
 * nationwide (plan 68 §1). Unlike a campaign's race key (exactly ONE scope
 * code), an event keeps the whole arc and the API auto-fills parents, so this
 * emits every level the operator picked.
 */
export interface ElectionScope {
  stateCode: string | null;
  constituencyCode: string | null;
  lgaCode: string | null;
  wardCode: string | null;
}

export const NATIONWIDE: ElectionScope = {
  stateCode: null,
  constituencyCode: null,
  lgaCode: null,
  wardCode: null,
};

/** Which narrower pickers an office's events can scope to (admin-elections.service). */
function levelsFor(office: ElectionOffice): { constituency: boolean; lga: boolean; ward: boolean } {
  return {
    constituency: office in CONSTITUENCY_TYPE,
    lga: office === "lga_chairman" || office === "councilor",
    ward: office === "councilor",
  };
}

/**
 * State → (constituency | LGA → ward) pickers, reusing the campaign geo list
 * field. Every level is OPTIONAL — "2027 senate elections" is a nationwide
 * event with no scope at all; picking a state narrows it, picking a seat
 * narrows it further. Narrowest non-null wins for display (plan 68 §1).
 */
export function ElectionScopeFields({
  office,
  value,
  onChange,
  disabled,
  idPrefix = "election",
}: {
  office: ElectionOffice;
  value: ElectionScope;
  onChange: (next: ElectionScope) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const levels = levelsFor(office);
  const states = useGeoList("/api/geo/states");
  const seats = useGeoList(
    levels.constituency && value.stateCode
      ? `/api/geo/constituencies?state=${encodeURIComponent(value.stateCode)}&type=${
          CONSTITUENCY_TYPE[office]
        }`
      : null,
  );
  const lgas = useGeoList(
    levels.lga && value.stateCode
      ? `/api/geo/lgas?state=${encodeURIComponent(value.stateCode)}`
      : null,
  );
  const wards = useGeoList(
    levels.ward && value.lgaCode
      ? `/api/geo/wards?lga=${encodeURIComponent(value.lgaCode)}`
      : null,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <ListField
            id={`${idPrefix}-state`}
            label="State (optional)"
            placeholder="Nationwide"
            value={value.stateCode}
            options={states.rows}
            loading={states.loading}
            error={states.error}
            disabled={disabled}
            onRetry={states.retry}
            // A new state orphans every narrower code beneath the old one.
            onChange={(code) =>
              onChange({ ...NATIONWIDE, stateCode: code })
            }
          />
          {value.stateCode ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange(NATIONWIDE)}
            >
              Clear — make it nationwide
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Leave empty for a nationwide event.
            </p>
          )}
        </div>

        {levels.constituency ? (
          <ListField
            id={`${idPrefix}-constituency`}
            label={
              CONSTITUENCY_TYPE[office] === "senatorial"
                ? "Senatorial district (optional)"
                : CONSTITUENCY_TYPE[office] === "federal"
                  ? "Federal constituency (optional)"
                  : "State constituency (optional)"
            }
            placeholder="Whole state"
            emptyHint={
              value.stateCode ? "No seats found for this state" : "Pick a state first"
            }
            value={value.constituencyCode}
            options={seats.rows}
            loading={seats.loading}
            error={seats.error}
            disabled={disabled || !value.stateCode}
            onRetry={seats.retry}
            onChange={(code) =>
              onChange({ ...value, constituencyCode: code, lgaCode: null, wardCode: null })
            }
          />
        ) : null}

        {levels.lga ? (
          <ListField
            id={`${idPrefix}-lga`}
            label="LGA (optional)"
            placeholder="Whole state"
            emptyHint={
              value.stateCode ? "No LGAs found for this state" : "Pick a state first"
            }
            value={value.lgaCode}
            options={lgas.rows}
            loading={lgas.loading}
            error={lgas.error}
            disabled={disabled || !value.stateCode}
            onRetry={lgas.retry}
            onChange={(code) =>
              onChange({ ...value, constituencyCode: null, lgaCode: code, wardCode: null })
            }
          />
        ) : null}

        {levels.ward ? (
          <div className="space-y-1.5">
            <ListField
              id={`${idPrefix}-ward`}
              label="Ward (optional)"
              placeholder="Whole LGA"
              emptyHint={value.lgaCode ? "No wards found for this LGA" : "Pick an LGA first"}
              value={value.wardCode}
              options={wards.rows}
              loading={wards.loading}
              error={wards.error}
              disabled={disabled || !value.lgaCode}
              onRetry={wards.retry}
              onChange={(code) => onChange({ ...value, wardCode: code })}
            />
            {/* Plan 68 E1.3: campaigns carry no ward column, so a ward-scoped
                event never auto-attaches tickets — say so where it is picked. */}
            <p className="text-xs text-muted-foreground">
              Tickets never auto-attach to a ward-scoped event (a ticket has no
              ward) — attach them by hand. Results still auto-attach.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
