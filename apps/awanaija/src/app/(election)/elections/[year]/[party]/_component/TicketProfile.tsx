import Image from "next/image";
import Link from "next/link";
import { Show } from "@/components/ui/Show";
import type { RailCandidate } from "@/lib/mock-home-ballot";
import {
  ageFrom,
  type TicketPerson,
  type TicketProfile as Profile,
} from "@/lib/presidential-profiles-2027";
import { DocsPanel } from "./DocsPanel";

/**
 * The `/elections/<year>/<party>` ticket page — Figma `1:987` (APC) and
 * `1:1209` (NDC). One template: the two frames are the same layout with
 * different content, party colour and photographs.
 *
 * Figma's export is absolutely positioned inside a 1920x4844 frame. Nothing is
 * pasted from it — the values below (fills, sizes, leading, tracking) come from
 * `get_design_context`, re-expressed as flow layout so the page also works at
 * 402px, which the frames do not cover.
 *
 * Colours go through the theme tokens wherever the design's dark value has a
 * light counterpart, because every route here ships light and dark and the
 * frames are dark-only. The dark hexes are pinned alongside so the dark render
 * still matches Figma exactly: `#e5e2e1` text, `#bbcbbc` secondary, `#6d736f`
 * muted, `#3c4a3f` hairline, `#060a08` card, `#00d492`/`#43ee94` accent.
 *
 * Sections 4-8 render only with a `profile`. 16 of the 18 acronyms in
 * `PRESIDENTIAL_2027` have none yet, and those pages stop after the ticket pair
 * rather than showing empty shells.
 */
