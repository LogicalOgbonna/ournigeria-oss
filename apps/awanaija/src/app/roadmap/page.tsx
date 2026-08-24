import Link from "next/link";
import { PageLayout } from "@/components/layout/PageLayout";
import { COVERAGE } from "@/lib/constants";

const TITLE = "Roadmap — Coming to Your Ward | OurNigeria";
const DESCRIPTION =
  "Today we can tell you who represents you. Here is everything else we are building, in the order we are building it — elections first, then the security chain, then what is actually inside your ward.";

// og:image / twitter:image come from ./opengraph-image.tsx; declaring openGraph
// here keeps the title, description and canonical URL correct for this page
// rather than inheriting the site-wide ones from the root layout.
export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/roadmap" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://ournigeria.ng/roadmap",
    siteName: "OurNigeria",
    type: "article" as const,
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: TITLE,
    description: DESCRIPTION,
  },
};

/**
 * Figures derived from the live officials table. Unlike COVERAGE (fixed by Nigeria's
 * delimitation) these DRIFT every time someone contributes a record — and this page
 * actively asks readers to contribute, so it invalidates its own numbers by working.
 *
 * Refresh by counting `imageUrl` / contact fields over GET /api/officials, then bump
 * `asOf`. The rendered copy shows that date so a stale figure reads as a dated
 * snapshot rather than a false claim.
 */
const OFFICIALS_SNAPSHOT = {
  tracked: "2,847",
  asOf: "24 August 2026",
} as const;

type Status = "now" | "next" | "later" | "ongoing";

const STATUS_COPY: Record<Status, string> = {
  now: "Building now",
  next: "Next",
  later: "Later",
  ongoing: "Ongoing",
};

// "later" and "ongoing" are the same visual state — one muted chip. Kept as separate
// Status values because they mean different things in the copy.
const MUTED_CHIP =
  "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400";
const MUTED_DOT = "bg-slate-400 dark:bg-slate-600";

const STATUS_STYLE: Record<Status, string> = {
  now: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  next: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  later: MUTED_CHIP,
  ongoing: MUTED_CHIP,
};

const STATUS_DOT: Record<Status, string> = {
  now: "bg-emerald-500",
  next: "bg-amber-500",
  later: MUTED_DOT,
  ongoing: MUTED_DOT,
};

const HERO_STATS = [
  { label: "Wards mapped", value: COVERAGE.wards },
  { label: "Local governments", value: COVERAGE.lgas },
  { label: "Officials tracked", value: OFFICIALS_SNAPSHOT.tracked },
  { label: "States", value: COVERAGE.states },
];

const TODAY_STATS = [
  {
    value: COVERAGE.seats,
    label: "Elective seats mapped",
    sub: "Governor down to councillor",
  },
  {
    value: COVERAGE.constituencies,
    label: "Constituencies",
    sub: "Federal, state and senatorial",
  },
  {
    value: "700+",
    label: "Budget documents",
    sub: "Searchable in plain language",
  },
  {
    value: "891K+",
    label: "Payment records",
    sub: "Government spending, itemised",
  },
];

const LAYERS: {
  name: string;
  meta: string;
  /** Rendered positionally: [primary, secondary]. */
  lines: [string, string];
  pending: boolean;
}[] = [
  {
    name: "State",
    meta: `${COVERAGE.states} · live today`,
    lines: [
      "Governor · senators · Commissioner of Police",
      "State budget, allocations, debt",
    ],
    pending: false,
  },
  {
    name: "Local government",
    meta: `${COVERAGE.lgas} · live today`,
    lines: [
      "Chairman · councillors · police divisions",
      "Every clinic and school, counted up",
    ],
    pending: false,
  },
  {
    name: "Ward",
    meta: `${COVERAGE.wards} · live today`,
    lines: ["Your councillor · nearest police station", "Projects promised here"],
    pending: false,
  },
  {
    name: "Community",
    meta: "new layer · being built",
    lines: [
      "Your actual town or village, by name",
      "The clinic and school serving it",
    ],
    pending: true,
  },
];

