"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CouncilMemberDialog } from "@/components/campaigns/council-member-dialog";
import { CouncilPhotoZone } from "@/components/campaigns/council-photo-zone";
import { CouncilTable } from "@/components/campaigns/council-table";
import {
  EndMemberDialog,
  type EndMemberInput,
} from "@/components/campaigns/end-member-dialog";
import { ReadOnlyNotice } from "@/components/campaigns/read-only-notice";
import { ReasonDialog } from "@/components/campaigns/reason-dialog";
import { SessionReasonBanner } from "@/components/campaigns/session-reason-banner";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import {
  isEmptyPatch,
  memberCreateBody,
  memberPatchBody,
  sortCouncil,
  type MemberFormValues,
} from "@/lib/campaign-council";
import { campaignsApi, type CampaignDetail, type CouncilMember } from "@/lib/campaigns";
import { loadGeo, useAsyncList, useGeoList, type GeoOption } from "@/lib/hooks/use-geo-list";
import { toastActionError, useSessionReason } from "@/lib/hooks/use-session-reason";
import { useResource } from "@/lib/hooks/use-resource";
import { usePermissions } from "@/lib/permissions";

/**
 * The people running this ticket.
 *
 * Three API rules drive the shape of this tab:
 *  - off draft, EVERY council change needs an audit reason and pushes the
 *    ticket back into the review queue — so the reason is asked once per tab
 *    session, before the member dialog opens (two stacked Radix dialogs fight
 *    over the focus trap);
 *  - a member is DELETED only while the ticket is a draft; on a published one
 *    they are ended, and an `end` always carries its own reason;
 *  - there is no reinstate ROUTE — `reinstateMember` exists only as the audit
 *    revert of `campaign.council.ended`, so an ended member is undone from the
 *    Review tab's trail, not from here.
 */
