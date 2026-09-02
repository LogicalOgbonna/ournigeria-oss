"use client";

import { Suspense, useCallback, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AuditTable,
  buildAuditFilterParams,
  useAuditFilters,
} from "@/components/audit/audit-table";
import { ChainStatusBadge } from "@/components/audit/chain-status-badge";
import { Forbidden } from "@/components/layout/forbidden";
import { usePermissions } from "@/lib/permissions";

export default function AuditPage() {
  // nuqs' useQueryState reads useSearchParams(), which Next requires under a
  // Suspense boundary or static prerender of this page fails (CSR bailout).
  return (
    <Suspense fallback={<AuditSkeleton />}>
      <AuditView />
    </Suspense>
  );
}

function AuditSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-6 w-80 rounded-full" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

function AuditView() {
  const { can } = usePermissions();
  const [forbidden, setForbidden] = useState(false);
  const { q, actorId, actorType, targetType, pathway } = useAuditFilters();
  const onForbidden = useCallback(() => setForbidden(true), []);

  if (forbidden) return <Forbidden permission="audit.read" />;

  function exportCsv() {
    const params = buildAuditFilterParams({
      q,
      actorId,
      actorType,
      targetType,
      pathway,
    });
    // Same-origin navigation — the admin session cookie rides along.
    window.location.href = `/api/admin/audit/export?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Audit Log</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Every admin action, recorded in a tamper-evident hash chain
          </p>
        </div>
        {can("audit.read") && (
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      <ChainStatusBadge />

      <AuditTable endpoint="/audit" onForbidden={onForbidden} />
    </div>
  );
}
