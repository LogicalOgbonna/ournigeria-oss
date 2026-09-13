import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageLayout } from "@/components/layout/PageLayout";
import { HeroBackdrop } from "@/app/_component/HeroBackdrop";
import { ELECTION_CYCLES } from "../_lib";
import { InecStructure } from "./_component/InecStructure";

// Editorial content, no per-request data. Hourly keeps it in step with the rest
// of the section without re-rendering per visitor.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Who runs Nigeria’s elections? | OurNigeria",
  description:
    "INEC, from the Chairman and National Commissioners down to the Presiding Officer at your polling unit — who they are, how they are appointed, and what each level is responsible for.",
  alternates: { canonical: "/elections" },
  // No `robots` key: unlike the cycle and partial ticket pages, this one has real
  // content and should be indexed.
};

export default function ElectionsIndex() {
  return (
    <PageLayout bare navLabel="Elections">
      <main className="relative">
        <HeroBackdrop />

        <section className="mx-auto w-full max-w-7xl px-6 pt-32 lg:px-8 lg:pt-28">
          {/* Search (Figma 1:1573). Presentational for now — there is no
              candidate/party/state search endpoint behind it yet, and a box that
              silently does nothing is worse than one that says where to go. It
              links to the directories that DO exist rather than faking results.
              Swap for a real combobox when the search API lands. */}
          <div className="mx-auto flex w-full max-w-[896px] items-center gap-4 rounded-[16px] border border-border bg-card px-6 py-6 dark:border-[#3c4a3f] dark:bg-[#04130f]">
            <Search className="size-6 shrink-0 text-muted-foreground" aria-hidden />
            <p className="min-w-0 text-sm text-muted-foreground lg:text-[18px]">
              Looking for a candidate, party or state?{" "}
              <Link
                href="/officials"
                className="text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
              >
                Officials
              </Link>
              {" · "}
              <Link
                href="/parties"
                className="text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
              >
                Parties
              </Link>
              {" · "}
              <Link
                href="/states"
                className="text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
              >
                States
              </Link>
            </p>
          </div>

          {/* Cycle strip. Not in the Figma frame — added because the design gives
              the section index no route down to /elections/<year>, which would
              leave the cycle page reachable only from the homepage rail and make
              the year guard's redirect to /elections a dead end. */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-muted-foreground">
              Cycles we cover
            </span>
            {ELECTION_CYCLES.map((year) => (
              <Link
                key={year}
                href={`/elections/${year}`}
                className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-foreground transition-colors hover:border-emerald-600 hover:text-emerald-600 dark:border-[#3c4a3f] dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              >
                {year}
              </Link>
            ))}
          </div>

          <h1 className="mx-auto mt-14 max-w-[720px] text-center font-serif text-[40px] italic leading-tight text-foreground lg:text-[60px]">
            Who runs Nigeria’s{" "}
            <span className="text-emerald-600 dark:text-emerald-400">Elections?</span>
          </h1>

          <p className="mx-auto mt-8 max-w-[840px] text-center text-sm leading-relaxed text-muted-foreground lg:text-[16px] lg:leading-[27px]">
            Nigeria’s elections are managed by the{" "}
            <span className="text-foreground">
              Independent National Electoral Commission (INEC)
            </span>
            , the body responsible for organising, conducting and supervising elections
            across the country. INEC was established in 1998 as an independent electoral
            management body, replacing the National Electoral Commission of Nigeria (NECON).
            Its responsibilities include voter registration, election planning, conducting
            elections, announcing results and regulating political party activities.
          </p>
        </section>

        <section className="mx-auto mt-24 w-full max-w-7xl px-6 lg:px-8">
          <h2 className="mx-auto max-w-[600px] text-center font-serif text-[34px] italic leading-tight text-foreground lg:text-[54px]">
            From the{" "}
            <span className="text-emerald-600 dark:text-emerald-400">Chairman</span> to Your{" "}
            <span className="text-emerald-600 dark:text-emerald-400">Polling Unit</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[750px] text-center text-sm leading-relaxed text-muted-foreground lg:text-[16px]">
            Here’s a visual overview of how INEC operates, from the Chairman and National
            Commissioners at the top to the officials responsible for managing elections at
            the state, local government, ward and polling unit levels.
          </p>
        </section>

        <InecStructure />

        <div className="h-24" />
      </main>
    </PageLayout>
  );
}
