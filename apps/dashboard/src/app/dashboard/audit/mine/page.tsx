"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditTable } from "@/components/audit/audit-table";

export default function MyActivityPage() {
  // nuqs' useQueryState reads useSearchParams(), which Next requires under a
  // Suspense boundary or static prerender of this page fails (CSR bailout).
  return (
    <Suspense fallback={<MyActivitySkeleton />}>
      <MyActivityView />
    </Suspense>
  );
}

function MyActivitySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

function MyActivityView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">My Activity</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your own actions, from the same tamper-evident chain
        </p>
      </div>

      <AuditTable endpoint="/audit/mine" />
    </div>
  );
}
