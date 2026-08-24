"use client";

/**
 * ElectionHero — 2027 election variant of the landing hero (DESKTOP-FIRST pass).
 *
 * Zone 1 — "Your State Government": a FULL-BLEED, AUTO-SCROLLING carousel by
 *          MAJOR PARTY (max 5). Each slide leads with a large, prominent Governor
 *          portrait + that party's State House of Assembly slate for the state.
 * Zone 2 — "Your Federal Representatives": President + the viewer's Senator +
 *          House of Reps race.
 *
 * NOTE: sample Lagos data hardcoded for design iteration. Real data + PostHog
 * `2027-election` flag + location wiring come after the layout is locked.
 * Data gaps reflected: (a) no State-Assembly rows exist yet (placeholder shown),
 * (b) Senate/Reps are state-level (no constituency map yet), (c) governor photos
 * fall back to a party-tinted portrait until real images are attached.
 */

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, ArrowRight } from "lucide-react";
import { Show } from "@/components/ui/Show";

const ROTATE_MS = 5000;

type Candidate = { name: string; party: string; note?: string; image?: string };

const PARTY_COLORS: Record<string, string> = {
  APC: "#059669",
  PDP: "#ef4444",
  LP: "#0891b2",
  NDC: "#7c3aed",
  ADC: "#0284c7",
  SDP: "#e11d48",
  Accord: "#16a34a",
  AAC: "#dc2626",
  APM: "#0ea5e9",
};
const pc = (p: string) => PARTY_COLORS[p] ?? "#94a3b8";
const initials = (n: string) =>
  n
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const PARTY_NAMES: Record<string, string> = {
  APC: "All Progressives Congress",
  PDP: "Peoples Democratic Party",
  LP: "Labour Party",
  NDC: "National Democratic Coalition",
  ADC: "African Democratic Congress",
};

// Sample state: Lagos. Major-5 parties, governor per party + (missing) assembly.
const STATE = "Lagos";
const PARTIES = ["APC", "PDP", "LP", "NDC", "ADC"] as const;

const GOVERNORS: Record<string, Candidate> = {
  APC: { name: "Obafemi Hamzat", party: "APC" },
  PDP: { name: "Adedeji Doherty", party: "PDP" },
  LP: { name: "Biodun Rhodes-Vivour", party: "LP" },
  NDC: { name: "Funso Doherty", party: "NDC" },
  ADC: { name: "Gbadebo Rhodes-Vivour", party: "ADC" },
};

const PRESIDENT: Candidate[] = [
  { name: "Bola Ahmed Tinubu", party: "APC", note: "Incumbent" },
  { name: "Peter Obi", party: "NDC" },
  { name: "Atiku Abubakar", party: "ADC" },
  { name: "Chibuzo Okereke", party: "LP" },
];
const SENATE: Candidate[] = [
  { name: "Wasiu Eshilokun-Sanni", party: "APC" },
  { name: "Charles Obadiaru", party: "PDP" },
  { name: "Oswald Olatunbosun", party: "LP" },
  { name: "Ladipo Johnson", party: "NDC" },
];
const REPS: Candidate[] = [
  { name: "Fuad Atanda-Lawal", party: "APC" },
  { name: "Owolabi Bello", party: "ADC" },
  { name: "Emmanuel Oluwanuyi", party: "AAC" },
];

function Avatar({ c, size = 44 }: { c: Candidate; size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-[family-name:var(--font-heading)] font-bold text-white"
      style={{
        width: size,
        height: size,
        background: pc(c.party),
        fontSize: size * 0.34,
        boxShadow: `0 0 0 2px var(--background), 0 0 0 4px ${pc(c.party)}`,
      }}
    >
      {initials(c.name)}
    </div>
  );
}

function PartyChip({ party }: { party: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold"
      style={{
        color: pc(party),
        background: `color-mix(in srgb, ${pc(party)} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${pc(party)} 30%, transparent)`,
      }}
    >
      {party}
    </span>
  );
}

/** Large, prominent governor portrait. Uses a real photo when present, else a
 *  party-tinted poster with big initials. */
