"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Forbidden } from "@/components/layout/forbidden";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import {
  EMPTY_ROLE_FORM,
  ROLE_LABEL_MAX,
  roleCreateBody,
  roleFormOf,
  rolePatchBody,
  roleProblems,
  type RoleFormValues,
} from "@/lib/campaign-council";
import { campaignsApi, errorMessage, type CouncilRole } from "@/lib/campaigns";
import { useResource } from "@/lib/hooks/use-resource";
import { usePermissions } from "@/lib/permissions";

/** Code, Label, Sort order, Active, Actions — the empty/skeleton cells span them. */
const COLUMN_COUNT = 5;

/**
 * The shared council role catalog behind every ticket's Council tab.
 *
 * A role that any member references cannot be deleted (the API answers 409 and
 * says how many hold it) — deactivating it is the way out: `assertRole` refuses
 * an inactive code for a NEW assignment while leaving the members already on it
 * untouched.
 */
export default function CampaignRolesPage() {
  const { loading: permsLoading, can } = usePermissions();
  const canRead = can("campaigns.read");
  const canWrite = can("campaigns.write");
  const ready = !permsLoading && canRead;
  const denied = !permsLoading && !canRead;

  const { data, loading, error, refetch } = useResource(() => campaignsApi.roles(), [], {
    enabled: ready,
  });
  const roles = data ?? [];

  const [adding, setAdding] = useState<RoleFormValues>(EMPTY_ROLE_FORM);
  const [addShowProblems, setAddShowProblems] = useState(false);
  const [editing, setEditing] = useState<RoleFormValues | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<CouncilRole | null>(null);
  // Focus follows the edit: into the label box on the way in, back to the Edit
  // button that opened it on the way out — otherwise Cancel drops the caret at
  // the top of the document.
  const labelInput = useRef<HTMLInputElement>(null);
  const editButtons = useRef(new Map<string, HTMLButtonElement | null>());
  const [refocus, setRefocus] = useState<string | null>(null);
  const editingCode = editing?.code ?? null;
  useEffect(() => {
    if (editingCode) labelInput.current?.focus();
  }, [editingCode]);
  useEffect(() => {
    if (!refocus) return;
    editButtons.current.get(refocus)?.focus();
    setRefocus(null);
  }, [refocus]);

  /** Leave edit mode and hand focus back to the row that owns it. */
  function stopEditing(code: string) {
    setEditing(null);
    setRefocus(code);
  }

  const addProblems = roleProblems(adding, {
    checkCode: true,
    taken: roles.map((r) => r.code),
  });
  const editProblems = editing ? roleProblems(editing) : {};
  // Problems are only wired to the inputs once the operator has tried to
  // submit — an aria-invalid box on a form nobody has touched is noise.
  const showAdd: Partial<Record<keyof RoleFormValues, string>> = addShowProblems
    ? addProblems
    : {};

  async function addRole() {
    if (Object.keys(addProblems).length > 0) {
      setAddShowProblems(true);
      return;
    }
    setBusy(true);
    try {
      await campaignsApi.createRole(roleCreateBody(adding));
      toast.success(`Role ${adding.code.trim()} added`);
      setAdding(EMPTY_ROLE_FORM);
      setAddShowProblems(false);
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveRole(base: CouncilRole) {
    if (!editing || Object.keys(editProblems).length > 0) return;
    const body = rolePatchBody(editing, base);
    if (Object.keys(body).length === 0) {
      stopEditing(base.code);
      return;
    }
    setBusy(true);
    try {
      await campaignsApi.patchRole(base.code, body);
      toast.success(`Role ${base.code} updated`);
      stopEditing(base.code);
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteRole(role: CouncilRole) {
    setBusy(true);
    try {
      await campaignsApi.deleteRole(role.code);
      toast.success(`Role ${role.code} deleted`);
      refetch();
    } catch (err) {
      // A referenced role is a 409 whose message counts the members holding it.
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (denied) return <Forbidden permission="campaigns.read" />;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All tickets
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">Council Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One shared catalog for every ticket&apos;s council. Only active roles can be
            assigned; a role someone already holds cannot be deleted — deactivate it
            instead.
          </p>
        </div>
      </div>

      {!canWrite ? (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          You are reading the council role catalog. Editing needs{" "}
          <code className="font-mono text-xs">campaigns.write</code>.
        </p>
      ) : null}

      {error ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Code</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-[120px]">Sort order</TableHead>
              <TableHead className="w-[110px]">Active</TableHead>
              <TableHead className="w-[130px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && roles.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} aria-hidden="true">
                  {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No council roles yet.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => {
                const isEditing = editing?.code === role.code;
                return (
                  <TableRow key={role.code} className={isEditing ? "bg-muted/30" : undefined}>
                    <TableCell className="font-mono text-xs">{role.code}</TableCell>
                    <TableCell>
                      {isEditing && editing ? (
                        <>
                          <Input
                            ref={labelInput}
                            aria-label={`Label for ${role.code}`}
                            maxLength={ROLE_LABEL_MAX}
                            disabled={busy}
                            aria-invalid={editProblems.label ? true : undefined}
                            aria-describedby={
                              editProblems.label ? `${role.code}-label-error` : undefined
                            }
                            value={editing.label}
                            onChange={(e) =>
                              setEditing({ ...editing, label: e.target.value })
                            }
                          />
                          {editProblems.label ? (
                            <p
                              id={`${role.code}-label-error`}
                              className="mt-1 text-xs text-destructive"
                            >
                              {editProblems.label}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-sm">{role.label}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing && editing ? (
                        <>
                          <Input
                            aria-label={`Sort order for ${role.code}`}
                            inputMode="numeric"
                            disabled={busy}
                            aria-invalid={editProblems.sortOrder ? true : undefined}
                            aria-describedby={
                              editProblems.sortOrder ? `${role.code}-sort-error` : undefined
                            }
                            value={editing.sortOrder}
                            onChange={(e) =>
                              setEditing({ ...editing, sortOrder: e.target.value })
                            }
                          />
                          {editProblems.sortOrder ? (
                            <p
                              id={`${role.code}-sort-error`}
                              className="mt-1 text-xs text-destructive"
                            >
                              {editProblems.sortOrder}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {role.sortOrder}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing && editing ? (
                        <Switch
                          aria-label={`Active for ${role.code}`}
                          disabled={busy}
                          checked={editing.isActive}
                          onCheckedChange={(v) => setEditing({ ...editing, isActive: v })}
                        />
                      ) : role.isActive ? (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!canWrite ? null : isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            disabled={busy || Object.keys(editProblems).length > 0}
                            onClick={() => void saveRole(role)}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Save
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label="Cancel edit"
                            disabled={busy}
                            onClick={() => stopEditing(role.code)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            ref={(el) => {
                              editButtons.current.set(role.code, el);
                            }}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label={`Edit ${role.code}`}
                            disabled={busy}
                            onClick={() => setEditing(roleFormOf(role))}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            aria-label={`Delete ${role.code}`}
                            disabled={busy}
                            onClick={() => setRemoving(role)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {canWrite ? (
        <div className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium">Add a role</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_120px_auto] sm:items-start">
            <div className="space-y-1.5">
              <Label htmlFor="new-role-code">Code</Label>
              <Input
                id="new-role-code"
                placeholder="state_director"
                className="font-mono text-xs"
                disabled={busy}
                aria-invalid={showAdd.code ? true : undefined}
                aria-describedby={showAdd.code ? "new-role-code-error" : undefined}
                value={adding.code}
                onChange={(e) => setAdding({ ...adding, code: e.target.value })}
              />
              {showAdd.code ? (
                <p id="new-role-code-error" className="text-xs text-destructive">
                  {showAdd.code}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-role-label">Label</Label>
              <Input
                id="new-role-label"
                placeholder="State Director"
                maxLength={ROLE_LABEL_MAX}
                disabled={busy}
                aria-invalid={showAdd.label ? true : undefined}
                aria-describedby={showAdd.label ? "new-role-label-error" : undefined}
                value={adding.label}
                onChange={(e) => setAdding({ ...adding, label: e.target.value })}
              />
              {showAdd.label ? (
                <p id="new-role-label-error" className="text-xs text-destructive">
                  {showAdd.label}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-role-sort">Sort order</Label>
              <Input
                id="new-role-sort"
                inputMode="numeric"
                placeholder="0"
                disabled={busy}
                aria-invalid={showAdd.sortOrder ? true : undefined}
                aria-describedby={showAdd.sortOrder ? "new-role-sort-error" : undefined}
                value={adding.sortOrder}
                onChange={(e) => setAdding({ ...adding, sortOrder: e.target.value })}
              />
              {showAdd.sortOrder ? (
                <p id="new-role-sort-error" className="text-xs text-destructive">
                  {showAdd.sortOrder}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              {/* Spacer keeps the button on the same baseline as the inputs. */}
              <span className="hidden text-sm sm:block sm:h-5" aria-hidden="true" />
              <Button disabled={busy} onClick={() => void addRole()}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add role
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(v) => {
          if (!v) setRemoving(null);
        }}
        title="Delete this role?"
        description={
          removing
            ? `${removing.label} (${removing.code}) is removed from the catalog. If any council member holds it the API refuses — deactivate the role instead.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          const target = removing;
          setRemoving(null);
          if (target) await deleteRole(target);
        }}
      />
    </div>
  );
}
