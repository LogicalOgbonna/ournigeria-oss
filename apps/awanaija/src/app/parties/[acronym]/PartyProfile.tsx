"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Building2, Globe, Mail, Phone, MapPin, User, ChevronRight } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { partyColor } from "@/lib/partyColors";
import { stateLabel } from "@/lib/states";
import type { PartyDetail, PartyOfficialMini } from "@/lib/api";

// Lazy-load the map (and its geo data) so it stays off the initial bundle — it sits
// below the fold and only renders client-side.
const NigeriaChoropleth = dynamic(
  () => import("@/components/civic/NigeriaChoropleth").then((m) => m.NigeriaChoropleth),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[5/4] w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
    ),
  },
);

const ROLE_TILES = [
  { key: "governor", label: "Governors" },
  { key: "senator", label: "Senators" },
  { key: "rep", label: "Representatives" },
  { key: "mha", label: "State Assembly" },
  { key: "lga_chairman", label: "LGA Chairmen" },
  { key: "councilor", label: "Councilors" },
];

export function PartyProfile({ party }: { readonly party: PartyDetail }) {
  const color = partyColor(party.acronym, party.color);
  const fp = party.footprint;

  // Always show the big three; show the rest only when they have seats.
  const tiles = ROLE_TILES.filter((t, i) => i < 3 || (fp.byRole[t.key] ?? 0) > 0).map((t) => ({
    label: t.label,
    value: fp.byRole[t.key] ?? 0,
  }));

  const completeness =
    party.completenessScore != null ? Math.round(party.completenessScore * 100) : null;
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
    party.leaderName ? `Chair: ${party.leaderName}` : null,
  ].filter(Boolean) as string[];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-28">
      {/* Hero / identity */}
      <header
        className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:p-8"
        style={{ borderLeftWidth: "5px", borderLeftColor: color }}
      >
        <div className="flex items-start gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
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
              <h1 className="font-serif text-[30px] leading-tight text-slate-900 dark:text-white">
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
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{meta.join(" · ")}</p>
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
      </header>

      {/* Electoral footprint + map */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-slate-900 dark:text-white">
          Electoral footprint
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Currently active offices held nationwide.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="font-mono text-3xl font-bold leading-none text-slate-900 dark:text-white">
                {t.value.toLocaleString()}
              </div>
              <div className="mt-1.5 text-[11px] uppercase tracking-wide text-slate-400">
                {t.label}
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="font-mono text-3xl font-bold leading-none text-emerald-700 dark:text-emerald-300">
              {fp.statesControlled.length}
            </div>
            <div className="mt-1.5 text-[11px] uppercase tracking-wide text-emerald-600/70 dark:text-emerald-400/70">
              States present
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:p-6">
          {fp.statesControlled.length > 0 ? (
            <NigeriaChoropleth
              valuesByState={fp.seatsByState}
              color={color}
              className="mx-auto max-w-2xl"
            />
          ) : (
            <p className="py-12 text-center text-slate-400">
              No active offices held — this party isn&apos;t currently in power anywhere we track.
            </p>
          )}
        </div>
      </section>

      {/* Leadership — officeholders */}
      {(party.leadership.governors.length > 0 ||
        party.leadership.senators.length > 0 ||
        party.leadership.otherOffices.length > 0) && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-slate-900 dark:text-white">
            Leadership in office
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Officeholders currently serving under the {party.acronym} banner.
          </p>

          {party.leadership.governors.length > 0 && (
            <OfficeholderGroup
              title={`Governors (${party.leadership.governors.length})`}
              people={party.leadership.governors}
              color={color}
            />
          )}
          {party.leadership.senators.length > 0 && (
            <OfficeholderGroup
              title={`Senators (${party.leadership.senators.length})`}
              people={party.leadership.senators}
              color={color}
            />
          )}

          {party.leadership.otherOffices.length > 0 && (
            <div className="mt-6">
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-400">
                Also in office
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {party.leadership.otherOffices.map((o) => (
                  <Link
                    key={o.role}
                    href={`/officials?party=${party.acronym}&role=${o.role}`}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="font-mono text-2xl font-bold leading-none text-slate-900 dark:text-white">
                        {o.count.toLocaleString()}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                        {o.label}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 group-hover:underline dark:text-emerald-400">
                      View all <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Candidates — primary winners (flagbearers) */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-slate-900 dark:text-white">
          Flagbearers &amp; primary winners
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Candidates who won {party.acronym} primaries.
        </p>
        {party.candidates.length === 0 ? (
          <p className="mt-4 text-slate-400">No primary winners recorded yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {party.candidates.map((c, i) => (
              <OfficialMiniCard
                key={`${c.official.id}-${c.electionType}-${c.year}-${i}`}
                person={{
                  id: c.official.id,
                  slug: c.official.slug,
                  name: c.official.name,
                  imageUrl: c.official.imageUrl,
                  contextLabel: `${prettyElectionType(c.electionType)} · ${c.year}${c.scopeLabel && c.scopeLabel !== "National" ? ` · ${c.scopeLabel}` : c.scopeLabel === "National" ? " · National" : ""}`,
                }}
                color={color}
              />
            ))}
          </div>
        )}
      </section>

      {/* State chapters */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-slate-900 dark:text-white">
          State chapters
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {party.chapters.length} chapter{party.chapters.length === 1 ? "" : "s"} documented.
        </p>
        {party.chapters.length === 0 ? (
          <p className="mt-4 text-slate-400">No chapters documented yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {party.chapters.map((c) => {
              const filled =
                c.chairmanName || c.secretaryName || c.hqAddress || c.phoneNumber || c.email;
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="font-heading font-semibold text-slate-900 dark:text-white">
                    {stateLabel(c.stateCode)}
                  </div>
                  {filled ? (
                    <div className="mt-1.5 space-y-1 text-sm text-slate-500 dark:text-slate-400">
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

      {/* Contact & links */}
      {hasContact && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-slate-900 dark:text-white">
            Contact &amp; links
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
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
        </section>
      )}

      {party.hqAddress && (
        <section className="mt-6">
          <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="mt-0.5 h-4 w-4 text-emerald-500" />
            <span>National secretariat: {party.hqAddress}</span>
          </div>
        </section>
      )}

      {completeness != null && (
        <p className="mt-10 text-xs text-slate-400">
          Profile {completeness}% complete. Spot something missing? This data is community-enriched.
        </p>
      )}
    </main>
  );
}

function prettyElectionType(t: string): string {
  return t
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function OfficeholderGroup({
  title,
  people,
  color,
}: {
  readonly title: string;
  readonly people: PartyOfficialMini[];
  readonly color: string;
}) {
  return (
    <div className="mt-6">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <OfficialMiniCard key={p.id} person={p} color={color} />
        ))}
      </div>
    </div>
  );
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
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-emerald-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
      style={{ borderLeftWidth: "3px", borderLeftColor: color }}
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <OfficialAvatar
          src={person.imageUrl}
          alt={person.name}
          px={44}
          imgClassName="w-11 h-11 rounded-full object-cover"
          fallback={<User className="h-5 w-5 text-slate-400" />}
        />
      </div>
      <div className="min-w-0">
        <div className="truncate font-medium text-slate-900 dark:text-white">{person.name}</div>
        {person.contextLabel && (
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
            {person.contextLabel}
          </div>
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
