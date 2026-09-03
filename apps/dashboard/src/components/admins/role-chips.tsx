"use client";

import { Badge } from "@/components/ui/badge";

/**
 * Active-role badges for an admin (plan 62). super_admin renders destructive
 * so the most powerful role is impossible to miss at a glance.
 */
export function RoleChips({ roles }: { roles: string[] }) {
  if (roles.length === 0) {
    return <span className="text-xs text-muted-foreground italic">no roles</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {roles.map((role) => (
        <Badge
          key={role}
          variant={role === "super_admin" ? "destructive" : "outline"}
          className="text-xs"
        >
          {role}
        </Badge>
      ))}
    </div>
  );
}