function GovernorPortrait({ c }: { c: Candidate }) {
  return (
    <div
      className="relative aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-[2rem] shadow-2xl"
      style={{
        background: `linear-gradient(160deg, color-mix(in srgb, ${pc(
          c.party
        )} 32%, #0b1512) 0%, ${pc(c.party)} 100%)`,
        boxShadow: `0 30px 60px -20px color-mix(in srgb, ${pc(c.party)} 55%, transparent)`,
      }}
    >
      <Show when={!!c.image}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
      </Show>
      <Show when={!c.image}>
        <div className="grid h-full w-full place-items-center">
          <span className="font-[family-name:var(--font-heading)] text-[5rem] font-bold text-white/95">
            {initials(c.name)}
          </span>
        </div>
      </Show>
      {/* name plate */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-10">
        <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-white/70">
          For Governor of {STATE}
        </p>
        <p className="font-[family-name:var(--font-heading)] text-xl font-bold leading-tight text-white">
          {c.name}
        </p>
      </div>
    </div>
  );
}

/** A race column: office label + candidate rows. */
function RaceCard({
  label,
  scope,
  candidates,
}: {
  label: string;
  scope: string;
  candidates: Candidate[];
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-card/60 p-5 shadow-lg shadow-black/5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-[family-name:var(--font-heading)] text-base font-semibold">
          {label}
        </h4>
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide text-muted-foreground">
          {scope}
        </span>
      </div>
      <div className="space-y-2.5">
        {candidates.map((c) => (
          <a
            key={c.name}
            href="#"
            className="group flex items-center gap-3 rounded-xl border border-transparent p-1.5 transition-colors hover:border-border/60 hover:bg-muted/30"
          >
            <Avatar c={c} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <Show when={!!c.note}>
                <p className="text-[11px] text-muted-foreground">{c.note}</p>
              </Show>
            </div>
            <PartyChip party={c.party} />
          </a>
        ))}
      </div>
    </div>
  );
}

export function ElectionHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const party = PARTIES[active];
  const gov = GOVERNORS[party];
  const go = (dir: number) =>
    setActive((a) => (a + dir + PARTIES.length) % PARTIES.length);

  // auto-scroll through parties (pause on hover)
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  useEffect(() => {
    const t = setInterval(() => {
      if (!pausedRef.current) setActive((a) => (a + 1) % PARTIES.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative overflow-hidden pt-28 lg:pt-32">
      <style>{`@keyframes ehProgress{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/40 dark:via-background" />
      </div>

      {/* header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/8 px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> 2027 General Election
            </span>
            <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
              The people who want to{" "}
              <span
                className="italic"
                style={{
                  fontFamily: "var(--font-serif)",
                  background: "linear-gradient(90deg,#047857,#059669,#6ee7b7)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                govern you.
              </span>
            </h1>
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm shadow-sm">
            <span className="grid h-2 w-2 place-items-center rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            Voting in <b className="font-semibold">{STATE}</b>
            <span className="ml-1 font-[family-name:var(--font-mono)] text-[11px] text-emerald-600">
              change
            </span>
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Your state government · by party
          </p>
          <div className="hidden gap-1.5 lg:flex">
            {PARTIES.map((p, i) => (
              <button
                key={p}
                onClick={() => setActive(i)}
                className="rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-xs font-semibold transition-all"
                style={
                  i === active
                    ? { background: pc(p), color: "#fff" }
                    : {
                        color: pc(p),
                        background: `color-mix(in srgb, ${pc(p)} 10%, transparent)`,
                      }
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== ZONE 1 — FULL-BLEED party carousel ===================== */}
      <div
        className="relative w-full transition-colors duration-500"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          background: `linear-gradient(180deg, transparent 0%, color-mix(in srgb, ${pc(
            party
          )} 9%, transparent) 22%, color-mix(in srgb, ${pc(
            party
          )} 9%, transparent) 78%, transparent 100%)`,
        }}
      >
        {/* nav arrows */}
        <button
          onClick={() => go(-1)}
          className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card/80 p-2 shadow-md backdrop-blur hover:bg-card lg:block"
          aria-label="Previous party"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => go(1)}
          className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card/80 p-2 shadow-md backdrop-blur hover:bg-card lg:block"
          aria-label="Next party"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[300px_1fr] lg:gap-14 lg:px-8 lg:py-14">
          {/* prominent governor portrait */}
          <div key={party} className="mx-auto animate-in fade-in slide-in-from-left-4 duration-500">
            <GovernorPortrait c={gov} />
          </div>

          {/* right: party + assembly */}
          <div key={`meta-${party}`} className="animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div
                className="grid h-11 w-11 place-items-center rounded-2xl font-[family-name:var(--font-heading)] text-base font-bold text-white"
                style={{ background: pc(party) }}
              >
                {party}
              </div>
              <div>
                <p
                  className="font-[family-name:var(--font-heading)] text-2xl font-bold leading-tight"
                  style={{ color: pc(party) }}
                >
                  {PARTY_NAMES[party]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {STATE} · slate for the 2027 election
                </p>
              </div>
            </div>

            {/* State House of Assembly — NO DATA yet (placeholder) */}
            <div className="mt-7">
              <p className="mb-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-muted-foreground">
                {party} · State House of Assembly
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:max-w-2xl">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/40 p-2.5"
                  >
                    <div className="h-9 w-9 shrink-0 rounded-full bg-muted" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="h-2.5 w-3/4 rounded bg-muted" />
                      <div className="h-2 w-1/2 rounded bg-muted/70" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-medium text-muted-foreground">
                  State-assembly candidates — data coming soon
                </span>
                <a
                  href={`/parties/${party}`}
                  className="inline-flex items-center gap-1 font-[family-name:var(--font-mono)] text-xs font-medium"
                  style={{ color: pc(party) }}
                >
                  Full {party} page <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* progress dots + auto-advance bar */}
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 pb-8">
          <div className="flex gap-2">
            {PARTIES.map((p, i) => (
              <button
                key={p}
                onClick={() => setActive(i)}
                aria-label={p}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === active ? 26 : 8,
                  background: i === active ? pc(p) : "var(--border)",
                }}
              />
            ))}
          </div>
          <div className="h-0.5 w-40 overflow-hidden rounded-full bg-border/60">
            <div
              key={`${active}-${paused}`}
              className="h-full origin-left rounded-full"
              style={{
                background: pc(party),
                animation: paused ? "none" : `ehProgress ${ROTATE_MS}ms linear`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ===================== ZONE 2 — Federal ===================== */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-4 mt-12 flex items-center gap-3">
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Your federal representatives
          </p>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <RaceCard label="President" scope="Nationwide" candidates={PRESIDENT} />
          <RaceCard
            label="Senate — Lagos Central"
            scope="Your district"
            candidates={SENATE}
          />
          <RaceCard
            label="House of Reps — Eti-Osa"
            scope="Your constituency"
            candidates={REPS}
          />
        </div>

        <p className="mt-6 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px] text-muted-foreground/70">
          <MapPin className="h-3 w-3" /> Primary winners, reviewed against public
          sources · tap any candidate for their record
        </p>
      </div>
    </section>
  );
}
