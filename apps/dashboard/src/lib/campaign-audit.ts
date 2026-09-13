/**
 * How a campaign audit action is drawn: one icon, one human label, one tone.
 * Kept out of the timeline component so a new API action is a one-line addition
 * in a table rather than a change to rendering code.
 */
import {
  ArrowUpDown,
  Ban,
  CheckCircle2,
  CircleDot,
  EyeOff,
  FilePlus2,
  FileText,
  Flag,
  Image as ImageIcon,
  Link2,
  Pencil,
  Send,
  ShieldAlert,
  Trash2,
  Undo2,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface ActionMeta {
  icon: LucideIcon;
  label: string;
  /** Tailwind text colour for the icon; default is muted. */
  tone?: string;
}

const SUCCESS = "text-emerald-600 dark:text-emerald-400";
const WARN = "text-amber-600 dark:text-amber-400";
const DANGER = "text-destructive";

export const CAMPAIGN_AUDIT_ACTIONS: Record<string, ActionMeta> = {
  "campaign.created": { icon: FilePlus2, label: "Ticket created" },
  "campaign.updated": { icon: Pencil, label: "Ticket edited" },
  "campaign.slug.updated": { icon: Link2, label: "Slug changed" },
  "campaign.submitted": { icon: Send, label: "Sent for review", tone: WARN },
  "campaign.changes_requested": { icon: Flag, label: "Changes requested", tone: WARN },
  "campaign.published": { icon: CheckCircle2, label: "Approved — published", tone: SUCCESS },
  "campaign.republished": { icon: CheckCircle2, label: "Approved — republished", tone: SUCCESS },
  "campaign.review_confirmed": { icon: CheckCircle2, label: "Review confirmed", tone: SUCCESS },
  "campaign.self_approved": { icon: ShieldAlert, label: "Self-approved (super admin)", tone: WARN },
  "campaign.unpublished": { icon: EyeOff, label: "Unpublished", tone: DANGER },
  "campaign.concluded": { icon: Flag, label: "Concluded" },
  "campaign.withdrawn": { icon: Undo2, label: "Withdrawn", tone: DANGER },
  "campaign.dissolved": { icon: Ban, label: "Dissolved", tone: DANGER },
  "campaign.deleted": { icon: Trash2, label: "Deleted", tone: DANGER },
  "campaign.reordered": { icon: ArrowUpDown, label: "Rail order changed" },
  "campaign.media.added": { icon: ImageIcon, label: "Artwork added" },
  "campaign.media.replaced": { icon: ImageIcon, label: "Artwork replaced" },
  "campaign.media.updated": { icon: ImageIcon, label: "Artwork details edited" },
  "campaign.media.deleted": { icon: ImageIcon, label: "Artwork removed", tone: DANGER },
  "campaign.document.added": { icon: FileText, label: "Document added" },
  "campaign.document.replaced": { icon: FileText, label: "Document replaced" },
  "campaign.document.deleted": { icon: FileText, label: "Document removed", tone: DANGER },
  "campaign.council.added": { icon: Users, label: "Council member added" },
  "campaign.council.updated": { icon: Users, label: "Council member edited" },
  "campaign.council.ended": { icon: Users, label: "Council member ended", tone: WARN },
  "campaign.council.reinstated": { icon: Users, label: "Council member reinstated" },
  "campaign.council.deleted": { icon: Users, label: "Council member removed", tone: DANGER },
  "campaign.assets.purge_requested": { icon: Ban, label: "CDN purge requested", tone: WARN },
  "campaign.assets.purged": { icon: Ban, label: "CDN purged", tone: WARN },
  // Election events (plan 68) reuse the same timeline component on
  // /dashboard/elections/[id]; the API emits these on targetType "election".
  "election.created": { icon: FilePlus2, label: "Event created" },
  "election.updated": { icon: Pencil, label: "Event edited" },
  "election.deleted": { icon: Trash2, label: "Event deleted", tone: DANGER },
  "election.published": { icon: CheckCircle2, label: "Published to the gate", tone: SUCCESS },
  "election.unpublished": { icon: EyeOff, label: "Unpublished", tone: DANGER },
  "election.concluded": { icon: Flag, label: "Concluded" },
  "election.cancelled": { icon: Ban, label: "Cancelled", tone: DANGER },
  "election.gate_toggled": { icon: ShieldAlert, label: "Gate kill switch toggled", tone: WARN },
};

/**
 * Unknown actions still render — a new API verb (or the generic
 * `audit.reverted` event a revert writes) must not blank the timeline.
 */
export function metaFor(action: string): ActionMeta {
  return (
    CAMPAIGN_AUDIT_ACTIONS[action] ?? {
      icon: CircleDot,
      label: action.replace(/^(campaign|election)\./, "").replace(/[._]/g, " "),
    }
  );
}
