"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  ShieldCheck,
  UserPlus,
  ShieldPlus,
  ShieldMinus,
  Settings2,
} from "lucide-react";
import { adminFetch, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { usePermissions } from "@/lib/permissions";
import { Forbidden } from "@/components/layout/forbidden";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import { RoleChips } from "@/components/admins/role-chips";
import {
  GrantRoleDialog,
  type RoleDef,
} from "@/components/admins/grant-role-dialog";
import { RevokeRoleDialog } from "@/components/admins/revoke-role-dialog";

interface AdminItem {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string | null;
  createdBy: { name: string; email: string } | null;
}

interface RoleAssignment {
  id: string;
  adminId: string;
  adminName: string;
  role: string;
  grantedAt: string;
  grantedBy: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  reason: string | null;
}

export default function AdminUsersPage() {
  const { can } = usePermissions();
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [rolesByAdmin, setRolesByAdmin] = useState<Record<string, string[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ email: "", password: "", name: "" });

  const [grantFor, setGrantFor] = useState<AdminItem | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{
    admin: AdminItem;
    role: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminItem | null>(null);

  const canManageAdmins = can("admins.manage");
  const canManageRoles = can("roles.manage");

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await adminFetch("/roles/assignments");
      const assignments: RoleAssignment[] = res.assignments ?? [];
      const grouped: Record<string, string[]> = {};
      for (const a of assignments) {
        if (a.revokedAt !== null) continue;
        (grouped[a.adminId] ??= []).push(a.role);
      }
      setRolesByAdmin(grouped);
    } catch {
      // Viewer may lack role visibility — chips just render "no roles".
      setRolesByAdmin({});
    }
  }, []);

  const fetchAdmins = useCallback(() => {
    setLoading(true);
    adminFetch("/auth/admins")
      .then((res) => {
        setAdmins(res.admins ?? []);
        setForbidden(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true);
        }
        setAdmins([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAdmins();
    void fetchAssignments();
    adminFetch("/roles")
      .then((res) => setRoles(res.roles ?? []))
      .catch(() => setRoles([]));
  }, [fetchAdmins, fetchAssignments]);

  async function handleCreate() {
    setSaving(true);
    setError("");
    try {
      await adminFetch("/auth/admins", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setCreateOpen(false);
      setForm({ email: "", password: "", name: "" });
      fetchAdmins();
    } catch (err: any) {
      setError(err?.message || "Failed to create admin");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await adminFetch(`/auth/admins/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success(`Deleted ${deleteTarget.name}`);
      fetchAdmins();
      void fetchAssignments();
    } catch (err: any) {
      // Surfaces the 409 "Cannot delete the last active super_admin" verbatim.
      toast.error(err?.message || "Failed to delete admin");
    }
  }

  const canCreate =
    form.email.trim() && form.password.length >= 6 && form.name.trim();

  if (forbidden) {
    return <Forbidden permission="admins.manage" />;
  }

  if (loading && admins.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Admin Users</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage admin access and roles for the dashboard
          </p>
        </div>
        {canManageAdmins && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-1.5" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Admin User</DialogTitle>
                <DialogDescription>
                  Create a new admin who can access this dashboard.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!canCreate || saving}>
                  {saving ? "Creating..." : "Create Admin"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {admins.map((admin) => {
          const activeRoles = rolesByAdmin[admin.id] ?? [];
          return (
            <Card key={admin.id}>
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{admin.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {admin.email}
                      </Badge>
                      <RoleChips roles={activeRoles} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>Created {formatDate(admin.createdAt)}</span>
                      {admin.lastLoginAt && (
                        <span>Last login {formatDate(admin.lastLoginAt)}</span>
                      )}
                      {admin.createdBy && (
                        <span>Added by {admin.createdBy.name}</span>
                      )}
                    </div>
                  </div>
                  {canManageRoles && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 shrink-0 text-muted-foreground"
                        >
                          <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                          Manage roles
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-xs">
                          {admin.name}
                        </DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => setGrantFor(admin)}>
                          <ShieldPlus className="h-3.5 w-3.5 mr-1.5" />
                          Grant role…
                        </DropdownMenuItem>
                        {activeRoles.length > 0 && <DropdownMenuSeparator />}
                        {activeRoles.map((role) => (
                          <DropdownMenuItem
                            key={role}
                            variant="destructive"
                            onSelect={() => setRevokeTarget({ admin, role })}
                          >
                            <ShieldMinus className="h-3.5 w-3.5 mr-1.5" />
                            Revoke {role}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {canManageAdmins && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive shrink-0"
                      onClick={() => setDeleteTarget(admin)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <GrantRoleDialog
        open={grantFor !== null}
        onOpenChange={(v) => {
          if (!v) setGrantFor(null);
        }}
        admin={grantFor}
        roles={roles}
        heldRoles={grantFor ? (rolesByAdmin[grantFor.id] ?? []) : []}
        onDone={() => void fetchAssignments()}
      />

      <RevokeRoleDialog
        open={revokeTarget !== null}
        onOpenChange={(v) => {
          if (!v) setRevokeTarget(null);
        }}
        admin={revokeTarget?.admin ?? null}
        role={revokeTarget?.role ?? null}
        onDone={() => void fetchAssignments()}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        title="Delete admin"
        description={
          deleteTarget
            ? `Remove ${deleteTarget.name} (${deleteTarget.email})? They will lose all dashboard access immediately.`
            : ""
        }
        confirmLabel="Delete admin"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
