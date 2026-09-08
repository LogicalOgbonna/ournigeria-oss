"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Camera, CircleSlash, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Portrait } from "@/components/campaigns/portrait";
import { canUploadCouncilPhoto, endReasonLabel } from "@/lib/campaign-council";
import type { CouncilMember } from "@/lib/campaigns";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Six fixed columns — the empty-state cell spans them. */
const COLUMN_COUNT = 6;

export interface CouncilTableProps {
  /** Already ordered by the caller (sortCouncil). */
  members: CouncilMember[];
  /** "National" / a state name / "Dala, Kano" — resolved against the geo lists. */
  scopeLabel: (member: CouncilMember) => string;
  canWrite: boolean;
  /**
   * The API deletes a member only while the ticket is a draft; on a published
   * one members are ENDED, never removed. False hides the Remove item.
   */
  canRemove: boolean;
  onEdit: (member: CouncilMember) => void;
  onEnd: (member: CouncilMember) => void;
  onRemove: (member: CouncilMember) => void;
  /**
   * Toggles the photo drop zone under a row. Offered only where the API's
   * fallback chain makes it meaningful — see `canUploadCouncilPhoto`.
   */
  onPhoto: (member: CouncilMember) => void;
  /** The member whose photo zone is open, if any. */
  photoOpenId?: string | null;
  /** Rendered in a full-width row under the member `photoOpenId` names. */
  renderPhotoZone?: (member: CouncilMember) => ReactNode;
  emptyState?: ReactNode;
}

/**
 * Everyone running this ticket. Ended members stay on the list — muted, with
 * the reason they left — because the audit trail can put them back and hiding
 * them would make a reshuffle look like a deletion.
 */
export function CouncilTable({
  members,
  scopeLabel,
  canWrite,
  canRemove,
  onEdit,
  onEnd,
  onRemove,
  onPhoto,
  photoOpenId,
  renderPhotoZone,
  emptyState,
}: CouncilTableProps) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Role</TableHead>
            <TableHead>Member</TableHead>
            <TableHead className="w-[180px]">Scope</TableHead>
            <TableHead className="w-[150px]">Status</TableHead>
            <TableHead className="w-[120px]">Started</TableHead>
            <TableHead className="w-[52px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {emptyState ?? "No council members yet."}
              </TableCell>
            </TableRow>
          ) : (
            members.map((m) => {
              const ended = m.status === "ended";
              const linked = Boolean(m.officialId);
              // An ended member cannot be edited at all, so a photo zone left
              // open behind an `end` would only offer an upload nothing reads.
              const mayUploadPhoto = !ended && canUploadCouncilPhoto(m);
              const photoOpen = photoOpenId === m.id && mayUploadPhoto;
              return (
                <Fragment key={m.id}>
                  <TableRow className={cn(ended && "opacity-60")}>
                    <TableCell className="align-top">
                      <span className="text-sm font-medium">{m.role.label}</span>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {m.roleCode}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-start gap-2">
                        {/* The linked official's photo wins; the member's own
                            is the fallback the public page uses. */}
                        <Portrait
                          size="md"
                          name={m.name}
                          imageUrl={m.official?.imageUrl ?? m.imageUrl}
                        />
                        <div className="min-w-0">
                          {linked && m.officialId ? (
                            <Link
                              href={`/dashboard/officials/${m.officialId}`}
                              className="text-sm font-medium hover:underline"
                            >
                              {m.name}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium">{m.name}</span>
                          )}
                          {linked ? (
                            <div className="mt-0.5">
                              <Badge variant="outline" className="text-[10px]">
                                linked official
                              </Badge>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm">{scopeLabel(m)}</TableCell>
                    <TableCell className="align-top text-sm">
                      {ended ? (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {endReasonLabel(m.endReason)}
                          </Badge>
                          {m.endDate ? (
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {formatDate(m.endDate)}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {m.startDate ? formatDate(m.startDate) : "-"}
                    </TableCell>
                    <TableCell className="align-top">
                      {canWrite ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Actions for ${m.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel className="text-xs">{m.name}</DropdownMenuLabel>
                            {/* An ended member is history: the API refuses a
                                PATCH on one ("reinstate first") and there is no
                                reinstate ROUTE — only the audit revert. */}
                            <DropdownMenuItem disabled={ended} onSelect={() => onEdit(m)}>
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            {mayUploadPhoto ? (
                              <DropdownMenuItem onSelect={() => onPhoto(m)}>
                                <Camera className="mr-1.5 h-3.5 w-3.5" />
                                {photoOpen ? "Hide photo upload" : "Upload photo"}
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={ended} onSelect={() => onEnd(m)}>
                              <CircleSlash className="mr-1.5 h-3.5 w-3.5" />
                              End membership…
                            </DropdownMenuItem>
                            {canRemove ? (
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => onRemove(m)}
                              >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                Remove
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                  {photoOpen && renderPhotoZone ? (
                    <TableRow>
                      <TableCell colSpan={COLUMN_COUNT} className="bg-muted/20">
                        {renderPhotoZone(m)}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
