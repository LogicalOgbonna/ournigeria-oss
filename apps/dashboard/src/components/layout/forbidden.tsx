"use client";

import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Friendly 403 (plan 62 §7): says what's missing and who can grant it,
 * instead of a dead end.
 */
export function Forbidden({ permission }: { permission?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-heading font-semibold">
            You don&apos;t have access to this section
          </h2>
          <p className="text-sm text-muted-foreground">
            {permission ? (
              <>
                This page needs the{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {permission}
                </code>{" "}
                permission.
              </>
            ) : (
              "Your current roles don't include this area."
            )}{" "}
            A super admin can grant you the right role from the Admin Users
            page.
          </p>
          <a
            className="text-sm text-primary underline underline-offset-4"
            href="mailto:admin@ournigeria.ng?subject=Dashboard%20access%20request"
          >
            Request access
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
