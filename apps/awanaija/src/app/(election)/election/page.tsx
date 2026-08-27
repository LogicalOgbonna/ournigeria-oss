import type { Metadata } from "next";
import { PageLayout } from "@/components/layout/PageLayout";
import { FALLBACK_PRESIDENTIAL_YEAR } from "@/lib/election-gate";
import { ComingSoon } from "../_component/ComingSoon";
import { daysToGoFor, getCoverage } from "../_lib";

// Hourly, so the day counter stays honest without re-rendering per request.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "2027 Elections — Coming Soon | OurNigeria",
  description:
    "Your whole 2027 ballot — president down to ward councillor, for wherever you live. We're building it seat by seat from primary results and public records.",
  alternates: { canonical: "/election" },
};

export default async function ElectionIndex() {
  const coverage = await getCoverage(revalidate);
  const daysToGo = daysToGoFor(FALLBACK_PRESIDENTIAL_YEAR);

  return (
    <PageLayout navLabel="Election">
      <ComingSoon
        eyebrow={`${FALLBACK_PRESIDENTIAL_YEAR} general election${daysToGo === null ? "" : ` · ${daysToGo} days to go`}`}
        lede="Your whole ballot — president down to ward councillor, for wherever you live. We dey build am seat by seat."
        status={["1 of 7 seats filled", "presidential race confirmed", coverage]}
      />
    </PageLayout>
  );
}
