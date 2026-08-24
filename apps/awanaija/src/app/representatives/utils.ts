import { getOfficialsByLocation, type ChainEntry } from "@/lib/api";

export type { ChainEntry };

export type InitialLocation = {
  stateCode: string;
  stateName: string;
  lgaCode?: string;
  lgaName?: string;
  wardCode?: string;
  wardName?: string;
};

export type StateDetails = {
  name?: string;
  economy?: { population?: string; domesticDebt?: string; externalDebt?: string; gdp?: string };
  stats?: { budget?: string; faac?: string; igr?: string; igrFiscalYear?: number; igrPeriod?: string };
};

export type LgaDetails = {
  name?: string;
  stats?: { population?: string; faac?: string; igr?: string };
};

export async function loadRepresentativesData(sp: {
  state?: string;
  stateName?: string;
  lga?: string;
  lgaName?: string;
  ward?: string;
  wardName?: string;
}): Promise<{
  initialChain: ChainEntry[];
  initialLocation: InitialLocation | null;
  stateDetails: StateDetails | null;
  lgaDetails: LgaDetails | null;
}> {
  const { state, stateName, lga, lgaName, ward, wardName } = sp;

  let initialChain: ChainEntry[] = [];
  let initialLocation: InitialLocation | null = null;
  let stateDetails: StateDetails | null = null;
  let lgaDetails: LgaDetails | null = null;

  if (state && ward) {
    initialLocation = {
      stateCode: state,
      stateName: stateName || "",
      lgaCode: lga,
      lgaName: lgaName,
      wardCode: ward,
      wardName: wardName,
    };

    try {
      const result = await getOfficialsByLocation({
        state,
        lga,
        ward,
      });
      initialChain = result.chain;
    } catch (err) {
      console.error("Failed to load representatives:", err);
    }

    try {
      if (stateName) {
        const stateSlug = stateName.toLowerCase().replace(/\s+/g, '-');
        const stateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://ournigeria.ng"}/api/geo/states/${stateSlug}`);
        if (stateRes.ok) {
          stateDetails = await stateRes.json();
        }
      }
    } catch (err) {
      console.error("Failed to load state details:", err);
    }

    try {
      if (stateName && lgaName) {
        const stateSlug = stateName.toLowerCase().replace(/\s+/g, '-');
        const lgaSlug = lgaName.toLowerCase().replace(/\s+/g, '-');
        const lgaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://ournigeria.ng"}/api/geo/states/${stateSlug}/lgas/${lgaSlug}`);
        if (lgaRes.ok) {
          lgaDetails = await lgaRes.json();
        }
      }
    } catch (err) {
      console.error("Failed to load LGA details:", err);
    }
  }

  return { initialChain, initialLocation, stateDetails, lgaDetails };
}
