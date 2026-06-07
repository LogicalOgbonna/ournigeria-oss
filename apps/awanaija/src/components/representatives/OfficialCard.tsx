"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Phone, MapPin, HelpCircle } from "lucide-react";
import type { Official, Position } from "@/lib/api";

type RoleLevel = "local" | "state" | "assembly" | "hor" | "senator";

const ROLE_CONFIG: Record<
  string,
  { label: string; level: RoleLevel; scopeLabel: (p: Position | null, loc: LocationInfo) => string }
> = {
  councilor: {
    label: "Ward Councilor",
    level: "local",
    scopeLabel: (_p, loc) => `${loc.wardName || "Ward"} Ward`,
  },
  lga_chairman: {
    label: "LGA Chairman",
    level: "local",
    scopeLabel: (_p, loc) => `${loc.lgaName || "LGA"}`,
  },
  governor: {
    label: "State Governor",
    level: "state",
    scopeLabel: (_p, loc) => `${loc.stateName || "State"} State`,
  },
  mha: {
    label: "State House of Assembly",
    level: "assembly",
    scopeLabel: (p, loc) =>
      p?.constituency
        ? `${p.constituency} Constituency`
        : `${loc.lgaName || loc.stateName || ""} Constituency`,
  },
  representative: {
    label: "House of Representatives",
    level: "hor",
    scopeLabel: (p, loc) =>
      p?.constituency
        ? `${p.constituency} Federal Constituency`
        : `${loc.lgaName || ""} Federal Constituency`,
  },
  rep: {
    label: "House of Representatives",
    level: "hor",
    scopeLabel: (p, loc) =>
      p?.constituency
        ? `${p.constituency} Federal Constituency`
        : `${loc.lgaName || ""} Federal Constituency`,
  },
  senator: {
    label: "Senator",
    level: "senator",
    scopeLabel: (p, loc) =>
      p?.constituency
        ? `${p.constituency} Senatorial District`
        : `${loc.stateName || ""} Senatorial District`,
  },
};

const LEVEL_COLORS: Record<RoleLevel, { bg: string; text: string }> = {
  local: { bg: "bg-emerald-600", text: "text-emerald-100" },
  state: { bg: "bg-blue-600", text: "text-blue-100" },
  assembly: { bg: "bg-purple-600", text: "text-purple-100" },
  hor: { bg: "bg-amber-600", text: "text-amber-100" },
  senator: { bg: "bg-rose-600", text: "text-rose-100" },
};

const PARTY_COLORS: Record<string, string> = {
  APC: "#059669",
  PDP: "#ef4444",
  LP: "#0891b2",
  NNPP: "#d97706",
  APGA: "#65a30d",
  YPP: "#7c3aed",
  SDP: "#e11d48",
  ADC: "#0284c7",
};

interface LocationInfo {
  stateCode?: string;
  stateName?: string;
  lgaCode?: string;
  lgaName?: string;
  wardCode?: string;
  wardName?: string;
}

interface NarrativeOfficialCardProps {
  readonly official: Official | null;
  readonly position: Position | null;
  readonly role: string;
  readonly location: LocationInfo;
  readonly scope?: Record<string, string>;
}

