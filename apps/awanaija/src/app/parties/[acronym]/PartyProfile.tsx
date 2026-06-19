"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Building2, Globe, Mail, Phone, MapPin, User, Info } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { PartyOfficeholdersAccordion } from "@/components/civic/PartyOfficeholdersAccordion";
import { partyColor } from "@/lib/partyColors";
import type {
  PartyDetail,
  PartyOfficialMini,
  PartyOfficerView,
  PartySeatShare,
  SeatShareItem,
  PartyBudgetGoverned,
  PartySeatsByZone,
} from "@/lib/api";

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
                  <OfficerCard key={o.role} officer={o} />
                ))}
              </div>
            </section>
          )}

          {/* 3. States governed + spending + regional strongholds */}
          <section>
            <h2 className="font-heading text-2xl font-semibold text-slate-900 dark:text-white">
              States governed
            </h2>
            {statesGoverned.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">Holds no governorships.</p>
            ) : (
              <>
                <BudgetGoverned budget={party.budgetGoverned} statesGoverned={statesGoverned.length} />
                <div className="mt-4">
                  <NigeriaChoropleth
                    valuesByState={governedValues}
                    breakdownByState={party.footprint?.seatsByStateByRole}
                    color={color}
                    className="mx-auto max-w-xl"
                  />
                </div>
                <RegionalStrongholds data={party.seatsByZone} />
              </>
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

        </div>

        {/* ---------- RIGHT: elected officials by position ---------- */}
        <div className="w-full shrink-0 lg:w-80">
          <div className="lg:sticky lg:top-24">
            <SeatShareBand share={party.seatShare} />
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

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function SeatShareBand({ share }: { readonly share: PartySeatShare }) {
  if (!share) return null;
  const main: { label: string; item: SeatShareItem }[] = [
    { label: "Governorships", item: share.governorships },
    { label: "Senate", item: share.senate },
    { label: "House of Reps", item: share.house },
  ];
  return (
    <div className="mb-6">
      <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Power at a glance
      </h2>
      <div className="space-y-3 rounded-[10px] border border-border bg-card p-4">
        {main.map(({ label, item }) => {
          const pct = item.total > 0 ? Math.round((item.held / item.total) * 100) : 0;
          return (
            <div key={label}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="uppercase tracking-wide text-muted-foreground">{label}</span>
                <span className="font-mono">
                  <span className="font-bold text-foreground">{item.held}</span>
                  <span className="text-muted-foreground">
                    /{item.total} · {pct}%
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        <p className="pt-1 text-[11px] text-muted-foreground">
          +{share.stateAssembly.held.toLocaleString()}/{share.stateAssembly.total.toLocaleString()}{" "}
          assembly · {share.lga.held.toLocaleString()}/{share.lga.total.toLocaleString()} LGA
        </p>
      </div>
    </div>
  );
}

function BudgetGoverned({
  budget,
  statesGoverned,
}: {
  readonly budget: PartyBudgetGoverned;
  readonly statesGoverned: number;
}) {
  if (!budget?.totalNaira) {
    return (
      <p className="mt-1 text-sm text-muted-foreground">
        Holds the governorship in {statesGoverned} {statesGoverned === 1 ? "state" : "states"}.
      </p>
    );
  }
  const maxRaw = Math.max(...budget.topStates.map((s) => s.raw), 1);
  return (
    <div className="mt-2">
      <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-200">
        Governs <span className="font-semibold">{statesGoverned}</span> states with{" "}
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {budget.totalNaira}
        </span>{" "}
        in combined approved budgets.
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Based on {budget.statesWithData} of {budget.statesGoverned} states with budget data.
      </p>
      {budget.topStates.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {budget.topStates.map((s) => (
            <div key={s.stateCode} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">{s.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.round((s.raw / maxRaw) * 100)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                {s.naira}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ZONE_ROLE_LABELS: Record<string, string> = {
  governor: "Governors",
  senator: "Senators",
  rep: "Reps",
  mha: "Assembly",
  lga_chairman: "LGA Chairmen",
};

function RegionalStrongholds({ data }: { readonly data: PartySeatsByZone }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!data?.zones?.length) return null;
  return (
    <div className="mt-6">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-400">
        Regional strongholds
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Share of each zone&apos;s elected seats the party holds.
      </p>
      <div className="mt-3 space-y-2.5">
        {data.zones.map((z) => {
          const strongest = z.zoneName === data.strongestZone;
          const isOpen = open === z.zoneCode;
          return (
            <div key={z.zoneCode} className="group relative">
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{z.zoneName}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${strongest ? "bg-emerald-600" : "bg-emerald-400/70"}`}
                    style={{ width: `${z.pct}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {z.pct}%
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : z.zoneCode)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-emerald-600"
                  aria-label={`How ${z.zoneName}'s ${z.pct}% is derived`}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Breakdown: desktop hover (md:group-hover) or tap the info icon (mobile). */}
              <div
                className={`absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-border bg-popover p-3 text-xs shadow-lg md:group-hover:block ${isOpen ? "block" : "hidden"}`}
              >
                <div className="mb-1.5 font-medium text-foreground">
                  {z.zoneName}: holds {z.held.toLocaleString()} of {z.total.toLocaleString()} zone seats ({z.pct}%)
                </div>
                <div className="space-y-0.5 font-mono text-muted-foreground">
                  {z.byRole.map((r) => (
                    <div key={r.role} className="flex justify-between gap-3">
                      <span>{ZONE_ROLE_LABELS[r.role] ?? r.role}</span>
                      <span>
                        {r.held}/{r.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OfficerCard({ officer }: { readonly officer: PartyOfficerView }) {
  const inner = (
    <>
      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
        <OfficialAvatar
          src={officer.imageUrl}
          alt={officer.name}
          px={56}
          imgClassName="w-14 h-14 rounded-full object-cover"
          fallback={<User className="h-6 w-6 text-slate-400" />}
        />
      </div>
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{officer.name}</div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {OFFICER_ROLE_LABELS[officer.role] ?? officer.role}
        </div>
      </div>
    </>
  );

  // Link to the officer's official profile when we have one; otherwise static.
  if (officer.officialSlug) {
    return (
      <Link
        href={`/officials/${officer.officialSlug}`}
        className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-4 transition-all hover:border-emerald-400 hover:shadow-sm"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-4">
      {inner}
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