export function TicketProfile({
  ticket,
  profile,
  year,
}: {
  readonly ticket: RailCandidate;
  readonly profile: Profile | null;
  readonly year: number;
}) {
  const accent = "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="overflow-x-clip pb-24">
      {/* 1 — Crest band (Figma 1:1096). A rule either side of the party
          medallion, each ending in a dot. The logo is the one already committed
          for the homepage rail, not a fresh export. */}
      <section className="mx-auto flex w-full max-w-7xl items-center gap-4 px-6 pt-28 lg:px-8">
        <Rule align="right" />
        <span className="grid size-[92px] shrink-0 place-items-center rounded-full border border-border bg-card p-4 dark:border-[#3c4a3f] dark:bg-[#0f1311] lg:size-[129px]">
          <Image
            src={ticket.party.logoUrl ?? ""}
            alt={`${ticket.party.name ?? ticket.party.acronym} logo`}
            width={103}
            height={103}
            className="size-full rounded-full object-contain"
            priority
          />
        </span>
        <Rule align="left" />
      </section>

      {/* 2 — Eyebrow (Figma 1:1205) */}
      <p className="mt-8 text-center font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-muted-foreground">
        {year} elections
        <span className="px-2" aria-hidden>
          ·
        </span>
        Presidential
      </p>

      {/* 3 — The ticket pair (Figma 1:1077-1:1093) */}
      <section className="mx-auto mt-10 w-full max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:items-start sm:gap-[29px]">
          <Half
            person={profile?.candidate}
            fallbackName={ticket.candidate.name}
            fallbackRole="President"
            fallbackPhoto={ticket.candidate.imageUrl}
            accent={accent}
          />
          <Show when={Boolean(ticket.mate ?? profile?.mate)}>
            <Half
              person={profile?.mate}
              fallbackName={ticket.mate?.name ?? ""}
              fallbackRole="Running mate"
              fallbackPhoto={ticket.mate?.imageUrl}
              accent={accent}
            />
          </Show>
        </div>
      </section>

      {/* 4 — Vision (Figma 1:1095, 1:1094) */}
      <Show when={Boolean(profile)}>
        <section className="mx-auto mt-16 w-full max-w-[760px] px-6 text-center lg:px-8">
          <p className="font-heading text-xl font-semibold leading-relaxed text-foreground lg:text-[30px] lg:leading-[42px]">
            {profile?.visionLine}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground lg:text-base">
            {profile?.fineprint}
          </p>
        </section>

        {/* 5 — Quote band (Figma 1:988, 1:989, 1:1139). Full-bleed: it breaks
            the max-w-7xl container by design. `w-screen` + a half-viewport pull
            rather than negative margins, so it stays centred whatever the
            scrollbar does. */}
        <section
          className="relative left-1/2 mt-20 w-screen -translate-x-1/2 overflow-hidden"
          style={{ backgroundColor: profile?.quoteBg }}
        >
          {/* Two real columns rather than Figma's absolute placement. At 1920 the
              886px photo and the 945px quote barely clear each other; at 1280
              they collide, so the split is proportional (46/54) instead. */}
          <div className="flex min-h-[280px] flex-col lg:min-h-[417px] lg:flex-row lg:items-stretch">
            <div className="relative h-[220px] w-full shrink-0 lg:h-auto lg:w-[46%]">
              <Image
                src={profile?.quotePhoto ?? ""}
                alt=""
                fill
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-cover object-top"
              />
            </div>
            {/* Instrument Sans Bold, not serif — the frames set the quote in the
                body face at 78.787px/85.255px, tracking -1.1923px. That is sized
                for a 1920 frame, so it steps down on narrower viewports. */}
            <p className="flex flex-1 items-center justify-center px-6 py-10 text-center text-[30px] font-bold leading-[1.1] tracking-[-0.5px] text-white sm:text-[40px] lg:px-10 lg:text-[46px] xl:text-[58px] 2xl:text-[78.787px] 2xl:leading-[85.255px] 2xl:tracking-[-1.1923px]">
              {profile?.quote}
            </p>
          </div>
        </section>

        {/* 6 — "Who is X?" (Figma 1:1144) */}
        <section className="mx-auto mt-20 w-full max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-14">
            <Image
              src={profile?.bioPhoto ?? ""}
              alt={`${profile?.short} portrait`}
              width={463}
              height={353}
              sizes="(min-width: 1024px) 463px, 100vw"
              className="h-auto w-full max-w-[463px] rounded-[12px] object-cover"
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-[32px] italic leading-tight text-foreground lg:text-[48px]">
                Who is <span className={accent}>{profile?.short}?</span>
              </h2>
              {/* DM Sans Light 18/29, justified — Figma 1:1146. */}
              <p className="mt-6 max-w-[620px] font-heading text-base font-light leading-[29px] text-foreground lg:text-[18px]">
                {profile?.bio}
              </p>
            </div>
          </div>
        </section>

        {/* 7 — Documents (Figma 1:1108) */}
        <section className="mx-auto mt-20 w-full max-w-7xl px-6 lg:px-8">
          <DocsPanel docs={profile?.docs ?? []} />
        </section>

        {/* 8 — Career + Education (Figma 1:1148) */}
        <section className="mx-auto mt-16 w-full max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:justify-center">
            <RecordCard title="Political Career" className="lg:w-[439px]">
              <div className="mt-6 flex flex-col gap-[25px]">
                {(profile?.career ?? []).map((row, i) => (
                  <div
                    key={`${row.span}-${row.office}`}
                    className={
                      i === 0
                        ? "border-l-[2px] border-emerald-500/30 py-2 pl-[18px] dark:border-[#43ee94]/30"
                        : "border-l-[2px] border-border py-2 pl-[18px] opacity-70 dark:border-[#3c4a3f]"
                    }
                  >
                    <p className="font-bold uppercase tracking-[1.25px] text-emerald-600 dark:text-[#43ee94] text-[11.4px] leading-[15px]">
                      {row.span}
                    </p>
                    <p className="mt-1 font-semibold text-foreground text-[18px] leading-[30px] lg:text-[20px]">
                      {row.office}
                    </p>
                    <Show when={Boolean(row.chamber)}>
                      <p className="font-semibold text-muted-foreground text-[14.5px] leading-[17.5px] dark:text-[#bbcbbc]">
                        {row.chamber}
                      </p>
                    </Show>
                  </div>
                ))}
              </div>
            </RecordCard>

            <RecordCard title="Education" className="lg:w-[381px]">
              <div className="mt-6 flex flex-col gap-4">
                {(profile?.education ?? []).map((row) => (
                  <div key={`${row.award}-${row.school}`}>
                    <p className="text-foreground text-[18px] leading-[30px] lg:text-[19.9px]">
                      {row.award}
                    </p>
                    <p className="text-muted-foreground text-[14px] leading-[18px] dark:text-[#bbcbbc]">
                      {row.school}
                    </p>
                  </div>
                ))}
              </div>
            </RecordCard>
          </div>
        </section>
      </Show>

      {/* Partial coverage: no profile authored for this party yet. Say so
          plainly and send them back up a level, rather than a blank page. */}
      <Show when={!profile}>
        <section className="mx-auto mt-16 w-full max-w-[640px] px-6 text-center lg:px-8">
          <p className="text-base leading-relaxed text-muted-foreground">
            We haven&apos;t published a full profile for this ticket yet — just the
            names, the party and the poster so far.
          </p>
          <Link
            href={`/elections/${year}`}
            className="mt-6 inline-block font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            See the {year} cycle
          </Link>
        </section>
      </Show>
    </div>
  );
}

