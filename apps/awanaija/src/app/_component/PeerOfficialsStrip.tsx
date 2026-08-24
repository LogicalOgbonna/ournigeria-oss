import Link from "next/link";
import { ArrowRight, Calendar, User } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { PartyBadge } from "@/components/civic/PartyBadge";
import { Show } from "@/components/ui/Show";
import { cn } from "@/lib/utils";
import { ProposedFlag, type LocalOfficial } from "./FeaturedOfficialCard";

/**
 * The rest of the viewer's representatives, three across under the state
 * snapshot — Figma 132:7105, with the "learn more about {state}" link.
 */
export function PeerOfficialsStrip({
  officials,
  moreHref,
  moreLabel,
  className,
}: {
  readonly officials: readonly LocalOfficial[];
  readonly moreHref?: string;
  readonly moreLabel?: string;
  readonly className?: string;
}) {
  if (officials.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-border/60 bg-card/50 p-6 shadow-xl shadow-black/5 backdrop-blur-md",
        className,
      )}
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {officials.map((official) => (
          <PeerCard key={official.id} official={official} />
        ))}
      </div>

      <Show when={Boolean(moreHref)}>
        <Link
          href={moreHref ?? "#"}
          className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[1px] text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
        >
          {moreLabel ?? "Learn more"}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Show>
    </div>
  );
}

function PeerCard({ official }: { readonly official: LocalOfficial }) {
  const href = official.missing
    ? official.missingHref
    : `/officials/${official.slug ?? official.id}`;

  const body = (
    <>
      <div className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-[4px] border border-white/20 bg-emerald-950">
        <OfficialAvatar
          src={official.imageUrl}
          alt={official.name}
          px={86}
          imgClassName="h-[86px] w-[86px] object-cover object-top"
          fallback={
            <div className="grid h-[86px] w-[86px] place-items-center">
              <User className="h-8 w-8 text-white/50" />
            </div>
          }
        />
        <Show when={Boolean(official.party)}>
          <PartyBadge
            acronym={official.party ?? ""}
            logoUrl={official.partyLogoUrl}
            className="absolute bottom-[2px] left-[2px]"
          />
        </Show>
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words font-sans text-[14px] font-semibold leading-[20px] text-foreground">
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

  if (!href) return <div className="flex items-start gap-[10px]">{body}</div>;

  return (
    <Link
      href={href}
      className="flex items-start gap-[10px] transition-opacity hover:opacity-80"
    >
      {body}
    </Link>
  );
}
