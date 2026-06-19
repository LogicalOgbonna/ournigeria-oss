"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Building2, Globe, Mail, Phone, MapPin, User } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { PartyOfficeholdersAccordion } from "@/components/civic/PartyOfficeholdersAccordion";
import { partyColor } from "@/lib/partyColors";
import { stateLabel } from "@/lib/states";
import type { PartyDetail, PartyOfficialMini, PartyOfficerView } from "@/lib/api";

// Lazy-load the map (+ its geo data) so it stays off the initial bundle.
const NigeriaChoropleth = dynamic(
  () => import("@/components/civic/NigeriaChoropleth").then((m) => m.NigeriaChoropleth),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[5/4] w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
    ),
  },
);

const OFFICER_ROLE_LABELS: Record<string, string> = {
  national_chairman: "National Chairman",
  national_secretary: "National Secretary",
  party_leader: "Party Leader",
};
const OFFICER_ORDER = ["national_chairman", "national_secretary", "party_leader"];

function orderedOfficers(officers: PartyOfficerView[]): PartyOfficerView[] {
  return [...officers].sort(
    (a, b) =>
      (OFFICER_ORDER.indexOf(a.role) + 1 || 99) - (OFFICER_ORDER.indexOf(b.role) + 1 || 99),
  );
}

export function PartyProfile({ party }: { readonly party: PartyDetail }) {
  const color = partyColor(party.acronym, party.color);
  const officers = orderedOfficers(party["officers"] ?? []);
  const candidates = party["candidates"] ?? [];
  const statesGoverned = party["statesGoverned"] ?? [];
  const governedValues = Object.fromEntries(statesGoverned.map((c) => [c, 1]));
  const byRole = party.footprint?.byRole ?? {};

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
    <main className="container mx-auto max-w-6xl flex-1 px-4 pb-20 pt-24">
      <div className="flex flex-col gap-10 lg:flex-row">
        {/* ---------- LEFT: the party's story ---------- */}
        <div className="min-w-0 flex-1 space-y-12">
          {/* 1. Identity + contacts */}
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
                  {party.inecStatus && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {party.inecStatus}
                    </span>
                  )}
                </div>
                {meta.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">{meta.join(" · ")}</p>
                )}
                {party.slogan && (
                  <p className="mt-3 font-serif text-lg italic text-slate-700 dark:text-slate-300">
                    &ldquo;{party.slogan}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {party.description && (
              <p className="mt-5 border-l-[3px] border-emerald-400 pl-4 leading-relaxed text-slate-600 dark:text-slate-300">
                {party.description}
              </p>
            )}

            {hasContact && (
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
            )}

            {party.hqAddress && (
              <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 text-emerald-500" />
                <span>National secretariat: {party.hqAddress}</span>
              </div>
            )}
          </section>

          {/* 2. Party leadership (officers) */}
          {officers.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white">
                Party leadership
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {officers.map((o) => (
                  <div
                    key={o.role}
                    className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-4"
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
                      <OfficialAvatar
                        src={o.imageUrl}
                        alt={o.name}
                        px={56}
                        imgClassName="w-14 h-14 rounded-full object-cover"
                        fallback={<User className="h-6 w-6 text-slate-400" />}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{o.name}</div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {OFFICER_ROLE_LABELS[o.role] ?? o.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. States governed */}
          <section>
            <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white">
              States governed
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {statesGoverned.length > 0
                ? `Holds the governorship in ${statesGoverned.length} ${statesGoverned.length === 1 ? "state" : "states"}.`
                : "Holds no governorships."}
            </p>
            {statesGoverned.length > 0 && (
              <div className="mt-4">
                <NigeriaChoropleth
                  valuesByState={governedValues}
                  color={color}
                  className="mx-auto max-w-xl"
                />
              </div>
            )}
          </section>

          {/* 4. Primaries — candidates who won */}
          <section>
            <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white">
              Flagbearers &amp; primary winners
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Candidates who won {party.acronym} primaries.
            </p>
            {candidates.length === 0 ? (
              <p className="mt-4 text-muted-foreground">No primary winners recorded yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {candidates.map((c, i) => (
                  <OfficialMiniCard
                    key={`${c.official.id}-${c.electionType}-${c.year}-${i}`}
                    person={{
                      id: c.official.id,
                      slug: c.official.slug,
                      name: c.official.name,
                      imageUrl: c.official.imageUrl,
                      contextLabel: `${prettyElectionType(c.electionType)} · ${c.year}${c.scopeLabel ? ` · ${c.scopeLabel}` : ""}`,
                    }}
                    color={color}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 5. State chapters */}
          <section>
            <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white">
              State chapters
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {party.chapters.length} chapter{party.chapters.length === 1 ? "" : "s"} documented.
            </p>
            {party.chapters.length === 0 ? (
              <p className="mt-4 text-muted-foreground">No chapters documented yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {party.chapters.map((c) => {
                  const filled =
                    c.chairmanName || c.secretaryName || c.hqAddress || c.phoneNumber || c.email;
                  return (
                    <div key={c.id} className="rounded-[10px] border border-border bg-card p-4">
                      <div className="font-heading font-semibold text-foreground">
                        {stateLabel(c.stateCode)}
                      </div>
                      {filled ? (
                        <div className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                          {c.chairmanName && (
                            <div>
                              <span className="text-slate-400">Chairman:</span> {c.chairmanName}
                            </div>
                          )}
                          {c.secretaryName && (
                            <div>
                              <span className="text-slate-400">Secretary:</span> {c.secretaryName}
                            </div>
                          )}
                          {c.hqAddress && (
                            <div className="flex items-start gap-1">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {c.hqAddress}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1.5 text-sm text-slate-400">
                          Chapter documented — leadership pending.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ---------- RIGHT: elected officials by position ---------- */}
        <div className="w-full shrink-0 lg:w-80">
          <div className="lg:sticky lg:top-24">
            <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Elected officials
            </h2>
            <PartyOfficeholdersAccordion acronym={party.acronym} byRole={byRole} />
          </div>
        </div>
      </div>
    </main>
  );
}

function prettyElectionType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function OfficialMiniCard({
  person,
  color,
}: {
  readonly person: PartyOfficialMini;
  readonly color: string;
}) {
  return (
    <Link
      href={`/officials/${person.slug ?? person.id}`}
      className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-3 transition-all hover:border-emerald-400 hover:shadow-sm"
      style={{ borderLeftWidth: "3px", borderLeftColor: color }}
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
        <OfficialAvatar
          src={person.imageUrl}
          alt={person.name}
          px={44}
          imgClassName="w-11 h-11 rounded-full object-cover"
          fallback={<User className="h-5 w-5 text-slate-400" />}
        />
      </div>
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{person.name}</div>
        {person.contextLabel && (
          <div className="truncate text-xs text-muted-foreground">{person.contextLabel}</div>
        )}
      </div>
    </Link>
  );
}

function Pill({
  href,
  icon,
  label,
  external,
}: {
  readonly href: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-black/[0.03] px-4 py-2 text-[13px] text-slate-700 transition-colors hover:border-emerald-400 dark:border-slate-700 dark:bg-white/[0.05] dark:text-slate-300"
    >
      {icon}
      {label}
    </a>
  );
}
