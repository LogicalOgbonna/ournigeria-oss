import Link from "next/link";
import { AlertCircle, Calendar, User } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { PartyBadge } from "@/components/civic/PartyBadge";
import { Show } from "@/components/ui/Show";
import { cn } from "@/lib/utils";

/** An official holding office over the viewer's location. */
export interface LocalOfficial {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly term?: string | null;
  readonly party?: string | null;
  readonly partyLogoUrl?: string | null;
  readonly imageUrl?: string | null;
  readonly slug?: string | null;
  /** No verified holder for this seat — links to the contribution flow. */
  readonly missing?: boolean;
  readonly missingHref?: string;
  /** Citizen-proposed record, not yet verified. */
  readonly proposed?: boolean;
}

/** Shared "proposed · unverified" flag — the record is a citizen submission. */
export function ProposedFlag({ when }: { readonly when?: boolean }) {
  return (
    <Show when={Boolean(when)}>
      <span className="mt-1 inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
        <AlertCircle className="h-3 w-3" />
        Proposed &middot; unverified
      </span>
    </Show>
  );
}

/**
 * The headline official for the viewer's area — a full-bleed portrait with the
 * party badge over it, name / office / term beneath. Figma 132:7085 + 132:7095.
 */
export function FeaturedOfficialCard({
  official,
  className,
}: {
  readonly official: LocalOfficial;
  readonly className?: string;
}) {
  const href = official.missing
    ? official.missingHref
    : `/officials/${official.slug ?? official.id}`;

  const card = (
    <>
      <div className="relative w-[222px] max-w-full overflow-hidden rounded-[10px] bg-emerald-500">
        <OfficialAvatar
          src={official.imageUrl}
          alt={official.name}
          px={222}
          imgClassName="h-[270px] w-[222px] max-w-full object-cover object-top"
          fallback={
            <div className="grid h-[270px] w-[222px] max-w-full place-items-center">
              <User className="h-20 w-20 text-white/70" />
            </div>
          }
        />
        <Show when={Boolean(official.party)}>
          <PartyBadge
            acronym={official.party ?? ""}
            logoUrl={official.partyLogoUrl}
            size="lg"
            className="absolute bottom-[5px] left-[7px]"
          />
        </Show>
      </div>

      <div className="mt-2 w-[222px] max-w-full">
        <p className="font-sans text-[14px] font-semibold leading-[20px] text-foreground">
          {official.missing ? `Unknown ${official.role}` : official.name}
        </p>
        <p className="font-sans text-[12px] font-medium leading-[16px] text-emerald-600 dark:text-emerald-400">
          {official.role}
        </p>
        <ProposedFlag when={official.proposed} />
        <Show when={Boolean(official.term)}>
          <span className="mt-px flex items-center gap-1.5 font-sans text-[11px] leading-[16.5px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {official.term}
          </span>
        </Show>
      </div>
    </>
  );

  if (!href) return <div className={cn("block", className)}>{card}</div>;

  return (
    <Link href={href} className={cn("group block transition-opacity hover:opacity-90", className)}>
      {card}
    </Link>
  );
}
