"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminFetch } from "@/lib/api";

export interface RoleDef {
  name: string;
  description: string;
  assignable: boolean;
  permissions: string[];
}

/**
 * Grant a role to an admin (plan 62). Reason is client-required for
 * super_admin (the API enforces it too); the API 403s self-grants and
 * 409s duplicates — those messages surface verbatim via toast.
 */
export function GrantRoleDialog({
  open,
  onOpenChange,
  admin,
  roles,
  heldRoles,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  admin: { id: string; name: string } | null;
  roles: RoleDef[];
  heldRoles: string[];
  onDone: () => void;
}) {
  const [role, setRole] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setRole("");
      setReason("");
    }
  }, [open, admin?.id]);

  const held = new Set(heldRoles);
  const grantable = roles.filter((r) => r.assignable && !held.has(r.name));
  const selected = grantable.find((r) => r.name === role) ?? null;
  const reasonRequired = role === "super_admin";
  const canSubmit =
    !!admin && !!role && !busy && (!reasonRequired || reason.trim().length > 0);

  async function handleGrant() {
    if (!admin || !role) return;
    setBusy(true);
    try {
      await adminFetch("/roles/grant", {
        method: "POST",
        body: JSON.stringify({
          adminId: admin.id,
          role,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        }),
      });
      toast.success(`Granted ${role} to ${admin.name}`);
      onOpenChange(false);
      onDone();
    } catch (err: any) {
      toast.error(err?.message || "Failed to grant role");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant role</DialogTitle>
          <DialogDescription>
            {admin
              ? `Assign a role to ${admin.name}. The grant is audit-logged.`
              : "Assign a role to this admin."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Role</Label>
            {grantable.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No grantable roles left for this admin.
              </p>
            ) : (
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {grantable.map((r) => (
                    <SelectItem key={r.name} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {selected && (
            <div className="max-h-36 overflow-y-auto rounded-md border bg-muted/40 p-3 space-y-2">
              {selected.description && (
                <p className="text-xs text-muted-foreground">
                  {selected.description}
                </p>
              )}
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {selected.permissions.map((p) => (
                  <code
                    key={p}
                    className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {p}
                  </code>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>
              Reason
              {reasonRequired && <span className="text-destructive"> *</span>}
            </Label>
            <Textarea
              placeholder="Why is this role being granted? (required for super admin)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={handleGrant} disabled={!canSubmit}>
            {busy ? "Granting…" : "Grant role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