export function CouncilTab({
  campaign,
  onSaved,
}: {
  campaign: CampaignDetail;
  onSaved: () => void;
}) {
  const { can } = usePermissions();
  const canWrite = can("campaigns.write");
  const isDraft = campaign.status === "draft";
  const reason = useSessionReason(!isDraft);

  const roles = useResource(() => campaignsApi.roles(), []);
  const states = useGeoList("/api/geo/states");

  // Only the LGA lists an actual member needs: one cached fetch per state that
  // appears in the council, flattened into a single code→name lookup.
  const lgaStateKey = useMemo(
    () =>
      Array.from(
        new Set(
          campaign.council
            .filter((m) => m.scopeLevel === "lga" && m.stateCode)
            .map((m) => m.stateCode as string),
        ),
      )
        .sort()
        .join(","),
    [campaign.council],
  );
  const lgaLoader = useMemo(() => {
    if (!lgaStateKey) return null;
    const codes = lgaStateKey.split(",");
    return async () => {
      // allSettled, not all: one unreachable state's list must not cost the
      // names of every other state's LGAs. Only a total failure is an error
      // worth telling the operator about.
      const settled = await Promise.allSettled(
        codes.map((code) => loadGeo(`/api/geo/lgas?state=${encodeURIComponent(code)}`)),
      );
      if (settled.every((r) => r.status === "rejected"))
        throw new Error("LGA names could not be loaded");
      return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    };
  }, [lgaStateKey]);
  const lgas = useAsyncList<GeoOption>(lgaLoader);
  const geoFailed = Boolean(states.error || lgas.error);

  const [memberDialog, setMemberDialog] = useState<{
    member: CouncilMember | null;
    why?: string;
  } | null>(null);
  const [ending, setEnding] = useState<CouncilMember | null>(null);
  const [removing, setRemoving] = useState<CouncilMember | null>(null);
  const [photoFor, setPhotoFor] = useState<string | null>(null);

  const roleSortOrder = useMemo(() => {
    const map = new Map((roles.data ?? []).map((r) => [r.code, r.sortOrder]));
    // A role the catalog no longer lists sorts after every known one rather
    // than jumping to the top on a 0 default.
    return (code: string) => map.get(code) ?? Number.MAX_SAFE_INTEGER;
  }, [roles.data]);

  const members = useMemo(
    () => sortCouncil(campaign.council, roleSortOrder),
    [campaign.council, roleSortOrder],
  );

  const geoName = useCallback(
    (rows: GeoOption[], code: string) => rows.find((r) => r.code === code)?.name ?? code,
    [],
  );
  const scopeLabel = useCallback(
    (m: CouncilMember) => {
      if (m.scopeLevel === "national") return "National";
      if (m.scopeLevel === "state")
        return m.stateCode ? geoName(states.rows, m.stateCode) : "State";
      if (!m.lgaCode) return "LGA";
      const lga = geoName(lgas.rows, m.lgaCode);
      return m.stateCode ? `${lga} · ${geoName(states.rows, m.stateCode)}` : lga;
    },
    [geoName, lgas.rows, states.rows],
  );

  /**
   * The audit reason is taken BEFORE the member dialog opens, so the reason
   * modal never has to stack on top of the form.
   */
  async function openMember(member: CouncilMember | null) {
    try {
      setMemberDialog({ member, why: await reason.askOrThrow(member ? "Save" : "Add") });
    } catch (err) {
      toastActionError(err);
    }
  }

  async function submitMember(form: MemberFormValues) {
    const open = memberDialog;
    if (!open) return;
    const why = open.why;
    if (!open.member) {
      await campaignsApi.addMember(campaign.id, memberCreateBody(form, why));
      toast.success("Council member added");
    } else {
      const patch = memberPatchBody(form, open.member, why);
      // Nothing moved? Say so rather than sending a PATCH that would still
      // re-flag a published ticket for review.
      if (isEmptyPatch(patch)) {
        toast.info("Nothing changed");
        return;
      }
      await campaignsApi.patchMember(campaign.id, open.member.id, patch);
      toast.success("Council member updated");
    }
    onSaved();
  }

  async function endMember(member: CouncilMember, body: EndMemberInput) {
    await campaignsApi.endMember(campaign.id, member.id, { ...body });
    // The end dialog collects its own reason because the API demands one even
    // on a draft; off draft that same sentence covers the rest of this tab
    // session, so adopt it instead of asking again for the same work.
    if (reason.required) reason.set(body.reason);
    toast.success(`${member.name} ended`);
    onSaved();
  }

  async function removeMember(member: CouncilMember) {
    try {
      await campaignsApi.removeMember(campaign.id, member.id);
      toast.success("Council member removed");
      onSaved();
    } catch (err) {
      toastActionError(err);
    }
  }

  const activeRoleCount = (roles.data ?? []).filter((r) => r.isActive).length;

  return (
    <div className="space-y-6">
      {!canWrite ? <ReadOnlyNotice subject="council" action="Editing" /> : null}
      <SessionReasonBanner reason={reason} status={campaign.status} canWrite={canWrite} />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Council</CardTitle>
              <CardDescription>
                Everyone running this campaign. On a published ticket a member is
                ended, never deleted, so the record of who served survives.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/campaigns/roles">
                  <Settings2 className="mr-1.5 h-4 w-4" />
                  Roles
                </Link>
              </Button>
              <Button
                size="sm"
                disabled={!canWrite || roles.loading || activeRoleCount === 0}
                onClick={() => void openMember(null)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add member
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.error ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                The role catalog failed to load — {roles.error}
              </p>
              <Button size="sm" variant="outline" onClick={roles.refetch}>
                Retry
              </Button>
            </div>
          ) : null}
          {!roles.loading && !roles.error && activeRoleCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              There are no active council roles yet — add one on the{" "}
              <Link href="/dashboard/campaigns/roles" className="text-primary underline">
                Council Roles
              </Link>{" "}
              page before adding members.
            </p>
          ) : null}
          {/* A failed geo list is not fatal: the Scope column falls back to the
              raw code, so this says why it looks like that and offers a retry. */}
          {geoFailed ? (
            <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              Scope names unavailable — codes are shown instead.
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => {
                  if (states.error) states.retry();
                  if (lgas.error) lgas.retry();
                }}
              >
                Retry
              </Button>
            </p>
          ) : null}

          <CouncilTable
            members={members}
            scopeLabel={scopeLabel}
            canWrite={canWrite}
            canRemove={isDraft}
            onEdit={(m) => void openMember(m)}
            onEnd={setEnding}
            onRemove={setRemoving}
            onPhoto={(m) => setPhotoFor((cur) => (cur === m.id ? null : m.id))}
            photoOpenId={photoFor}
            renderPhotoZone={(m) => (
              // Keyed by the member: each zone owns its own upload state, and
              // switching rows must not inherit the last row's progress bar.
              <CouncilPhotoZone
                key={m.id}
                member={m}
                campaignId={campaign.id}
                canWrite={canWrite}
                reason={reason}
                onSaved={() => {
                  setPhotoFor(null);
                  onSaved();
                }}
              />
            )}
            emptyState={
              canWrite
                ? "No council members yet — add the campaign manager, spokesperson and coordinators here."
                : "No council members yet."
            }
          />

          <p className="text-xs text-muted-foreground">
            A linked official&apos;s name comes from their own record. A portrait can be
            uploaded here for anyone the public page has no photo for — a name-only
            member, or an official with none on file. Undoing an ended membership is a
            revert on the Review tab.
          </p>
        </CardContent>
      </Card>

      <CouncilMemberDialog
        open={memberDialog !== null}
        onOpenChange={(v) => {
          if (!v) setMemberDialog(null);
        }}
        member={memberDialog?.member ?? null}
        roles={roles.data ?? []}
        rolesLoading={roles.loading}
        rolesError={roles.error}
        onSubmit={submitMember}
      />

      <EndMemberDialog
        member={ending}
        defaultReason={reason.reason ?? ""}
        onOpenChange={(v) => {
          if (!v) setEnding(null);
        }}
        onConfirm={endMember}
      />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(v) => {
          if (!v) setRemoving(null);
        }}
        title="Remove this council member?"
        description={
          removing
            ? `${removing.name} is deleted from this draft ticket. Once the ticket is published, members are ended instead so the record survives.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        onConfirm={async () => {
          const target = removing;
          setRemoving(null);
          if (target) await removeMember(target);
        }}
      />

      <ReasonDialog
        {...reason.dialogProps}
        title="Why this council change?"
        description={`This ticket is ${campaign.status}, so the API records a reason with every council change — and the change sends it back for review. The reason is reused for the rest of your work on this tab.`}
        confirmLabel="Use this reason"
      />
    </div>
  );
}
