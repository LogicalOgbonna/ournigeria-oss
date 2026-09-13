"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentCard, KIND_LABEL } from "@/components/campaigns/document-card";
import { ReadOnlyNotice } from "@/components/campaigns/read-only-notice";
import { ReasonDialog } from "@/components/campaigns/reason-dialog";
import { SessionReasonBanner } from "@/components/campaigns/session-reason-banner";
import { DOCUMENT_KINDS, type CampaignDetail, type DocumentKind } from "@/lib/campaigns";
import { useSessionReason } from "@/lib/hooks/use-session-reason";
import { usePermissions } from "@/lib/permissions";

/**
 * Manifesto / CV / Achievements. One row per (kind, subject) — the API's
 * `uq_campaign_documents_kind_subject` — so a card's subject select does not
 * filter a list, it picks WHICH row is being written.
 */
export function DocumentsTab({
  campaign,
  onSaved,
}: {
  campaign: CampaignDetail;
  onSaved: () => void;
}) {
  const { can } = usePermissions();
  const canWrite = can("campaigns.write");
  const isDraft = campaign.status === "draft";
  // Off draft the API refuses every commit without a reason; ask once and
  // reuse it for the rest of this tab session.
  const reason = useSessionReason(!isDraft);
  const [kind, setKind] = useState<DocumentKind>("manifesto");

  return (
    <div className="space-y-4">
      {!canWrite ? <ReadOnlyNotice subject="documents" action="Uploading" /> : null}
      <SessionReasonBanner
        reason={reason}
        status={campaign.status}
        canWrite={canWrite}
      />

      <Tabs value={kind} onValueChange={(v) => setKind(v as DocumentKind)}>
        <TabsList>
          {DOCUMENT_KINDS.map((k) => {
            const count = campaign.documents.filter((d) => d.kind === k).length;
            return (
              <TabsTrigger key={k} value={k}>
                {KIND_LABEL[k]}
                {count ? (
                  <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {DOCUMENT_KINDS.map((k) => (
          <TabsContent key={k} value={k} className="pt-4">
            <DocumentCard
              campaign={campaign}
              kind={k}
              canWrite={canWrite}
              reason={reason}
              onSaved={onSaved}
            />
          </TabsContent>
        ))}
      </Tabs>

      <ReasonDialog
        {...reason.dialogProps}
        title="Why this document change?"
        description={`This ticket is ${campaign.status}, so the API records a reason with every document change — and the change sends it back for review. The reason is reused for the rest of your work on this tab.`}
        confirmLabel="Use this reason"
      />
    </div>
  );
}
