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
import { adminFetch } from "@/lib/api";

/**
 * Revoke a role from an admin (plan 62). Reason is always required; the API
 * 409s on revoking the last active super_admin — that message surfaces
 * verbatim via toast.
 */
export function RevokeRoleDialog({
  open,
  onOpenChange,
  admin,
  role,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  admin: { id: string; name: string } | null;
  role: string | null;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open, admin?.id, role]);

  async function handleRevoke() {
    if (!admin || !role || !reason.trim()) return;
    setBusy(true);
    try {
      await adminFetch("/roles/revoke", {
        method: "POST",
        body: JSON.stringify({
          adminId: admin.id,
          role,
          reason: reason.trim(),
        }),
      });
      toast.success(`Revoked ${role} from ${admin.name}`);
      onOpenChange(false);
      onDone();
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke role");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke role</DialogTitle>
          <DialogDescription>
            {admin && role
              ? `Remove the ${role} role from ${admin.name}. The revocation is audit-logged.`
              : "Remove this role."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>
            Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Why is this role being revoked?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={busy || !reason.trim() || !admin || !role}
          >
            {busy ? "Revoking…" : "Revoke role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
