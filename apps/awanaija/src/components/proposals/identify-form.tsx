"use client";

/**
 * Building blocks for the "identify an official" proposal flow.
 * Production: composed by /proposals/new (Variant C layout). Also used by the
 * /experiments/proposal/* comparison pages.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown, Search, Check, Loader2, X, ArrowLeft, Link2, Upload, ImageIcon,
  CheckCircle, AlertCircle, User, MapPin,
} from "lucide-react";
import {
  getParties, getStates, getLgas, getWards, getConstituencies,
  identifyOfficial, claimProposal,
  type SeatCandidate,
} from "@/lib/api";
import { TelegramDeepLinkLogin } from "@/components/auth/TelegramDeepLinkLogin";

// ─── Config ─────────────────────────────────────────────────────────────────

export type Depth = "state" | "lga" | "ward" | "constituency";

export const ROLE_OPTIONS: {
  value: string; label: string; depth: Depth; ctype?: string; blurb: string;
}[] = [
  { value: "councilor", label: "Ward Councilor", depth: "ward", blurb: "Represents a ward in the local council" },
  { value: "lga_chairman", label: "LGA Chairman", depth: "lga", blurb: "Chief executive of a Local Government" },
  { value: "mha", label: "State Assembly Member", depth: "constituency", ctype: "state", blurb: "Represents a state constituency" },
  { value: "representative", label: "House of Reps Member", depth: "constituency", ctype: "federal", blurb: "Represents a federal constituency" },
  { value: "senator", label: "Senator", depth: "constituency", ctype: "senatorial", blurb: "Represents a senatorial district" },
  { value: "governor", label: "Governor", depth: "state", blurb: "Chief executive of a state" },
];

export function roleConfig(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role);
}

export function ctxFromParams(sp: URLSearchParams): ProposalContext {
  const g = (k: string) => sp.get(k) || undefined;
  return {
    role: g("role"),
    stateCode: g("stateCode"), stateName: g("stateName"),
    lgaCode: g("lgaCode"), lgaName: g("lgaName"),
    wardCode: g("wardCode"), wardName: g("wardName"),
    constituencyCode: g("constituencyCode"), constituencyName: g("constituencyName"),
  };
}

export function hasFullContext(ctx: ProposalContext): boolean {
  if (!ctx.role) return false;
  const d = roleConfig(ctx.role)?.depth;
  if (d === "state") return !!ctx.stateCode;
  if (d === "lga") return !!ctx.stateCode && !!ctx.lgaCode;
  if (d === "ward") return !!ctx.stateCode && !!ctx.lgaCode && !!ctx.wardCode;
  if (d === "constituency") return !!ctx.stateCode && !!ctx.constituencyCode;
  return false;
}

export const PROFILE_FIELDS = [
  { key: "email", label: "Email Address", kind: "email", placeholder: "e.g. senator@example.com" },
  { key: "phoneNumber", label: "Phone Number", kind: "text", placeholder: "e.g. 08012345678" },
  { key: "officeAddress", label: "Office Address", kind: "textarea", placeholder: "e.g. National Assembly Complex, Abuja" },
  { key: "twitterHandle", label: "Twitter Handle", kind: "text", placeholder: "e.g. senatoreze (without @)" },
  { key: "facebookUrl", label: "Facebook URL", kind: "text", placeholder: "e.g. https://facebook.com/senatoreze" },
  { key: "education", label: "Education", kind: "textarea", placeholder: "e.g. B.Sc Economics, University of Lagos" },
  { key: "biography", label: "Biography", kind: "textarea", placeholder: "Brief biography of the official..." },
  { key: "gender", label: "Gender", kind: "gender" },
  { key: "dateOfBirth", label: "Date of Birth", kind: "date" },
] as const;

export type ProfileKey = (typeof PROFILE_FIELDS)[number]["key"];

export interface ProposalContext {
  role?: string;
  stateCode?: string; stateName?: string;
  lgaCode?: string; lgaName?: string;
  wardCode?: string; wardName?: string;
  constituencyCode?: string; constituencyName?: string;
}

const inputCls =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

// ─── Hook: all field state + submit + auth ──────────────────────────────────

export function useIdentifyForm(ctx: ProposalContext) {
  const [role, setRole] = useState(ctx.role || "");
  const [stateCode, setStateCode] = useState(ctx.stateCode || "");
  const [stateName, setStateName] = useState(ctx.stateName || "");
  const [lgaCode, setLgaCode] = useState(ctx.lgaCode || "");
  const [lgaName, setLgaName] = useState(ctx.lgaName || "");
  const [wardCode, setWardCode] = useState(ctx.wardCode || "");
  const [wardName, setWardName] = useState(ctx.wardName || "");
  const [constituencyCode, setConstituencyCode] = useState(ctx.constituencyCode || "");
  const [constituencyName, setConstituencyName] = useState(ctx.constituencyName || "");

  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [profile, setProfile] = useState<Record<ProfileKey, string>>({
    email: "", phoneNumber: "", officeAddress: "", twitterHandle: "",
    facebookUrl: "", education: "", biography: "", gender: "", dateOfBirth: "",
  });
  const [sourceUrl, setSourceUrl] = useState("");

  const [parties, setParties] = useState<{ acronym: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newOfficialId, setNewOfficialId] = useState<string | null>(null);
  const [newProposalId, setNewProposalId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => { getParties().then(setParties).catch(() => {}); }, []);

  const depth = roleConfig(role)?.depth;
  const locationComplete =
    depth === "state" ? !!stateCode :
    depth === "lga" ? !!stateCode && !!lgaCode :
    depth === "ward" ? !!stateCode && !!lgaCode && !!wardCode :
    depth === "constituency" ? !!stateCode && !!constituencyCode :
    false;

  const coreReady = !!role && !!name.trim() && !!party && locationComplete;

  function locationLabel() {
    return [stateName, lgaName, wardName, constituencyName].filter(Boolean).join(" › ");
  }

  async function submit() {
    if (!coreReady) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await identifyOfficial({
        name: name.trim(),
        role,
        partyAcronym: party || undefined,
        imageUrl: imageUrl.trim() || undefined,
        email: profile.email.trim() || undefined,
        phoneNumber: profile.phoneNumber.trim() || undefined,
        officeAddress: profile.officeAddress.trim() || undefined,
        twitterHandle: profile.twitterHandle.trim() || undefined,
        facebookUrl: profile.facebookUrl.trim() || undefined,
        gender: profile.gender.trim() || undefined,
        education: profile.education.trim() || undefined,
        biography: profile.biography.trim() || undefined,
        dateOfBirth: profile.dateOfBirth || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        stateCode: stateCode || undefined,
        lgaCode: lgaCode || undefined,
        wardCode: wardCode || undefined,
        constituencyCode: constituencyCode || undefined,
      });
      setNewOfficialId(result.officialId);
      setNewProposalId(result.id);
      setIsAnonymous(result.trust === "anonymous");
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      if (e.status === 429) setError("You've submitted too many recently. Please try again later.");
      else setError((e.message as string) || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  // Confirm an existing seat candidate: submits an identification with the given
  // exact name so the API resolves it to a corroboration (not a duplicate).
  // Unlike submit(), this is NOT gated on party — the name + seat is enough to
  // corroborate an existing candidate.
  async function confirmName(candidateName: string) {
    if (!candidateName.trim() || !locationComplete) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await identifyOfficial({
        name: candidateName.trim(),
        role,
        partyAcronym: party || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        stateCode: stateCode || undefined,
        lgaCode: lgaCode || undefined,
        wardCode: wardCode || undefined,
        constituencyCode: constituencyCode || undefined,
      });
      setNewOfficialId(result.officialId);
      setNewProposalId(result.id);
      setIsAnonymous(result.trust === "anonymous");
      setName(candidateName.trim());
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      if (e.status === 429) setError("You've submitted too many recently. Please try again later.");
      else setError((e.message as string) || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    role, setRole,
    stateCode, setStateCode, stateName, setStateName,
    lgaCode, setLgaCode, lgaName, setLgaName,
    wardCode, setWardCode, wardName, setWardName,
    constituencyCode, setConstituencyCode, constituencyName, setConstituencyName,
    name, setName, party, setParty, imageUrl, setImageUrl,
    profile, setProfile, sourceUrl, setSourceUrl,
    parties, submitting, success, newOfficialId, newProposalId, isAnonymous, setIsAnonymous,
    error, showAuth, setShowAuth,
    depth, locationComplete, coreReady, locationLabel, submit, confirmName,
  };
}

export type IdentifyForm = ReturnType<typeof useIdentifyForm>;

// ─── Searchable select ──────────────────────────────────────────────────────

export function SearchSelect({
  placeholder, options, value, onChange, disabled,
}: {
  placeholder: string;
  options: { code: string; name: string }[];
  value: string;
  onChange: (code: string, name: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.code === value);
  const filtered = q.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()))
    : options;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${inputCls} flex items-center justify-between text-left disabled:opacity-50`}
      >
        <span className={selected ? "" : "text-slate-400"}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
          <div className="relative p-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="max-h-56 overflow-y-auto scrollbar-theme pb-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-400 text-center">No results</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => { onChange(o.code, o.name); setOpen(false); setQ(""); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{o.name}</span>
                  {o.code === value && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── Role field ─────────────────────────────────────────────────────────────

export function RoleField({ form }: { form: IdentifyForm }) {
  return (
    <div>
      <Label required>What position are you identifying?</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ROLE_OPTIONS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => {
              form.setRole(r.value);
              // reset geo that no longer applies
              form.setLgaCode(""); form.setLgaName("");
              form.setWardCode(""); form.setWardName("");
              form.setConstituencyCode(""); form.setConstituencyName("");
            }}
            className={`text-left rounded-lg border p-3 transition-colors ${
              form.role === r.value
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                : "border-slate-200 dark:border-slate-700 hover:border-emerald-300"
            }`}
          >
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.blurb}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Location field (role-aware cascade) ────────────────────────────────────

export function LocationField({ form }: { form: IdentifyForm }) {
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const [lgas, setLgas] = useState<{ code: string; name: string }[]>([]);
  const [wards, setWards] = useState<{ code: string; name: string }[]>([]);
  const [consts, setConsts] = useState<{ code: string; name: string }[]>([]);
  const depth = form.depth;
  const ctype = roleConfig(form.role)?.ctype;

  useEffect(() => { getStates().then(setStates).catch(() => {}); }, []);
  useEffect(() => {
    if (!form.stateCode) { setLgas([]); setConsts([]); return; }
    if (depth === "lga" || depth === "ward") getLgas(form.stateCode).then(setLgas).catch(() => {});
    if (depth === "constituency" && ctype) getConstituencies(form.stateCode, ctype).then(setConsts).catch(() => {});
  }, [form.stateCode, depth, ctype]);
  useEffect(() => {
    if (depth === "ward" && form.lgaCode) getWards(form.lgaCode).then(setWards).catch(() => {});
  }, [form.lgaCode, depth]);

  if (!form.role) {
    return <p className="text-sm text-slate-400">Pick a position first to choose its location.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <Label required>State</Label>
        <SearchSelect
          placeholder="Select state"
          options={states}
          value={form.stateCode}
          onChange={(code, n) => {
            form.setStateCode(code); form.setStateName(n);
            form.setLgaCode(""); form.setLgaName("");
            form.setWardCode(""); form.setWardName("");
            form.setConstituencyCode(""); form.setConstituencyName("");
          }}
        />
      </div>

      {(depth === "lga" || depth === "ward") && (
        <div>
          <Label required>LGA</Label>
          <SearchSelect
            placeholder={form.stateCode ? "Select LGA" : "Select state first"}
            options={lgas}
            value={form.lgaCode}
            disabled={!form.stateCode}
            onChange={(code, n) => {
              form.setLgaCode(code); form.setLgaName(n);
              form.setWardCode(""); form.setWardName("");
            }}
          />
        </div>
      )}

      {depth === "ward" && (
        <div>
          <Label required>Ward</Label>
          <SearchSelect
            placeholder={form.lgaCode ? "Select ward" : "Select LGA first"}
            options={wards}
            value={form.wardCode}
            disabled={!form.lgaCode}
            onChange={(code, n) => { form.setWardCode(code); form.setWardName(n); }}
          />
        </div>
      )}

      {depth === "constituency" && (
        <div>
          <Label required>
            {ctype === "state" ? "State Constituency" : ctype === "senatorial" ? "Senatorial District" : "Federal Constituency"}
          </Label>
          <SearchSelect
            placeholder={form.stateCode ? "Select constituency" : "Select state first"}
            options={consts}
            value={form.constituencyCode}
            disabled={!form.stateCode}
            onChange={(code, n) => { form.setConstituencyCode(code); form.setConstituencyName(n); }}
          />
        </div>
      )}
    </div>
  );
}

// Shown when location came from context (locked, confirmed).
export function LocationChip({ form }: { form: IdentifyForm }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
          {roleConfig(form.role)?.label || "Position"}
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{form.locationLabel()}</p>
      </div>
    </div>
  );
}

// ─── Seat verification (fetch-existing-first) ───────────────────────────────

// Shown when the seat already has proposed candidate(s). Lets the citizen
// corroborate the leading name (a "confirm"), suggest a different name (a
// competing submission), or attach a source.
export function SeatVerificationView({
  form,
  candidates,
  onSuggestDifferent,
}: {
  form: IdentifyForm;
  candidates: SeatCandidate[];
  onSuggestDifferent: () => void;
}) {
  const [showSource, setShowSource] = useState(false);
  const [leader, ...others] = candidates;
  if (!leader) return null;

  return (
    <div className="space-y-5">
      <LocationChip form={form} />

      <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-4">
        <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
          Someone said this seat is held by
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-white">{leader.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {leader.partyAcronym ? `${leader.partyAcronym} · ` : ""}
          {leader.confirmCount === 1
            ? "1 person has confirmed this"
            : `${leader.confirmCount} people have confirmed this`}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => form.confirmName(leader.name)}
            disabled={form.submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {form.submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</>
            ) : (
              <><Check className="w-4 h-4" /> Yes, confirm this</>
            )}
          </button>
          <button
            type="button"
            onClick={onSuggestDifferent}
            disabled={form.submitting}
            className="w-full py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Suggest a different name
          </button>
        </div>

        <div className="mt-3">
          {!showSource ? (
            <button
              type="button"
              onClick={() => setShowSource(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
            >
              <Link2 className="w-3.5 h-3.5" /> Add a source
            </button>
          ) : (
            <SourceField form={form} />
          )}
        </div>
      </div>

      {others.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-2">
            Other proposed names
          </p>
          <ul className="space-y-1.5">
            {others.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                  {c.name}
                  {c.partyAcronym && (
                    <span className="text-slate-400"> · {c.partyAcronym}</span>
                  )}
                </span>
                <span className="text-xs text-slate-400 shrink-0 ml-2">
                  {c.confirmCount === 1 ? "1 confirm" : `${c.confirmCount} confirms`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ErrorBox message={form.error} />
    </div>
  );
}

// ─── Name + party ───────────────────────────────────────────────────────────

export function NameField({ form }: { form: IdentifyForm }) {
  return (
    <div>
      <Label required>Full Name</Label>
      <input
        type="text"
        value={form.name}
        onChange={(e) => form.setName(e.target.value)}
        placeholder="e.g. John Okafor"
        className={inputCls}
      />
    </div>
  );
}

export function PartyField({ form }: { form: IdentifyForm }) {
  return (
    <div>
      <Label required>Political Party</Label>
      <select value={form.party} onChange={(e) => form.setParty(e.target.value)} className={inputCls}>
        <option value="">Select party</option>
        {form.parties.map((p) => (
          <option key={p.acronym} value={p.acronym}>{p.acronym} — {p.name}</option>
        ))}
      </select>
    </div>
  );
}

export function SourceField({ form }: { form: IdentifyForm }) {
  return (
    <div>
      <Label>Source URL <span className="text-slate-400 font-normal">(optional)</span></Label>
      <input
        type="url"
        value={form.sourceUrl}
        onChange={(e) => form.setSourceUrl(e.target.value)}
        placeholder="e.g. https://dailytrust.ng/article..."
        className={inputCls}
      />
      <p className="text-xs text-slate-400 mt-1">A news article or official page confirming this person.</p>
    </div>
  );
}

// ─── Optional details (collapsible) ─────────────────────────────────────────

export function OptionalDetails({ form, defaultOpen = false }: { form: IdentifyForm; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const filled = Object.values(form.profile).filter((v) => v.trim()).length + (form.imageUrl ? 1 : 0);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        <span>Add more details <span className="text-slate-400 font-normal">(optional{filled ? ` · ${filled} added` : ""})</span></span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <PhotoField value={form.imageUrl} onChange={form.setImageUrl} />
          {PROFILE_FIELDS.map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              {f.kind === "textarea" ? (
                <textarea
                  rows={f.key === "biography" ? 4 : 3}
                  value={form.profile[f.key]}
                  onChange={(e) => form.setProfile((c) => ({ ...c, [f.key]: e.target.value }))}
                  placeholder={"placeholder" in f ? f.placeholder : undefined}
                  className={`${inputCls} resize-y`}
                />
              ) : f.kind === "gender" ? (
                <select
                  value={form.profile[f.key]}
                  onChange={(e) => form.setProfile((c) => ({ ...c, [f.key]: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              ) : (
                <input
                  type={f.kind === "email" ? "email" : f.kind === "date" ? "date" : "text"}
                  value={form.profile[f.key]}
                  onChange={(e) => form.setProfile((c) => ({ ...c, [f.key]: e.target.value }))}
                  placeholder={"placeholder" in f ? f.placeholder : undefined}
                  className={inputCls}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Photo (URL / upload) ───────────────────────────────────────────────────

export function PhotoField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function compress(file: File) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("bad image")); i.src = url;
      });
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      let q = 0.82, out = c.toDataURL("image/jpeg", q);
      while (out.length > 450 * 1024 && q > 0.45) { q -= 0.08; out = c.toDataURL("image/jpeg", q); }
      return out;
    } finally { URL.revokeObjectURL(url); }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const out = await compress(file); setPreview(out); onChange(out); }
    catch { /* ignore in experiment */ }
    finally { setUploading(false); e.target.value = ""; }
  }

  return (
    <div>
      <Label>Photo</Label>
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-2">
        <button type="button" onClick={() => { setMode("url"); setPreview(null); onChange(""); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm ${mode === "url" ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600"}`}>
          <Link2 className="w-3.5 h-3.5" /> URL
        </button>
        <button type="button" onClick={() => { setMode("upload"); onChange(""); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm ${mode === "upload" ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600"}`}>
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>
      {mode === "url" ? (
        <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://example.com/photo.jpg" className={inputCls} />
      ) : preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="preview" className="w-24 h-24 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
          <button type="button" onClick={() => { setPreview(null); onChange(""); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
          {uploading && <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-emerald-400">
          <ImageIcon className="w-7 h-7 text-slate-400 mb-1" />
          <span className="text-sm text-slate-500">Click to select an image</span>
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
      )}
    </div>
  );
}

// ─── Error + submit + success ───────────────────────────────────────────────

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
    </div>
  );
}

export function SubmitButton({ form, label = "Submit" }: { form: IdentifyForm; label?: string }) {
  return (
    <button
      type="button"
      onClick={form.submit}
      disabled={form.submitting || !form.coreReady}
      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {form.submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : label}
    </button>
  );
}

export function SuccessCard({ form }: { form: IdentifyForm }) {
  const [showAuth, setShowAuth] = useState(false);
  return (
    <div className="text-center pt-10">
      <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-2">Official Identified!</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        <span className="font-medium">{form.name}</span> submitted as {roleConfig(form.role)?.label}. Under review.
      </p>
      {form.newOfficialId && (
        <Link href={`/officials/${form.newOfficialId}`} className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg">
          View Profile
        </Link>
      )}
      {form.isAnonymous && form.newProposalId && !showAuth && (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Want to track this contribution?{" "}
          <button type="button" onClick={() => setShowAuth(true)} className="font-medium text-emerald-600 hover:underline">
            Log in
          </button>{" "}
          and we&apos;ll notify you when it&apos;s reviewed.
        </p>
      )}
      {showAuth && form.newProposalId && (
        <AuthModal
          onVerified={() => {
            setShowAuth(false);
            claimProposal(form.newProposalId!).catch(() => {});
            form.setIsAnonymous(false);
          }}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}

// ─── Auth modal (Telegram + WhatsApp OTP) ───────────────────────────────────

export function AuthModal({ onVerified, onClose }: { onVerified: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<"telegram" | "whatsapp">("telegram");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  async function waitForSession() {
    for (let i = 0; i < 6; i++) {
      try { const r = await fetch("/api/auth/profile", { credentials: "include", cache: "no-store" }); if (r.ok) return true; } catch {}
      await new Promise((res) => setTimeout(res, 250));
    }
    return false;
  }

  useEffect(() => { if (countdown <= 0) return; const t = setTimeout(() => setCountdown((c) => c - 1), 1000); return () => clearTimeout(t); }, [countdown]);

  async function sendOtp() {
    const full = phone.startsWith("+") ? phone : `+234${phone.replace(/^0/, "")}`;
    if (full.length < 10) { setErr("Enter a valid phone number"); return; }
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ phoneNumber: full }) });
      const d = await r.json(); if (!r.ok) { setErr(d.error || "Failed to send OTP"); return; }
      setStep("code"); setCountdown(60);
    } catch { setErr("Network error."); } finally { setLoading(false); }
  }

  async function verify() {
    const full = phone.startsWith("+") ? phone : `+234${phone.replace(/^0/, "")}`;
    const c = code.join(""); if (c.length !== 6) return;
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ phoneNumber: full, code: c }) });
      const d = await r.json(); if (!r.ok) { setErr(d.error || "Verification failed"); return; }
      onVerified();
    } catch { setErr("Network error."); } finally { setLoading(false); }
  }

  const codeStr = code.join("");
  useEffect(() => { if (codeStr.length === 6 && step === "code" && !loading) verify(); /* eslint-disable-next-line */ }, [codeStr]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="p-5 pb-0">
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4 text-slate-500" /></button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Verify to contribute</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sign in to submit your proposal.</p>
        </div>
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-5">
          {(["telegram", "whatsapp"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setErr(null); }}
              className={`flex-1 pb-3 text-sm font-medium capitalize ${tab === t ? "border-b-2 border-emerald-500 text-emerald-600" : "text-slate-400"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="p-5">
          <ErrorBox message={err} />
          {tab === "telegram" ? (
            <div className="space-y-3 pt-1">
              <p className="text-center text-sm text-slate-500">Sign in with your Telegram account.</p>
              <div className="flex min-h-[40px] items-center justify-center">
                <TelegramDeepLinkLogin
                  onAuthenticated={async () => {
                    setErr(null);
                    (await waitForSession()) ? onVerified() : setErr("Login didn't finish. Try again.");
                  }}
                />
              </div>
            </div>
          ) : step === "phone" ? (
            <div className="space-y-3 pt-1">
              <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                <span className="flex items-center px-3 bg-slate-50 dark:bg-slate-800 text-sm text-slate-400 border-r border-slate-300 dark:border-slate-700">+234</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="XXX XXX XXXX" className="flex-1 px-3 py-3 text-sm bg-white dark:bg-slate-800 focus:outline-none" autoFocus />
              </div>
              <button onClick={sendOtp} disabled={loading || phone.length < 7} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Send code
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <button type="button" onClick={() => { setStep("phone"); setCode(["", "", "", "", "", ""]); setErr(null); }} className="inline-flex items-center gap-1 text-xs text-slate-400"><ArrowLeft className="h-3 w-3" /> Change number</button>
              <div className="flex justify-center gap-2">
                {code.map((d, i) => (
                  <input key={i} id={`exp-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(-1); const nc = [...code]; nc[i] = v; setCode(nc); if (v && i < 5) document.getElementById(`exp-otp-${i + 1}`)?.focus(); }}
                    className="h-12 w-10 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-center text-xl font-bold focus:border-emerald-500 outline-none" autoFocus={i === 0} />
                ))}
              </div>
              <button onClick={verify} disabled={codeStr.length !== 6 || loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Verify
              </button>
              <div className="text-center">
                <button type="button" onClick={sendOtp} disabled={countdown > 0 || loading} className="text-xs font-semibold text-emerald-600 disabled:text-slate-400">
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Page chrome shared by variants
export function ExperimentShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)]">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-16">
        <Link href="/experiments/proposal" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-5">
          <ArrowLeft className="w-4 h-4" /> All variants
        </Link>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40"><User className="w-5 h-5 text-emerald-600" /></span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-heading">{title}</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
