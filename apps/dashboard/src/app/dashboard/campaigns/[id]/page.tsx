"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, use } from "react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Forbidden } from "@/components/layout/forbidden";
import { StatusChip } from "@/components/campaigns/status-chip";
import { VerbButtons } from "@/components/campaigns/verb-buttons";
import { TicketTab } from "./_tabs/ticket-tab";
import { ArtworkTab } from "./_tabs/artwork-tab";
import { DocumentsTab } from "./_tabs/documents-tab";
import { CouncilTab } from "./_tabs/council-tab";
import { ReviewTab } from "./_tabs/review-tab";
import { hiddenReason } from "@/lib/campaign-form";
import {
  ELECTION_TYPE_LABEL,
  campaignsApi,
  isPubliclyVisible,
  type CampaignDetail,
} from "@/lib/campaigns";
import { useResource } from "@/lib/hooks/use-resource";
import { usePermissions } from "@/lib/permissions";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ournigeria.ng";

const TABS = ["ticket", "artwork", "documents", "council", "review"] as const;
type TabKey = (typeof TABS)[number];

/** "Governor · 2027 · Lagos" — the race this ticket runs in. */
function raceLabel(c: CampaignDetail): string {
  const scope = c.constituency?.name ?? c.lga?.name ?? c.state?.name ?? null;
  return [ELECTION_TYPE_LABEL[c.electionType], String(c.year), scope]
    .filter(Boolean)
    .join(" · ");
}

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // nuqs reads useSearchParams(), which Next requires under a Suspense
  // boundary or the route bails out of static prerender.
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
      <CampaignDetailView id={id} />
    </Suspense>
  );
}

function CampaignDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { loading: permsLoading, can } = usePermissions();
  const canRead = can("campaigns.read");
  const ready = !permsLoading && canRead;
  const denied = !permsLoading && !canRead;

  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringEnum<TabKey>([...TABS]).withDefault("ticket"),
  );

  const { data, loading, error, refetch } = useResource(
    () => campaignsApi.get(id),
    [id],
    { enabled: ready },
  );

  if (denied) return <Forbidden permission="campaigns.read" />;

  // useResource keeps the previous payload while a refetch is in flight (and on
  // a failed refetch), but flips `loading` back to true — so the skeleton is
  // driven by "no data", not by "loading". Tearing the tabs down after every
  // verb would remount the Ticket tab and throw away unsaved edits. A row from
  // the PREVIOUS id is not this page's data, though, so it counts as no data.
  const campaign = data && data.id === id ? data : undefined;
  const refreshing = loading && campaign !== undefined;

  if (!campaign) {
    return (
      <div className="space-y-4">
        <BackLink />
        {error ? (
          <div className="rounded-lg border border-border p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={refetch}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </>
        )}
      </div>
    );
  }
  const backToList = () => router.push("/dashboard/campaigns");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackLink />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold">
              {campaign.candidateName}
              {campaign.runningMateName ? (
                <span className="text-muted-foreground">
                  {" "}
                  / {campaign.runningMateName}
                </span>
              ) : null}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <StatusChip {...campaign} />
              {campaign.partyAcronym ? (
                <Badge variant="outline" title={campaign.party?.name ?? undefined}>
                  {campaign.partyAcronym}
                </Badge>
              ) : null}
              <span>{raceLabel(campaign)}</span>
              <span aria-hidden>·</span>
              <code className="font-mono text-xs">{campaign.slug}</code>
              {refreshing ? (
                <span className="inline-flex items-center gap-1 text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Refreshing…
                </span>
              ) : null}
              {isPubliclyVisible(campaign) ? (
                <a
                  href={`${SITE_URL}/elections/${campaign.year}/${campaign.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                >
                  Public preview <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="text-xs">{hiddenReason(campaign)}</span>
              )}
            </div>
          </div>
          <VerbButtons
            campaign={campaign}
            onDone={refetch}
            onDeleted={backToList}
          />
        </div>
      </div>

      {/* A refetch that failed with a ticket already on screen: the page stays,
          the banner says the view may be stale. */}
      {error ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={(v) => void setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="ticket">Ticket</TabsTrigger>
          <TabsTrigger value="artwork">Artwork</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="council">Council</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        {/* forceMount keeps the Ticket tab's form state alive while the
            operator reads the Review trail — Radix unmounts an inactive panel
            otherwise, and half-written copy would go with it. Radix spreads
            `hidden: !present` into the panel, so the explicit `hidden` prop
            (after the spread) is what actually hides it. */}
        <TabsContent
          value="ticket"
          forceMount
          hidden={tab !== "ticket"}
          className="pt-4"
        >
          <TicketTab campaign={campaign} onSaved={refetch} />
        </TabsContent>

        {/* Artwork and Documents keep Radix's default unmount-when-inactive: an
            in-flight upload is cancelled by design when the operator leaves
            (useAssetUpload aborts it), and both tabs re-seed from `campaign`. */}
        <TabsContent value="artwork" className="pt-4">
          <ArtworkTab campaign={campaign} onSaved={refetch} />
        </TabsContent>
        <TabsContent value="documents" className="pt-4">
          <DocumentsTab campaign={campaign} onSaved={refetch} />
        </TabsContent>
        <TabsContent value="council" className="pt-4">
          <CouncilTab campaign={campaign} onSaved={refetch} />
        </TabsContent>

        <TabsContent value="review" className="pt-4">
          <ReviewTab
            campaign={campaign}
            onChanged={refetch}
            onDeleted={backToList}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/campaigns"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      All tickets
    </Link>
  );
}