export default function RoadmapPage() {
  return (
    <PageLayout
      bare
      navLabel="Roadmap"
      className="bg-white dark:bg-[oklch(0.10_0.005_160)]"
    >
      <main>

      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden pt-32 pb-10 sm:pt-40 sm:pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/4 top-0 h-[380px] w-[380px] rounded-full bg-emerald-500/5 blur-[120px]"
        />
        <div className="relative mx-auto max-w-5xl px-6">
          <Eyebrow>What we are building next</Eyebrow>
          <h1 className="mt-6 max-w-[19ch] font-[family-name:var(--font-serif)] text-4xl leading-[1.05] text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Today we can tell you{" "}
            <em className="not-italic text-emerald-600 dark:text-emerald-400">
              who
            </em>{" "}
            represents you. Next, we tell you everything else.
          </h1>
          <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
            You already put in your state, your LGA, your ward &mdash; and we
            show you your governor, your senator, your rep, your chairman, your
            councillor. That is the floor, not the ceiling. Here is what is
            coming, in the order we are building it.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 text-center sm:flex sm:flex-wrap sm:gap-x-12 sm:gap-y-6 sm:text-left">
            {HERO_STATS.map((s) => (
              <div key={s.label}>
                <dt className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                  {s.label}
                </dt>
                <dd className="mt-1.5 font-[family-name:var(--font-serif)] text-2xl tabular-nums text-slate-900 dark:text-white">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------- 01 elections ---------------- */}
      <Section>
        <SectionHead
          step="01"
          question="“Who is on my ballot, and what have they actually done?”"
          status="now"
          statusLabel="Engine built · filling it"
        />
        <TwoCol>
          <Prose>
            <p>
              Election season is loud and almost none of it is useful. Posters,
              convoys, rented crowds. Almost nobody can tell you the name of the
              person running for their own state assembly seat, let alone what
              that person did the last time they held office.
            </p>
            <p>
              <B>Part of this already works.</B> Every party has a page &mdash;
              who leads it, where its office is, which states it governs. And
              where your state has been switched on, you can already enter your
              location and see the races on your ballot.
            </p>
            <p>
              What is missing is the candidates, and a way in. Seven people are
              on record for the 2027 presidential race, and exactly one of them
              has a photograph. For governor, in every state we checked, we have
              nobody at all yet. And there is still no page you can simply open
              and browse &mdash; the ballot appears only if your own state has
              been lit up.
            </p>
            <Callout>
              The machine is built. What it needs now is names, faces, and a
              front door.
            </Callout>
          </Prose>
          <PromiseList
            items={[
              <>
                One page listing <B>every election we are tracking</B> &mdash;
                national, governorship, assembly &mdash; open to anyone, not
                only your own state.
              </>,
              <>
                Open a year and see <B>every party and its campaign</B> side by
                side.
              </>,
              <>
                Tap a party to see <B>its full slate</B> &mdash; who it is
                fielding, in your state and everywhere else.
              </>,
              <>
                Open a candidate and see their <B>record attached</B> &mdash;
                offices held, party history, and what the budget and corruption
                data already says about them.
              </>,
              <>
                Compare <B>two candidates in the same race</B>, plainly, without
                the noise.
              </>,
            ]}
          />
        </TwoCol>
      </Section>

      {/* ---------------- 02 police ---------------- */}
      <Section>
        <SectionHead
          step="02"
          question="“Who is supposed to protect me, and how do I reach them?”"
          status="next"
        />
        <TwoCol>
          <Prose>
            <p>
              When something happens, the questions are immediate and practical.
              Where is the nearest station? Who is the DPO here? If the division
              is the problem, who is above them? Most Nigerians cannot answer any
              of these for their own area, and the information is not written
              down anywhere a normal person can find it.
            </p>
            <p>
              So we are building the security chain the same way we built the
              political one &mdash; from the top of your state all the way down
              to the division that actually covers your street.
            </p>
            <Callout>
              Not a list of names. A chain you can walk up when the person below
              will not help you.
            </Callout>
          </Prose>
          <PromiseList
            items={[
              <>
                <B>Your state:</B> the Commissioner of Police, the state Police
                Public Relations Officer, the Area Commanders &mdash; names,
                offices, and how to reach them.
              </>,
              <>
                <B>Your LGA:</B> the divisions covering it and the Divisional
                Police Officer heading each one.
              </>,
              <>
                <B>Your ward:</B> the actual stations near you, where they are,
                and their working numbers.
              </>,
              <>
                Ranked from <B>most senior down to nearest to you</B>, so you
                know exactly who to escalate to.
              </>,
              <>
                The same chain on every state, LGA and ward page you already use.
              </>,
            ]}
          />
        </TwoCol>
      </Section>

      {/* ---------------- 03 ward interior ---------------- */}
      <Section>
        <SectionHead
          step="03"
          question="“What is actually in my ward?”"
          status="later"
          statusLabel="After that"
        />
        <TwoCol>
          <Prose>
            <p>
              Right now a ward is a name and a councillor. But nobody lives in a
              ward &mdash; people live in a{" "}
              <em className="not-italic text-emerald-600 dark:text-emerald-400">
                community
              </em>
              . And the things that decide whether a community is liveable are
              the clinic, the school, and whether either of them is real.
            </p>
            <p>
              We are going one layer below the ward, then filling that layer with
              the public facilities that are supposed to be serving it. Public
              only. If your family pays for a private hospital or a private
              school, that is a market. What we are auditing is what the state
              promised you for free.
            </p>
            <Callout>
              A ward with three schools on paper and one standing building is a
              story. You cannot tell it until both numbers exist.
            </Callout>
          </Prose>

          <figure className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-800/40">
            <ul className="flex flex-col gap-2.5">
              {LAYERS.map((l) => (
                <li
                  key={l.name}
                  className={[
                    "rounded-lg border p-3.5",
                    l.pending
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-slate-200 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/40",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className={[
                        "font-[family-name:var(--font-serif)] text-lg",
                        l.pending
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-slate-900 dark:text-white",
                      ].join(" ")}
                    >
                      {l.name}
                    </span>
                    <span
                      className={[
                        "font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.1em]",
                        l.pending
                          ? "text-amber-700/80 dark:text-amber-400/80"
                          : "text-slate-500 dark:text-slate-500",
                      ].join(" ")}
                    >
                      {l.meta}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {l.lines[0]}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-500">
                    {l.lines[1]}
                  </p>
                </li>
              ))}
            </ul>
            <figcaption className="mt-4 border-t border-slate-200 pt-3 font-[family-name:var(--font-mono)] text-[11px] leading-relaxed text-slate-500 dark:border-slate-700/60 dark:text-slate-500">
              <span className="text-slate-700 dark:text-slate-300">
                Three layers are live.
              </span>{" "}
              The fourth &mdash; community &mdash; is the one being added, and it
              is the layer everything else in this section hangs off.
            </figcaption>
          </figure>
        </TwoCol>

        <TwoCol className="mt-9">
          <PromiseList
            items={[
              <>
                Find your <B>community by name</B>, not just your ward code.
              </>,
              <>
                Every <B>public hospital, health centre and clinic</B> serving it
                &mdash; and the total for your whole LGA.
              </>,
              <>
                Every <B>public school</B> &mdash; primary, secondary, and the
                universities in your state.
              </>,
              <>
                Compare your LGA to the one next door. Same population, half the
                clinics? Now you can prove it.
              </>,
            ]}
          />
          <HelpCard title="This one needs you">
            <p>
              There is no government file listing every community in Nigeria.
              There are 8,807 wards, and the people who know what is inside them
              are the people who live there.
            </p>
            <p>
              When this opens, you will be able to add your own community, your
              own clinic, your own school &mdash; the same way people already add
              missing photos and phone numbers for their representatives today.
            </p>
          </HelpCard>
        </TwoCol>
      </Section>

      {/* ---------------- 04 bills ---------------- */}
      <Section>
        <SectionHead
          step="04"
          question="“What law is about to change my life?”"
          status="later"
        />
        <TwoCol>
          <Prose>
            <p>
              Bills that reshape whole industries pass with almost nobody outside
              Abuja knowing they existed. The hearings are public &mdash; the
              National Assembly streams them live &mdash; but a six-hour stream
              nobody watches is not the same thing as transparency.
            </p>
            <p>
              We are going to read those hearings so you do not have to, and then
              tell the people a bill actually affects that it is coming.
            </p>
            <Callout>
              A bill about mining should reach the LGAs with mines in them before
              it passes, not after.
            </Callout>
          </Prose>
          <PromiseList
            items={[
              <>
                Bills tracked <B>as they move</B> &mdash; what it does, in plain
                language, not legalese.
              </>,
              <>
                <B>Who proposed it and who is backing it</B> &mdash; attached to
                the same profiles you already browse.
              </>,
              <>
                Hearings streamed on the National Assembly channels,{" "}
                <B>transcribed and summarised</B>.
              </>,
              <>
                If a bill hits your LGA, <B>it shows up on your LGA page</B>.
              </>,
              <>
                <B>Follow a bill</B> and we tell you every time it moves, until
                it passes or dies.
              </>,
            ]}
          />
        </TwoCol>
      </Section>

      {/* ---------------- 05 ministries + money ---------------- */}
      <Section>
        <SectionHead
          step="05"
          question="“Who runs power, roads and schools — and where did the money go?”"
          status="ongoing"
        />
        <TwoCol>
          <Prose>
            <p>
              This is the part we started with, and the part we never stop
              working on. We already hold hundreds of budget documents and
              hundreds of thousands of government payment records, and you can
              already ask questions about them in plain English or Pidgin.
            </p>
            <p>
              What is missing is the human layer on top &mdash; the ministries
              that spend it, the people who run them, and the road from the
              federal purse all the way down to your local government.
            </p>
          </Prose>
          <PromiseList
            items={[
              <>
                Every <B>ministry that matters</B> to daily life &mdash; power,
                works, education, health, agriculture &mdash; what it is
                responsible for and who heads it.
              </>,
              <>
                <B>How to reach each one</B>, and what it currently claims to be
                working on.
              </>,
              <>
                The money followed <B>federal &rarr; state &rarr; local
                government</B>, at every step.
              </>,
              <>
                What your LGA <B>received</B> versus what got <B>built</B>.
              </>,
            ]}
          />
        </TwoCol>
      </Section>

      {/* ---------------- today ---------------- */}
      <section className="border-t border-slate-200 py-10 dark:border-slate-800 sm:py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Eyebrow>Already working</Eyebrow>
          <h2 className="mt-4 max-w-[24ch] font-[family-name:var(--font-serif)] text-3xl leading-tight text-slate-900 dark:text-white sm:text-4xl">
            None of this starts from zero.
          </h2>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
            The map underneath is already built and already public. Everything
            above is a new layer on ground that exists.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-slate-700/60 dark:bg-slate-700/60 lg:grid-cols-4">
            {TODAY_STATS.map((s) => (
              <div
                key={s.label}
                className="bg-white p-5 dark:bg-slate-800/40"
              >
                <dd className="font-[family-name:var(--font-serif)] text-3xl leading-none tabular-nums text-emerald-600 dark:text-emerald-400">
                  {s.value}
                </dd>
                <dt className="mt-3 min-h-[2.4em] font-[family-name:var(--font-mono)] text-[10px] uppercase leading-[1.2] tracking-[0.1em] text-slate-600 dark:text-slate-400 sm:min-h-0">
                  {s.label}
                </dt>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  {s.sub}
                </p>
              </div>
            ))}
          </dl>

          {/* honest part — left rail so body text fills the card */}
          <div className="mt-7 grid gap-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-7 sm:p-8 lg:grid-cols-[minmax(190px,240px)_1fr] lg:gap-10">
            <div>
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900 dark:text-white">
                The honest part
              </h3>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.13em] text-slate-500 dark:text-slate-500">
                Figures as of {OFFICIALS_SNAPSHOT.asOf}
              </p>
              <p className="mt-2.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.13em] text-emerald-700 dark:text-emerald-400">
                Where you come in
              </p>
            </div>
            <div className="flex flex-col gap-4 text-slate-700 dark:text-slate-300">
              <p className="max-w-[68ch] leading-relaxed">
                Of the {OFFICIALS_SNAPSHOT.tracked} officials we track, fewer than one in seven has a
                photograph &mdash; and the profiles behind those names are barely
                filled in.{" "}
                <B>Two in every three are a name and nothing else.</B> Almost
                nine in ten have no email, no phone number and no office address,
                so even when you find the right person there is no way to reach
                them. Exactly one official in the entire database has a complete
                profile.
              </p>
              <p className="max-w-[68ch] leading-relaxed">
                We cannot fix that from a laptop in one city. There are 774 local
                governments and four of us.
              </p>
              <p className="max-w-[68ch] leading-relaxed">
                So the fastest way any of this gets finished is you. Right now
                there is one thing you can help with, and it is the biggest gap
                on the list: <B>identifying the public officials in your area.</B>{" "}
                If you know your councillor&rsquo;s face, your chairman&rsquo;s
                office, a working number for your rep &mdash;{" "}
                <Link
                  href="/proposals/new"
                  className="font-medium text-emerald-700 underline decoration-emerald-500/40 underline-offset-4 transition-colors hover:decoration-emerald-500 dark:text-emerald-400"
                >
                  you can add it today
                </Link>
                , and other people vote it up or down before it goes live.
              </p>
              <p className="max-w-[68ch] leading-relaxed">
                Mapping the infrastructure &mdash; your community, your nearest
                station, the clinic and the school &mdash; opens next, and it
                works the same way. Officials first, because that is what is
                built.
              </p>
            </div>
          </div>
        </div>
      </section>

      </main>
    </PageLayout>
  );
}

/* ------------------------------------------------------------------ */
/* local presentational pieces                                         */
/* ------------------------------------------------------------------ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
      {children}
    </p>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-200 py-10 dark:border-slate-800 sm:py-16">
      <div className="mx-auto max-w-5xl px-6">{children}</div>
    </section>
  );
}

function SectionHead({
  step,
  question,
  status,
  statusLabel,
}: {
  step: string;
  question: string;
  status: Status;
  statusLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start gap-x-5 gap-y-2">
      <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] text-emerald-600 dark:text-emerald-400 sm:pt-3">
        {step}
      </span>
      <div className="min-w-0 flex-1 basis-[380px]">
        <h2 className="max-w-[20ch] font-[family-name:var(--font-serif)] text-2xl leading-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2.4rem]">
          {question}
        </h2>
        <span
          className={[
            "mt-3.5 inline-flex items-center gap-2 rounded border px-2.5 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em]",
            STATUS_STYLE[status],
          ].join(" ")}
        >
          <span
            className={["h-1.5 w-1.5 rounded-full", STATUS_DOT[status]].join(
              " "
            )}
          />
          {statusLabel ?? STATUS_COPY[status]}
        </span>
      </div>
    </div>
  );
}

function TwoCol({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid items-start gap-8 lg:grid-cols-2 lg:gap-10 ${className}`}
    >
      {children}
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 leading-relaxed text-slate-600 dark:text-slate-400">
      {children}
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 max-w-[56ch] border-l-2 border-emerald-500 py-1.5 pl-5 font-[family-name:var(--font-serif)] text-xl italic leading-snug text-slate-700 dark:text-slate-300">
      {children}
    </p>
  );
}

function PromiseList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700/60 dark:border-slate-700/60 dark:bg-slate-800/40">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-3.5 p-4 text-[0.95rem] leading-relaxed text-slate-600 dark:text-slate-400"
        >
          <span
            aria-hidden
            className="mt-0.5 font-[family-name:var(--font-mono)] text-sm text-emerald-600 dark:text-emerald-400"
          >
            &rarr;
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HelpCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
      <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <div className="mt-3 flex flex-col gap-3 text-[0.95rem] leading-relaxed text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </div>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return (
    <strong className="font-semibold text-slate-900 dark:text-white">
      {children}
    </strong>
  );
}
