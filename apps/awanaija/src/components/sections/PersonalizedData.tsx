import { PersonalizedDataClient, transformProfileData } from "./PersonalizedDataClient";
import { getStates, getLgas, getWards, getStateDetails, getLgaDetails, getWardDetails, getFaacPeriods } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "http://localhost:3000/api";

async function getStats() {
  const res = await fetch(`${API_BASE}/geo/stats`, { cache: 'no-store' });
  if (!res.ok) return { states: 36, lgas: 774, wards: 8809, faacYears: "2019-24" };
  return res.json();
}

export async function PersonalizedData() {
  const [faacPeriods, stats] = await Promise.all<[Promise<{years: number[], monthsByYear: Record<number, number[]>}>, Promise<any>]>([
    getFaacPeriods().catch(() => ({ years: [], monthsByYear: {} })),
    getStats().catch(() => ({ states: 36, lgas: 774, wards: 8809, faacYears: "2019-24" }))
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

  const states = await getStates().catch(() => []);
  const defaultState = states.find((s: any) => s.name.includes("Lagos")) || states[0] || { code: "LA", name: "Lagos State" };

  const lgas = await getLgas(defaultState.code).catch(() => []);
  const defaultLga = lgas.find((l: any) => l.name.includes("Ikeja")) || lgas[0] || { code: "IKE", name: "Ikeja" };

  const wards = await getWards(defaultLga.code).catch(() => []);
  const defaultWard = wards.find((w: any) => w.name.includes("Alausa")) || wards[0] || { code: "ALA", name: "Alausa" };

  const stateSlug = defaultState.name.toLowerCase().replace(/ /g, '-');
  const lgaSlug = defaultLga.name.toLowerCase().replace(/ /g, '-');
  const wardSlug = defaultWard.name.toLowerCase().replace(/ /g, '-');

  const yStr = initialYear?.toString();
  const mStr = initialMonth?.toString();

  const [stateDetails, lgaDetails, wardDetails] = await Promise.all([
    getStateDetails(stateSlug, yStr, mStr).catch(() => null),
    getLgaDetails(stateSlug, lgaSlug, yStr, mStr).catch(() => null),
    getWardDetails(stateSlug, lgaSlug, wardSlug).catch(() => null)
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
        <div className="flex flex-col justify-between md:border-r border-border/50 px-4 md:px-6 first:pl-0">
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">States covered</span>
          <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.states}</span>
        </div>
        <div className="flex flex-col justify-between md:border-r border-border/50 px-4 md:px-6">
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">LGA Covered</span>
          <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.lgas}</span>
        </div>
        <div className="flex flex-col justify-between md:border-r border-border/50 px-4 md:px-6">
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Budgets/FAAC years covered</span>
          <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.faacYears}</span>
        </div>
        <div className="flex flex-col justify-between px-4 md:px-6">
          <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Wards Covered</span>
          <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.wards.toLocaleString()}</span>
        </div>
      </div>
    </PersonalizedDataClient>
  );
}
