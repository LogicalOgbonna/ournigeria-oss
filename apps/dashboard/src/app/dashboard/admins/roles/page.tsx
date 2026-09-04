"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, GitPullRequest, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminFetch, ApiError } from "@/lib/api";
import { Forbidden } from "@/components/layout/forbidden";
import type { RoleDef } from "@/components/admins/grant-role-dialog";

/** Resource bucket = everything before the first dot ("officials.slug.update" → "officials"). */
function resourceOf(permission: string) {
  return permission.split(".")[0];
}

function groupByResource(permissions: string[]) {
  const groups = new Map<string, string[]>();
  for (const p of permissions) {
    const key = resourceOf(p);
    const bucket = groups.get(key);
    if (bucket) bucket.push(p);
    else groups.set(key, [p]);
  }
  return groups;
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    adminFetch("/roles")
      .then((res) => {
        setRoles(res.roles ?? []);
        setForbidden(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setForbidden(true);
        setRoles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // super_admin's bundle is the full catalog, so it doubles as the canonical
  // permission ordering for the matrix; fall back to the union if absent.
  const allPermissions = useMemo(() => {
    const superAdmin = roles.find((r) => r.name === "super_admin");
    if (superAdmin) return superAdmin.permissions;
    const seen = new Set<string>();
    const union: string[] = [];
    for (const role of roles) {
      for (const p of role.permissions) {
        if (!seen.has(p)) {
          seen.add(p);
          union.push(p);
        }
      }
    }
    return union;
  }, [roles]);

  const heldByRole = useMemo(
    () => new Map(roles.map((r) => [r.name, new Set(r.permissions)])),
    [roles],
  );

  if (forbidden) return <Forbidden permission="admins.manage" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">
          Roles &amp; Permissions
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Every predefined role and the permissions it holds
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
        <GitPullRequest className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Role bundles are versioned code, not database rows — changing what a
          role can do requires a reviewed pull request. Every admin holding at
          least one role also implicitly gets{" "}
          <code className="rounded bg-muted px-1 py-0.5">audit.read.own</code>{" "}
          (their own activity trail).
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles">By role</TabsTrigger>
            <TabsTrigger value="matrix">Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="mt-4 space-y-4">
            {roles.map((role) => (
              <Card key={role.name}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">
                      <Badge
                        variant={
                          role.name === "super_admin"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-sm"
                      >
                        {role.name}
                      </Badge>
                    </CardTitle>
                    {!role.assignable && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Lock className="h-3 w-3" />
                        Reserved
                      </Badge>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {role.permissions.length} permission
                      {role.permissions.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[...groupByResource(role.permissions).entries()].map(
                    ([resource, permissions]) => (
                      <div
                        key={resource}
                        className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
                      >
                        <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
                          {resource}
                        </span>
                        {permissions.map((p) => (
                          <code
                            key={p}
                            className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {p}
                          </code>
                        ))}
                      </div>
                    ),
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="matrix" className="mt-4">
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-44">Permission</TableHead>
                      {roles.map((role) => (
                        <TableHead
                          key={role.name}
                          className="whitespace-nowrap text-center text-xs"
                        >
                          {role.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...groupByResource(allPermissions).entries()].flatMap(
                      ([resource, permissions]) => [
                        <TableRow key={`group-${resource}`}>
                          <TableCell
                            colSpan={roles.length + 1}
                            className="bg-muted/40 py-1.5 text-xs font-medium text-muted-foreground"
                          >
                            {resource}
                          </TableCell>
                        </TableRow>,
                        ...permissions.map((permission) => (
                          <TableRow key={permission}>
                            <TableCell>
                              <code className="text-xs">{permission}</code>
                            </TableCell>
                            {roles.map((role) => (
                              <TableCell
                                key={role.name}
                                className="text-center"
                              >
                                {heldByRole.get(role.name)?.has(permission) ? (
                                  <Check
                                    className="mx-auto h-4 w-4 text-primary"
                                    aria-label={`${role.name} holds ${permission}`}
                                  />
                                ) : (
                                  <span className="sr-only">
                                    {role.name} does not hold {permission}
                                  </span>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        )),
                      ],
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
