"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListField } from "@/components/campaigns/list-field";
import { OfficialPicker } from "@/components/campaigns/official-picker";
import {
  EMPTY_MEMBER_FORM,
  SCOPE_LEVELS,
  SCOPE_LEVEL_LABEL,
  memberFormOf,
  memberProblems,
  type MemberFormValues,
  type ScopeLevel,
} from "@/lib/campaign-council";
import { errorMessage, type CouncilMember, type CouncilRole } from "@/lib/campaigns";
import { useGeoList } from "@/lib/hooks/use-geo-list";

export interface CouncilMemberDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** The row being edited, or null to add a new member. */
  member: CouncilMember | null;
  roles: CouncilRole[];
  rolesLoading: boolean;
  rolesError: string | null;
  /**
   * Add or save. Rejecting keeps the dialog open with the message inline, so a
   * 409 ("this official already holds that role") never costs the typed form.
   */
  onSubmit: (form: MemberFormValues) => Promise<void>;
}

/**
 * The add/edit form for one council member.
 *
 * A LINKED official has no name field at all: `resolvePerson` takes the name
 * (and the fallback portrait) from the official's own row, and a `name` sent
 * alongside a kept `officialId` is a 400. Clearing the link is what turns the
 * free-text name back on.
 */
export function CouncilMemberDialog({
  open,
  onOpenChange,
  member,
  roles,
  rolesLoading,
  rolesError,
  onSubmit,
}: CouncilMemberDialogProps) {
  const fieldId = useId();
  const [form, setForm] = useState<MemberFormValues>(EMPTY_MEMBER_FORM);
  const [showProblems, setShowProblems] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed every time the dialog opens (or switches rows) — never while it is
  // open, or a refetch mid-edit would wipe what is being typed.
  useEffect(() => {
    if (!open) return;
    setForm(member ? memberFormOf(member) : EMPTY_MEMBER_FORM);
    setShowProblems(false);
    setError(null);
  }, [open, member]);

  const states = useGeoList(open && form.scopeLevel !== "national" ? "/api/geo/states" : null);
  // The LGA list needs its state first — that is why an LGA-scoped member still
  // picks a state here, even though only `lgaCode` is sent (the API reads the
  // owning state off the LGA row).
  const lgas = useGeoList(
    open && form.scopeLevel === "lga" && form.stateCode
      ? `/api/geo/lgas?state=${encodeURIComponent(form.stateCode)}`
      : null,
  );

  /**
   * Only ACTIVE roles may be assigned (`assertRole` rejects an inactive code),
   * but a member sitting on a role that was since deactivated must still be
   * editable — so their own code stays in the list, marked.
   */
  const roleOptions = useMemo(() => {
    const active = roles.filter((r) => r.isActive);
    const current = member?.roleCode;
    if (current && !active.some((r) => r.code === current)) {
      const stale = roles.find((r) => r.code === current);
      return [
        { code: current, label: `${stale?.label ?? current} (inactive)` },
        ...active.map((r) => ({ code: r.code, label: r.label })),
      ];
    }
    return active.map((r) => ({ code: r.code, label: r.label }));
  }, [roles, member?.roleCode]);

  const personErrorId = `${fieldId}-person-error`;
  const roleMessageId = `${fieldId}-role-message`;
  const startErrorId = `${fieldId}-start-error`;
  const orderMessageId = `${fieldId}-order-message`;
  const formErrorId = `${fieldId}-form-error`;

  const problems = memberProblems(form);
  const problem = (key: keyof MemberFormValues) =>
    showProblems ? problems[key] : undefined;
  const linked = Boolean(form.person?.officialId);

  function setScopeLevel(level: ScopeLevel) {
    setForm((f) => ({
      ...f,
      scopeLevel: level,
      // The state survives state ↔ LGA (an LGA needs one anyway); going back to
      // national drops both codes so a stale one cannot be sent.
      stateCode: level === "national" ? null : f.stateCode,
      lgaCode: level === "lga" ? f.lgaCode : null,
    }));
  }

  async function submit() {
    if (busy) return;
    if (Object.keys(problems).length > 0) {
      setShowProblems(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (busy ? undefined : onOpenChange(v))}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "Edit council member" : "Add council member"}</DialogTitle>
          <DialogDescription>
            Who they are, what they do on this ticket, and where they do it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <OfficialPicker
              label="Person"
              value={form.person}
              disabled={busy}
              invalid={Boolean(problem("person"))}
              describedBy={problem("person") ? personErrorId : undefined}
              placeholder="Search officials, or type a name…"
              onChange={(person) => setForm((f) => ({ ...f, person }))}
            />
            {linked ? (
              <p className="text-xs text-muted-foreground">
                Linked official — the name comes from that official&apos;s record and
                cannot be edited here. Clear the link to type a plain name instead.
              </p>
            ) : null}
            {problem("person") ? (
              <p id={personErrorId} className="text-xs text-destructive">
                {problem("person")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${fieldId}-role`}>Role</Label>
            <Select
              value={form.roleCode || ""}
              disabled={busy || rolesLoading || !!rolesError || roleOptions.length === 0}
              onValueChange={(roleCode) => setForm((f) => ({ ...f, roleCode }))}
            >
              <SelectTrigger
                id={`${fieldId}-role`}
                className="w-full"
                aria-invalid={problem("roleCode") ? true : undefined}
                aria-describedby={roleMessageId}
              >
                <SelectValue
                  placeholder={
                    rolesLoading
                      ? "Loading roles…"
                      : roleOptions.length === 0
                        ? "No active roles — add one under Council Roles"
                        : "Pick a role"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* The catalog failing to load and "you did not pick one" are the
                same field's problem; one node says whichever applies. */}
            {rolesError || problem("roleCode") ? (
              <p id={roleMessageId} className="text-xs text-destructive">
                {rolesError ?? problem("roleCode")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${fieldId}-scope`}>Scope</Label>
            <Select
              value={form.scopeLevel}
              disabled={busy}
              onValueChange={(v) => setScopeLevel(v as ScopeLevel)}
            >
              <SelectTrigger id={`${fieldId}-scope`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {SCOPE_LEVEL_LABEL[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.scopeLevel !== "national" ? (
            <ListField
              id={`${fieldId}-state`}
              label="State"
              placeholder="Pick a state"
              value={form.stateCode}
              options={states.rows}
              loading={states.loading}
              error={states.error}
              problem={problem("stateCode")}
              disabled={busy}
              onRetry={states.retry}
              onChange={(stateCode) => setForm((f) => ({ ...f, stateCode, lgaCode: null }))}
            />
          ) : null}

          {form.scopeLevel === "lga" ? (
            <ListField
              id={`${fieldId}-lga`}
              label="LGA"
              placeholder="Pick an LGA"
              emptyHint="Pick a state first"
              value={form.lgaCode}
              options={lgas.rows}
              loading={lgas.loading}
              error={lgas.error}
              problem={problem("lgaCode")}
              disabled={busy || !form.stateCode}
              onRetry={lgas.retry}
              onChange={(lgaCode) => setForm((f) => ({ ...f, lgaCode }))}
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${fieldId}-start`}>Start date</Label>
              <Input
                id={`${fieldId}-start`}
                type="date"
                disabled={busy}
                aria-invalid={problem("startDate") ? true : undefined}
                aria-describedby={problem("startDate") ? startErrorId : undefined}
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
              {problem("startDate") ? (
                <p id={startErrorId} className="text-xs text-destructive">
                  {problem("startDate")}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${fieldId}-order`}>Display order</Label>
              <Input
                id={`${fieldId}-order`}
                inputMode="numeric"
                placeholder="0"
                disabled={busy}
                aria-invalid={problem("displayOrder") ? true : undefined}
                aria-describedby={orderMessageId}
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
              />
              {/* One node, hint or error: swapping which id exists would leave
                  aria-describedby pointing at a element that is not there. */}
              <p
                id={orderMessageId}
                className={
                  problem("displayOrder")
                    ? "text-xs text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                {problem("displayOrder") ?? "Lowest first."}
              </p>
            </div>
          </div>

          {error ? (
            <p id={formErrorId} role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Working…" : member ? "Save member" : "Add member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
