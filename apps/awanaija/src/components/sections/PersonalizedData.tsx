import { getFaacPeriods, getLgaDetails, getLgas, getStateDetails, getStates, getWardDetails, getWards } from "@/lib/api";
import { PersonalizedDataClient } from "./PersonalizedDataClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "http://localhost:3000/api";

// Cache the initial server-render snapshot for the page's revalidate window so we
// don't re-run the API waterfall on every request. Cast keeps Next's `next` field
// available on RequestInit. The client component refetches live (no init = uncached).
const SSR_REVALIDATE = 300;
const ssrInit: RequestInit = { next: { revalidate: SSR_REVALIDATE } } as RequestInit;

async function getStats() {
  const res = await fetch(`${API_BASE}/geo/stats`, ssrInit);
  if (!res.ok) return { states: 36, lgas: 774, wards: 8809, faacYears: "2019-24" };
  return res.json();
}

export async function PersonalizedData() {
  // De-waterfalled: faac periods, stats, and the states list are independent, so
  // fetch them together instead of awaiting states as a separate serial stage.
  const [faacPeriods, stats, states] = await Promise.all<
    [
      Promise<{ years: number[]; monthsByYear: Record<number, number[]> }>,
      Promise<any>,
      Promise<any[]>,
    ]
  >([
    getFaacPeriods(ssrInit).catch(() => ({ years: [], monthsByYear: {} })),
    getStats().catch(() => ({ states: 36, lgas: 774, wards: 8809, faacYears: "2019-24" })),
    getStates(ssrInit).catch(() => []),
  ]);

  let initialYear = null;
  let initialMonth = null;

  if (faacPeriods.years && faacPeriods.years.length > 0) {
    initialYear = faacPeriods.years[0];
    if (faacPeriods.monthsByYear[initialYear] && faacPeriods.monthsByYear[initialYear].length > 0) {
      const monthsForYear = faacPeriods.monthsByYear[initialYear];
      initialMonth = monthsForYear[monthsForYear.length - 1];
    }
  }

  const defaultState = states.find((s: any) => s.name.includes("Lagos")) || states[0] || { code: "LA", name: "Lagos State" };

  const lgas = await getLgas(defaultState.code, ssrInit).catch(() => []);
  const defaultLga = lgas.find((l: any) => l.name.includes("Ikeja")) || lgas[0] || { code: "IKE", name: "Ikeja" };

  const wards = await getWards(defaultLga.code, ssrInit).catch(() => []);
  const defaultWard = wards.find((w: any) => w.name.includes("Alausa")) || wards[0] || { code: "ALA", name: "Alausa" };

  const stateSlug = defaultState.name.toLowerCase().replace(/ /g, '-');
  const lgaSlug = defaultLga.name.toLowerCase().replace(/ /g, '-');
  const wardSlug = defaultWard.name.split('/')[0].trim().toLowerCase().replace(/ /g, '-');

  const yStr = initialYear?.toString();
  const mStr = initialMonth?.toString();

  const [stateDetails, lgaDetails, wardDetails] = await Promise.all([
    getStateDetails(stateSlug, yStr, mStr, ssrInit).catch(() => null),
    getLgaDetails(stateSlug, lgaSlug, yStr, mStr, ssrInit).catch(() => null),
    getWardDetails(stateSlug, lgaSlug, wardSlug, ssrInit).catch(() => null)
  ]);

  const initialSelection = {
    stateCode: defaultState.code,
    stateName: defaultState.name,
    lgaCode: defaultLga.code,
    lgaName: defaultLga.name,
    wardCode: defaultWard.code,
    wardName: defaultWard.name
  };

  return (
    <PersonalizedDataClient
      initialFaacPeriods={faacPeriods}
      initialStatesList={states}
      initialLgasList={lgas}
      initialWardsList={wards}
      initialStateDetails={stateDetails}
      initialLgaDetails={lgaDetails}
      initialWardDetails={wardDetails}
      initialSelection={initialSelection}
      initialYear={initialYear}
      initialMonth={initialMonth}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 py-6 gap-y-6">
        <div className="flex flex-col justify-between items-center text-center md:items-start md:text-left md:border-r border-border/50 px-4 md:px-6 md:first:pl-0">
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">States covered</span>
          <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.states}</span>
        </div>
        <div className="flex flex-col justify-between items-center text-center md:items-start md:text-left md:border-r border-border/50 px-4 md:px-6">
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">LGA Covered</span>
          <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.lgas}</span>
        </div>
        <div className="flex flex-col justify-between items-center text-center md:items-start md:text-left md:border-r border-border/50 px-4 md:px-6">
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Budgets/FAAC years covered</span>
          <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.faacYears}</span>
        </div>
        <div className="flex flex-col justify-between items-center text-center md:items-start md:text-left px-4 md:px-6">
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Wards Covered</span>
          <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.wards.toLocaleString()}</span>
        </div>
      </div>
    </PersonalizedDataClient>
  );
}
