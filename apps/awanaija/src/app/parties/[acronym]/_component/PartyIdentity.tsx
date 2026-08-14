import { Building2, Globe, Mail, Phone, MapPin } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { Show } from "@/components/ui/Show";
import { Pill } from "./Pill";
import type { PartyDetail } from "@/lib/api";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function PartyIdentity({
  party,
  color,
}: {
  readonly party: PartyDetail;
  readonly color: string;
}) {
  const website = party.website
    ? /^https?:\/\//i.test(party.website)
      ? party.website
      : `https://${party.website}`
    : null;
  const twitterUrl = party.twitterHandle
    ? `https://x.com/${party.twitterHandle.replace(/^@/, "")}`
    : null;
  const fbUrl = party.facebookUrl
    ? /^https?:\/\//i.test(party.facebookUrl)
      ? party.facebookUrl
      : `https://${party.facebookUrl.replace(/^\/+/, "")}`
    : null;
  const hasContact = website || party.email || party.phoneNumber || twitterUrl || fbUrl;

  const meta = [
    party.foundingYear ? `Founded ${party.foundingYear}` : null,
    party.ideology,
  ].filter(Boolean) as string[];

  return (
    <section>
      <div className="flex items-start gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
          <OfficialAvatar
            src={party.logoUrl}
            alt={party.name}
            px={80}
            imgClassName="w-20 h-20 object-contain"
            fallback={<Building2 className="h-9 w-9 text-slate-400" />}
          />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-[32px] leading-tight text-slate-900 dark:text-white">
              {party.name}
            </h1>
            <span
              className="rounded-full px-2.5 py-1 font-mono text-sm font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {party.acronym}
            </span>
            <Show when={!!party.inecStatus}>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                {party.inecStatus}
              </span>
            </Show>
            {party.rank?.position === 1 ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                Nigeria&apos;s largest party
              </span>
            ) : party.rank?.position ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {ordinal(party.rank.position)}-largest party by seats
              </span>
            ) : null}
          </div>
          <Show when={meta.length > 0}>
            <p className="mt-2 text-sm text-muted-foreground">{meta.join(" · ")}</p>
          </Show>
          <Show when={!!party.slogan}>
            <p className="mt-3 font-serif text-lg italic text-slate-700 dark:text-slate-300">
              &ldquo;{party.slogan}&rdquo;
            </p>
          </Show>
        </div>
      </div>

      <Show when={!!party.description}>
        <p className="mt-5 border-l-[3px] border-emerald-400 pl-4 leading-relaxed text-slate-600 dark:text-slate-300">
          {party.description}
        </p>
      </Show>

      <Show when={!!hasContact}>
        <div className="mt-5 flex flex-wrap gap-2">
          {website && <Pill href={website} icon={<Globe className="h-4 w-4" />} label="Website" external />}
          {party.email && (
            <Pill href={`mailto:${party.email}`} icon={<Mail className="h-4 w-4" />} label={party.email} />
          )}
          {party.phoneNumber && (
            <Pill href={`tel:${party.phoneNumber}`} icon={<Phone className="h-4 w-4" />} label={party.phoneNumber} />
          )}
          {twitterUrl && <Pill href={twitterUrl} icon={<span className="font-bold">𝕏</span>} label="X" external />}
          {fbUrl && <Pill href={fbUrl} icon={<span className="font-bold">f</span>} label="Facebook" external />}
        </div>
      </Show>

      <Show when={!!party.hqAddress}>
        <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 text-emerald-500" />
          <span>National secretariat: {party.hqAddress}</span>
        </div>
      </Show>
    </section>
  );
}
