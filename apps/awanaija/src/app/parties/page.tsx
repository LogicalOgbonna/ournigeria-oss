import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import { PageLayout } from "@/components/layout/PageLayout";
import { Show } from "@/components/ui/Show";
import { PartiesDirectory } from "./PartiesDirectory";
import { getPartyDirectory, type PartyListItem } from "@/lib/api";



export const metadata: Metadata = {
  title: "Political Parties | OurNigeria",
  description:
    "Browse Nigeria's political parties — who holds power, by party. Governors, senators, representatives and state chapters across all 36 states and the FCT.",
  alternates: { canonical: `${SITE_URL}/parties` },
};

async function getParties(): Promise<PartyListItem[]> {
  try {
    return await getPartyDirectory({ next: { revalidate: 120 } });
  } catch {
    return [];
  }
}

export default async function PartiesPage() {
  const parties = await getParties();

  return (
    <PageLayout
      className="bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]"
      mainClassName="mx-auto w-full max-w-6xl px-4 pb-16 pt-28"
    >
      <header className="mb-6">
          <h1 className="font-serif text-[34px] leading-tight text-slate-900 dark:text-white">
            Political Parties
          </h1>
          <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
            Who holds power, by party. Seats are counted from currently active offices across
            Nigeria — governors, senators, representatives, state assemblies and local government.
          </p>
        </header>

        <Show when={parties.length === 0}>
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400 dark:border-slate-700">
            Party data is loading. Check back shortly.
          </div>
        </Show>
        <Show when={parties.length !== 0}>
          <PartiesDirectory parties={parties} />
        </Show>
    </PageLayout>
  );
}
