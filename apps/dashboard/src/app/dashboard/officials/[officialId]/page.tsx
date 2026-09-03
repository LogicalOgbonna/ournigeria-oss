"use client";

import { use } from "react";
import { ExternalLink, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useResource } from "@/lib/hooks/use-resource";

interface OfficialDetail {
  id: string;
  name: string;
  slug: string | null;
  officialType: string | null;
  imageUrl?: string | null;
  positions?: Array<{ role?: string; title?: string }> | null;
}

/**
 * Minimal official detail — the internal landing spot for audit-log target
 * links. Full official management is a planned follow-up; until then this
 * resolves the identity and points at the public profile.
 */
export default function OfficialDetailPage({
  params,
}: {
  params: Promise<{ officialId: string }>;
}) {
  const { officialId } = use(params);
  const official = useResource<OfficialDetail>(async () => {
    const res = await fetch(`/api/officials/${officialId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Official not found (${res.status})`);
    return res.json();
  }, [officialId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Official</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Official management is coming soon — this is the record an audit
          event pointed at.
        </p>
      </div>

      {official.loading ? (
        <Skeleton className="h-40 max-w-xl rounded-lg" />
      ) : official.error || !official.data ? (
        <p className="text-sm text-destructive">
          {official.error ?? "Official not found"} — it may have been removed
          (soft-deleted officials are hidden from public reads).
        </p>
      ) : (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-muted-foreground" />
              {official.data.name}
              {official.data.officialType && (
                <Badge variant="outline" className="text-xs">
                  {official.data.officialType}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-mono text-xs text-muted-foreground">
              {official.data.id}
            </p>
            {official.data.slug && (
              <a
                href={`https://ournigeria.ng/officials/${official.data.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
              >
                Public profile <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