export function NarrativeOfficialCard({
  official,
  position,
  role,
  location,
  scope,
}: NarrativeOfficialCardProps) {
  const [imgError, setImgError] = useState(false);
  const config = ROLE_CONFIG[role] || {
    label: role,
    level: "local" as RoleLevel,
    scopeLabel: () => "",
  };
  const colors = LEVEL_COLORS[config.level];
  const scopeLabel = config.scopeLabel(position, location);

  if (!official) {
    return (
      <VacantCard
        role={role}
        label={config.label}
        scopeLabel={scopeLabel}
        colors={colors}
        position={position}
        scope={scope}
        location={location}
      />
    );
  }

  const showImage = official.imageUrl && !imgError;
  const partyColor = position?.party ? PARTY_COLORS[position.party] || "#94a3b8" : null;
  const initials = official.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className={`${colors.bg} px-6 py-3`}>
        <span className={`text-xs font-bold tracking-widest ${colors.text} uppercase`}>
          {config.label} — {scopeLabel}
        </span>
      </div>
      <div className="p-6 flex flex-col sm:flex-row gap-6">
        <Link href={`/officials/${official.slug ?? official.id}`} className="shrink-0">
          {showImage ? (
            <img
              src={official.imageUrl!}
              alt={official.name}
              className="w-28 h-28 rounded-xl object-cover shadow-sm"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-28 h-28 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
              <span className="text-2xl font-bold text-slate-400 dark:text-slate-500">
                {initials}
              </span>
            </div>
          )}
        </Link>
        <div className="flex-1 space-y-3">
          <div>
            <Link href={`/officials/${official.slug ?? official.id}`}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-heading hover:text-emerald-600 transition-colors">
                {official.name}
              </h2>
            </Link>
            {position?.party && (
              <span
                className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-semibold text-white"
                style={{ backgroundColor: partyColor || "#94a3b8" }}
              >
                {position.party}{position.partyName ? ` — ${position.partyName}` : ""}
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <ContactRow
              icon={<Phone className="w-4 h-4" />}
              value={official.phoneNumber}
              placeholder="Phone not yet available"
              officialId={official.id}
              field="phoneNumber"
            />
            <ContactRow
              icon={<MapPin className="w-4 h-4" />}
              value={official.officeAddress}
              placeholder="Office address not yet available"
              officialId={official.id}
              field="officeAddress"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {official.twitterHandle ? (
              <SocialLink
                href={`https://x.com/${official.twitterHandle.replace(/^@/, "")}`}
                label="X"
              >
                <XIcon />
              </SocialLink>
            ) : (
              <MissingSocial label="X" />
            )}
            {official.facebookUrl ? (
              <SocialLink href={official.facebookUrl} label="Facebook">
                <FacebookIcon />
              </SocialLink>
            ) : (
              <MissingSocial label="Facebook" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  value,
  placeholder,
  officialId,
  field,
}: {
  icon: React.ReactNode;
  value: string | null;
  placeholder: string;
  officialId: string;
  field: string;
}) {
  if (value) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="text-slate-400 dark:text-slate-500 shrink-0">{icon}</span>
        <span>{value}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-slate-300 dark:text-slate-600 shrink-0">{icon}</span>
      <Link
        href={`/proposals/new?officialId=${officialId}&targetField=${field}`}
        className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
      >
        <span>{placeholder}</span>
        <HelpCircle className="w-3 h-3" />
        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          Help us find this
        </span>
      </Link>
    </div>
  );
}

function VacantCard({
  role,
  label,
  scopeLabel,
  colors,
  position,
  scope,
  location,
}: {
  role: string;
  label: string;
  scopeLabel: string;
  colors: { bg: string; text: string };
  position: Position | null;
  scope?: Record<string, string>;
  location: LocationInfo;
}) {
  const params = new URLSearchParams({ role });
  if (scope) {
    for (const [k, v] of Object.entries(scope)) {
      if (v) params.set(k, v);
    }
  }
  if (position) {
    if (position.stateCode) params.set("stateCode", position.stateCode);
    if (position.state) params.set("stateName", position.state);
    if (position.lgaCode) params.set("lgaCode", position.lgaCode);
    if (position.lga) params.set("lgaName", position.lga);
  }
  if (location.stateCode && !params.has("stateCode")) params.set("stateCode", location.stateCode);
  if (location.stateName && !params.has("stateName")) params.set("stateName", location.stateName);
  if (location.lgaCode && !params.has("lgaCode")) params.set("lgaCode", location.lgaCode);
  if (location.lgaName && !params.has("lgaName")) params.set("lgaName", location.lgaName);
  if (location.wardCode && !params.has("wardCode")) params.set("wardCode", location.wardCode);
  if (location.wardName && !params.has("wardName")) params.set("wardName", location.wardName);

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden">
      <div className={`${colors.bg} px-6 py-3 opacity-60`}>
        <span className={`text-xs font-bold tracking-widest ${colors.text} uppercase`}>
          {label} — {scopeLabel}
        </span>
      </div>
      <div className="p-6 flex flex-col sm:flex-row gap-6 items-center">
        <div className="w-28 h-28 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <User className="w-12 h-12 text-slate-300 dark:text-slate-600" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">
            Position Unidentified
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            We don&apos;t have data for the {label.toLowerCase()} of {scopeLabel} yet.
          </p>
          <Link
            href={`/proposals/new?${params.toString()}`}
            className="inline-block mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Help identify this person →
          </Link>
        </div>
      </div>
    </div>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition"
    >
      {children}
    </a>
  );
}

function MissingSocial({ label }: { label: string }) {
  return (
    <div
      aria-label={`${label} not available`}
      className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center opacity-30"
    >
      {label === "X" ? <XIcon /> : <FacebookIcon />}
    </div>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