/** Hairline terminating in a dot, pointing at the medallion. Figma 1:1097/1:1105. */
function Rule({ align }: { readonly align: "left" | "right" }) {
  return (
    <span className="flex min-w-0 flex-1 items-center" aria-hidden>
      <Show when={align === "left"}>
        <span className="size-[10px] shrink-0 rounded-full bg-border dark:bg-[#3c4a3f]" />
      </Show>
      <span className="h-px min-w-0 flex-1 bg-border dark:bg-[#3c4a3f]" />
      <Show when={align === "right"}>
        <span className="size-[10px] shrink-0 rounded-full bg-border dark:bg-[#3c4a3f]" />
      </Show>
    </span>
  );
}

/**
 * One half of the ticket: the green portrait card, then the serif name with the
 * surname in the party accent, the role, and the age.
 *
 * Falls back to the rail poster's cut-out when no profile portrait exists. Those
 * cut-outs carry a baked-in halftone and are cropped for a 404x695 poster, so
 * they read poorly here — which is why the two authored parties get their own
 * exports, and why this is a fallback rather than the default.
 */
function Half({
  person,
  fallbackName,
  fallbackRole,
  fallbackPhoto,
  accent,
}: {
  readonly person?: TicketPerson;
  readonly fallbackName: string;
  readonly fallbackRole: string;
  readonly fallbackPhoto?: string | null;
  readonly accent: string;
}) {
  const photo = person?.photo ?? fallbackPhoto;
  // Split on the last space so "Peter Gregory Obi" accents only "Obi".
  const cut = fallbackName.lastIndexOf(" ");
  const given = person?.given ?? (cut > 0 ? fallbackName.slice(0, cut) : "");
  const surname = person?.surname ?? (cut > 0 ? fallbackName.slice(cut + 1) : fallbackName);

  return (
    <div className="w-full max-w-[377px] text-center">
      {/* Figma 1:1077 — a flat #01bc7d card, the same on both frames. The party
          colour lives on the medallion above, not here. The portrait is a
          full-figure cut-out standing on the card, so it is contained and
          bottom-aligned rather than cover-cropped. */}
      <div className="relative aspect-[377/473] w-full overflow-hidden rounded-[12.8px] bg-[#01bc7d]">
        <Show when={Boolean(photo)}>
          <Image
            src={photo ?? ""}
            alt={`${given} ${surname}`.trim()}
            fill
            sizes="(min-width: 640px) 377px, 100vw"
            className="object-contain object-bottom"
            priority
          />
        </Show>
      </div>

      {/* Instrument Serif Italic 48/43.631 — surname in the accent. */}
      <p className="mt-5 font-serif text-[32px] italic leading-[1.05] text-foreground lg:text-[48px] lg:leading-[43.631px]">
        <Show when={Boolean(given)}>
          <span>{given}</span>
          <br />
        </Show>
        <span className={accent}>{surname}</span>
      </p>

      <p className="mt-4 text-[14px] text-muted-foreground">
        {person ? (
          <>
            <span>{person.role[0]} </span>
            <span className={accent}>{person.role[1]}</span>
          </>
        ) : (
          fallbackRole
        )}
      </p>

      <Show when={Boolean(person)}>
        <p className="mt-2 text-[20px] italic leading-[28.294px] tracking-[-0.1768px] text-foreground lg:text-[24px]">
          {person ? ageFrom(person.dob) : 0} years
        </p>
      </Show>
    </div>
  );
}

/** Bordered record card — Figma 1:1175 / 1:1150. */
function RecordCard({
  title,
  className,
  children,
}: {
  readonly title: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[12.5px] border border-border bg-card p-6 dark:border-[#3c4a3f] dark:bg-[#060a08] lg:p-[34px] ${className ?? ""}`}
    >
      <h3 className="font-serif text-[24px] italic leading-[43px] text-foreground lg:text-[28.4px]">
        {title}
      </h3>
      {children}
    </div>
  );
}
