"use client";

import {
  KitContainer,
  KitDashboardMock,
  KitSectionTitle,
} from "@/components/landing-variants/LandingVariantKit";
import { Button } from "@/components/ui/button";
import type { BarDatum } from "@/components/landing-variants/LandingVariantKit";
import { getLgaDetails, getLgas, getStateDetails, getWardDetails, getWards, reverseGeocode } from "@/lib/api";
import { ArrowLeft, ArrowRight, Calendar, Check, ChevronDown, ChevronRight, Flag, Lightbulb, Loader2, MapPin, Minus, Plus, Search, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePersistedLocation, readPersistedLocation } from "@/hooks/usePersistedLocation";
import { Show } from "@/components/ui/Show";
import { FeaturedOfficialCard, type LocalOfficial } from "@/app/_component/FeaturedOfficialCard";
import { PeerOfficialsStrip } from "@/app/_component/PeerOfficialsStrip";

const DEFAULT_SECTOR_BARS: BarDatum[] = [
  { label: "Education", value: 0, color: "bg-blue-500" },
  { label: "Healthcare", value: 0, color: "bg-emerald-500" },
  { label: "Infrastructure", value: 0, color: "bg-amber-500" },
  { label: "Security", value: 0, color: "bg-rose-500" },
  { label: "Others", value: 0, color: "bg-slate-500" },
];

const FALLBACK_BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-slate-500",
] as const;

type GeoOfficial = {
  id?: string;
  slug?: string | null;
  name?: string;
  party?: string | null;
  constituency?: string | null;
  email?: string | null;
  image?: string | null;
  proposed?: boolean;
  [key: string]: unknown;
};

type GeoStats = {
  faacDate?: string | null;
  faac?: string | null;
  budget?: string | null;
  igr?: string | null;
  /** Fiscal year of the headline IGR row (decoupled from FAAC query year). */
  igrFiscalYear?: number | null;
  igrPeriod?: string | null;
  recurrentExpenditure?: string | null;
  capitalExpenditure?: string | null;
};

type StateDetails = {
  governor?: GeoOfficial | null;
  stats?: GeoStats | null;
  economy?: {
    domesticDebt?: string | null;
    externalDebt?: string | null;
  } | null;
  sectors?: Array<{ name: string; percentage: number; color: string }> | null;
};

type LgaDetails = {
  stats?: Pick<GeoStats, "faacDate" | "faac"> | null;
  senator?: GeoOfficial | null;
  houseMembers?: GeoOfficial[] | null;
  stateAssemblyMembers?: GeoOfficial[] | null;
  chairman?: GeoOfficial | null;
};

type WardDetails = {
  councilor?: GeoOfficial | null;
};

/** State/LGA/ward picker lists — `getStates` returns extra fields; only code+name are used here. */
type GeoListEntry = { code: string; name: string };

type ProfileKpi = {
  label: string;
  value: string;
  delta: string;
  debtPair?: { domestic: string; external: string };
};

type ProfileLgaKpi = {
  label: string;
  value: string;
  delta: string;
};

type ProfileOfficialRow =
  | { isMissing: true; role: string }
  | {
      isMissing?: false;
      role: string;
      id?: string;
      slug?: string | null;
      name?: string;
      party?: string | null;
      term?: string;
      contact?: string | null;
      contactType?: string;
      image?: string | null;
      proposed?: boolean;
      [key: string]: unknown;
    };

/** Role label → the `role` slug the contribution flow expects. */
const PROPOSAL_ROLE: Record<string, string> = {
  Governor: "governor",
  Senator: "senator",
  "House of Reps": "rep",
  "State House": "mha",
  "LGA Chairman": "lga_chairman",
};

type LocationSelection = {
  stateCode: string;
  stateName: string;
  lgaCode: string;
  lgaName: string;
  wardCode: string;
  wardName: string;
};

/**
 * Adapts a row of the assembled profile into the shape the official cards
 * take. Missing seats keep their link into the "help us identify them"
 * contribution flow, pre-filled with the viewer's location.
 */
function toLocalOfficial(
  row: ProfileOfficialRow | undefined,
  where: LocationSelection,
): LocalOfficial {
  if (!row) return { id: "unknown", name: "", role: "Representative", missing: true };

  if (row.isMissing) {
    const role = PROPOSAL_ROLE[row.role] ?? "councilor";
    const q = new URLSearchParams({
      role,
      stateCode: where.stateCode,
      stateName: where.stateName,
      lgaCode: where.lgaCode,
      lgaName: where.lgaName,
      wardCode: where.wardCode,
      wardName: where.wardName,
    });
    return {
      id: `missing-${row.role}`,
      name: "",
      role: row.role,
      missing: true,
      missingHref: `/proposals/new?${q.toString()}`,
    };
  }

  return {
    id: row.id ?? row.role,
    name: row.name ?? "",
    role: row.role,
    term: row.term,
    party: row.party,
    imageUrl: row.image,
    slug: row.slug,
    proposed: row.proposed,
  };
}

type ProfileLineItem = {
  title: string;
  amount: string;
  status: string;
  date: string;
};

export type ProfileViewData = {
  id: string;
  state: string;
  lga: string;
  ward: string;
  lgaKpis: ProfileLgaKpi[];
  officials: ProfileOfficialRow[];
  kpis: ProfileKpi[];
  bars: BarDatum[];
  lineItems: ProfileLineItem[];
};

type FlowStop = { label: string; sub: string; amt: string };

type NairaLocationContext = {
  name: string;
  lga: string;
  ward: string;
  derivation?: boolean;
};

function igrKpiLabel(stats: GeoStats | null | undefined): string {
  const y = stats?.igrFiscalYear;
  const p = stats?.igrPeriod;
  if (y != null && p) {
    if (p === "FY") return `IGR (FY ${y})`;
    return `IGR (${p} ${y})`;
  }
  if (y != null) return `IGR (${y})`;
  return "Internally Generated Revenue";
}

function geocodeIndicatesOutsideNigeria(res: unknown): boolean {
  return (
    typeof res === "object" &&
    res !== null &&
    "errorCode" in res &&
    (res as { errorCode?: string }).errorCode === "OUTSIDE_NIGERIA"
  );
}

function sectorsToBars(
  sectors: Array<{ name: string; percentage: number; color: string }> | null | undefined,
): BarDatum[] {
  if (!sectors?.length) {
    return DEFAULT_SECTOR_BARS;
  }
  return sectors.map((s, i) => ({
    label: s.name,
    value: s.percentage,
    color: s.color || FALLBACK_BAR_COLORS[i % FALLBACK_BAR_COLORS.length]!,
  }));
}

export function transformProfileData(
  stateCode: string, stateName: string, lgaCode: string, lgaName: string, wardCode: string, wardName: string,
  stateDetails: StateDetails | null | undefined,
  lgaDetails: LgaDetails | null | undefined,
  wardDetails: WardDetails | null | undefined,
  year?: number | null, month?: number | null
): ProfileViewData {
  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateLabel = year && month 
    ? `${monthNamesShort[month - 1]} '${year.toString().slice(-2)}` 
    : (lgaDetails?.stats?.faacDate || stateDetails?.stats?.faacDate || "YTD");

  const officials: ProfileOfficialRow[] = [];
  if (stateDetails?.governor) {
    officials.push({ ...stateDetails.governor, role: "Governor", contactType: "email", contact: stateDetails.governor.email || null });
  } else {
    officials.push({ isMissing: true, role: "Governor" });
  }
  
  if (lgaDetails?.senator) {
    const sen = lgaDetails.senator;
    officials.push({ id: sen.id, slug: sen.slug, role: `Senator (${sen.constituency || 'Unknown'})`, name: sen.name, party: sen.party || 'N/A', term: "Current", contact: sen.email || null, contactType: "email", image: sen.image, proposed: sen.proposed });
  } else {
    officials.push({ isMissing: true, role: "Senator" });
  }
  
  if (lgaDetails?.houseMembers?.[0]) {
    const rep = lgaDetails.houseMembers[0];
    officials.push({ id: rep.id, slug: rep.slug, role: `House of Reps (${rep.constituency || 'Unknown'})`, name: rep.name, party: rep.party || 'N/A', term: "Current", contact: rep.email || null, contactType: "email", image: rep.image, proposed: rep.proposed });
  } else {
    officials.push({ isMissing: true, role: "House of Reps" });
  }
  
  if (lgaDetails?.stateAssemblyMembers?.[0]) {
    const mha = lgaDetails.stateAssemblyMembers[0];
    officials.push({ id: mha.id, slug: mha.slug, role: `State House (${mha.constituency || 'Unknown'})`, name: mha.name, party: mha.party || 'N/A', term: "Current", contact: mha.email || null, contactType: "email", image: mha.image, proposed: mha.proposed });
  } else {
    officials.push({ isMissing: true, role: "State House" });
  }
  
  if (lgaDetails?.chairman) {
    officials.push({ ...lgaDetails.chairman, role: "LGA Chairman", contactType: "email", contact: lgaDetails.chairman.email || null });
  } else {
    officials.push({ isMissing: true, role: "LGA Chairman" });
  }
  
  if (wardDetails?.councilor) {
    officials.push({ ...wardDetails.councilor, role: "Ward Councillor", term: "Current", contactType: "email", contact: wardDetails.councilor.email || null });
  } else {
    officials.push({ isMissing: true, role: "Ward Councillor" });
  }

    return {
    id: stateCode + lgaCode + wardCode,
    state: stateName,
    lga: lgaName,
    ward: wardName,
    lgaKpis: [
      {
        label: `LGA FAAC (${dateLabel})`,
        value: lgaDetails?.stats?.faac || "N/A",
        delta: "Federal allocation directly to the local government.",
      },
      {
        label: "Tracked Projects",
        value: "Coming Soon",
        delta: "Public projects currently monitored in this LGA.",
      }
    ],
    officials: officials,
    kpis: [
      {
        label: "Latest Budget",
        value: stateDetails?.stats?.budget || "N/A",
        delta: "How much the state plans to spend to improve your life.",
      },
      {
        label: `FAAC (${dateLabel})`,
        value: stateDetails?.stats?.faac || "N/A",
        delta: "Your state's share of the national wealth.",
      },
      {
        label: "State Debt",
        value: stateDetails?.economy?.domesticDebt || "N/A",
        delta: "Debt the state owes.",
        debtPair: {
          domestic: stateDetails?.economy?.domesticDebt ?? "N/A",
          external: stateDetails?.economy?.externalDebt ?? "N/A",
        },
      },
      {
        label: igrKpiLabel(stateDetails?.stats),
        value: stateDetails?.stats?.igr || "N/A",
        delta: "How much the state is making from your taxes and levies.",
      },
      {
        label: "Recurrent Expenditure",
        value: stateDetails?.stats?.recurrentExpenditure ?? "N/A",
        delta: "What the state pays just to keep the lights on and pay salaries.",
      },
      {
        label: "Capital Expenditure",
        value: stateDetails?.stats?.capitalExpenditure ?? "N/A",
        delta: "What the state invests in roads, hospitals, and schools.",
      },
    ],
    bars: sectorsToBars(stateDetails?.sectors),
    lineItems: [
      {
        title: "Construction of Primary Health Center",
        amount: "₦45,000,000",
        status: "In Progress",
        date: "2024 Budget",
      },
      {
        title: "Rehabilitation of Access Road",
        amount: "₦120,500,000",
        status: "Awarded",
        date: "2024 Budget",
      },
      {
        title: "Provision of Solar Street Lights",
        amount: "₦15,200,000",
        status: "Completed",
        date: "2023 Budget",
      },
    ],
  };
}

interface PersonalizedDataClientProps {
  initialFaacPeriods: { years: number[], monthsByYear: Record<number, number[]> };
  initialStatesList: GeoListEntry[];
  initialLgasList: GeoListEntry[];
  initialWardsList: GeoListEntry[];
  initialStateDetails: StateDetails | null;
  initialLgaDetails: LgaDetails | null;
  initialWardDetails: WardDetails | null;
  initialSelection: {
    stateCode: string;
    stateName: string;
    lgaCode: string;
    lgaName: string;
    wardCode: string;
    wardName: string;
  };
  initialYear: number | null;
  initialMonth: number | null;
  children?: React.ReactNode;
}

export function PersonalizedDataClient({ initialFaacPeriods, initialStatesList, initialLgasList, initialWardsList, initialStateDetails, initialLgaDetails, initialWardDetails, initialSelection, initialYear, initialMonth, children }: PersonalizedDataClientProps) {
  const { setLocation: setPersistedLocation } = usePersistedLocation();
  const [locationState, setLocationState] = useState<"idle" | "loading" | "success" | "denied" | "outside_nigeria">("success");
  const [data, setData] = useState<ProfileViewData>(transformProfileData(initialSelection.stateCode, initialSelection.stateName, initialSelection.lgaCode, initialSelection.lgaName, initialSelection.wardCode, initialSelection.wardName, initialStateDetails, initialLgaDetails, initialWardDetails, initialYear, initialMonth));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Close the location/date dropdowns on scroll so they don't float over the page.
  useEffect(() => {
    if (!dropdownOpen && !dateDropdownOpen) return;
    const close = () => {
      setDropdownOpen(false);
      setDateDropdownOpen(false);
    };
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [dropdownOpen, dateDropdownOpen]);

  const [faacPeriods, setFaacPeriods] = useState<{ years: number[], monthsByYear: Record<number, number[]> }>(initialFaacPeriods);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<number | null>(initialYear);

  const [selectorStep, setSelectorStep] = useState<"state" | "lga" | "ward">("state");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingSelection, setPendingSelection] = useState({ stateCode: "", stateName: "", lgaCode: "", lgaName: "" });
  const [currentSelection, setCurrentSelection] = useState(initialSelection);

  const [statesList, setStatesList] = useState<GeoListEntry[]>(initialStatesList);
  const [lgasList, setLgasList] = useState<GeoListEntry[]>(initialLgasList);
  const [wardsList, setWardsList] = useState<GeoListEntry[]>(initialWardsList);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getListItems = () => {
    const query = searchQuery.toLowerCase();
    if (selectorStep === "state") {
      return statesList.filter(s => s.name.toLowerCase().includes(query));
    }
    if (selectorStep === "lga") {
      return lgasList.filter(l => l.name.toLowerCase().includes(query));
    }
    if (selectorStep === "ward") {
      return wardsList.filter(w => w.name.toLowerCase().includes(query));
    }
    return [];
  };

  const fetchFullProfile = async (stateCode: string, stateName: string, lgaCode: string, lgaName: string, wardCode: string, wardName: string, year?: number, month?: number) => {
    setLocationState("loading");
    try {
      const stateSlug = stateName.toLowerCase().replace(/ /g, '-');
      const lgaSlug = lgaName.toLowerCase().replace(/ /g, '-');
      const wardSlug = wardName.split('/')[0].trim().toLowerCase().replace(/ /g, '-');

      const yStr = year?.toString();
      const mStr = month?.toString();

      const [stateDetails, lgaDetails, wardDetails] = await Promise.all([
        getStateDetails(stateSlug, yStr, mStr).catch(() => null),
        getLgaDetails(stateSlug, lgaSlug, yStr, mStr).catch(() => null),
        getWardDetails(stateSlug, lgaSlug, wardSlug).catch(() => null)
      ]);

      if (!stateDetails) throw new Error("State details not found");

      setCurrentSelection({ stateCode, stateName, lgaCode, lgaName, wardCode, wardName });

      const newData = transformProfileData(
        stateCode, stateName, lgaCode, lgaName, wardCode, wardName,
        stateDetails, lgaDetails, wardDetails,
        year, month
      );

      setData(newData);
      setLocationState("success");

      setPersistedLocation({
        stateCode, stateName, lgaCode, lgaName, wardCode, wardName, year, month
      });
    } catch (err) {
      console.error(err);
      setLocationState("denied");
      setLocationState("success");
    }
  };

  const handleLocationSelect = async (item: {code: string, name: string}) => {
    if (selectorStep === "state") {
      setPendingSelection({ ...pendingSelection, stateCode: item.code, stateName: item.name });
      setSelectorStep("lga");
      setSearchQuery("");
      const lgas = await getLgas(item.code).catch(() => []);
      setLgasList(Array.isArray(lgas) ? lgas : []);
    } else if (selectorStep === "lga") {
      setPendingSelection({ ...pendingSelection, lgaCode: item.code, lgaName: item.name });
      setSelectorStep("ward");
      setSearchQuery("");
      const wards = await getWards(item.code).catch(() => []);
      setWardsList(Array.isArray(wards) ? wards : []);
    } else if (selectorStep === "ward") {
      setDropdownOpen(false);
      setSelectorStep("state");
      setSearchQuery("");
      
      await fetchFullProfile(
        pendingSelection.stateCode, pendingSelection.stateName,
        pendingSelection.lgaCode, pendingSelection.lgaName,
        item.code, item.name,
        selectedYear ?? undefined, selectedMonth ?? undefined
      );
    }
  };

  const requestLocation = () => {
    setLocationState("loading");
    if (!navigator.geolocation) {
      setLocationState("denied");
      window.dispatchEvent(new CustomEvent("location-request-completed"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        window.dispatchEvent(new CustomEvent("location-request-completed"));
        try {
          const res = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (geocodeIndicatesOutsideNigeria(res)) {
            setLocationState("outside_nigeria");
            return;
          }
          if (res && res.stateCode && res.lgaCode && res.wardCode) {
            await fetchFullProfile(
              res.stateCode, res.stateName || "",
              res.lgaCode, res.lgaName || "",
              res.wardCode, res.wardName || "",
              selectedYear ?? undefined, selectedMonth ?? undefined
            );
          } else if (res && res.stateCode && res.lgaCode) {
            // Fallback if ward is missing: fetch the LGA's wards and use the first one
            try {
              const lgaWards = await getWards(res.lgaCode);
              const fallbackWard = lgaWards.length > 0 
                ? lgaWards[0] 
                : { code: "unknown", name: "Unknown Ward" };
              
              await fetchFullProfile(
                res.stateCode, res.stateName || "",
                res.lgaCode, res.lgaName || "",
                fallbackWard.code, fallbackWard.name,
                selectedYear ?? undefined, selectedMonth ?? undefined
              );
            } catch (err) {
              setLocationState("denied");
            }
          } else {
            setLocationState("denied");
          }
        } catch {
          setLocationState("denied");
        }
      },
      () => {
        setLocationState("denied");
        window.dispatchEvent(new CustomEvent("location-request-completed"));
      }
    );
  };

  useEffect(() => {
    const handleOpenSelector = () => {
      setDropdownOpen(true);
      setDateDropdownOpen(false);
      setSelectorStep("state");
      setSearchQuery("");
      
      const section = document.getElementById("personalized-data-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    const handleRequestLocation = () => {
      const section = document.getElementById("personalized-data-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      requestLocation();
    };
    
    window.addEventListener("open-location-selector", handleOpenSelector);
    window.addEventListener("request-location", handleRequestLocation);
    return () => {
      window.removeEventListener("open-location-selector", handleOpenSelector);
      window.removeEventListener("request-location", handleRequestLocation);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // SAVED WINS: a previously-persisted location always takes priority over
    // auto-geolocation. Geolocation only runs on a genuine first visit (nothing
    // saved yet). The explicit "detect my location" path (requestLocation, via
    // the `request-location` window event or the "Use my current location"
    // button) remains an opt-in that re-runs geolocation and overwrites the
    // saved location via setPersistedLocation.
    const saved = readPersistedLocation();
    if (saved) {
      if (saved.year) setSelectedYear(saved.year);
      if (saved.month) setSelectedMonth(saved.month);

      fetchFullProfile(
        saved.stateCode, saved.stateName,
        saved.lgaCode ?? "", saved.lgaName ?? "",
        saved.wardCode ?? "", saved.wardName ?? "",
        saved.year, saved.month
      );
      return;
    }

    // No saved location — first-visit behavior: check permission, auto-detect
    // if already granted, otherwise show the idle "Use my current location" prompt.
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          requestLocation();
        } else if (result.state === "prompt") {
          setLocationState("idle");
        } else if (result.state === "denied") {
          setLocationState("success");
        }
      });
    } else {
      // Browsers without the Permissions API: fall back to the idle prompt
      // (same as "prompt" state above) so the user still sees a CTA.
      setLocationState("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
    {/* Personalization Top Bar */}
    <div id="personalized-data-section" className="border-y border-border/60 dark:border-white/30 bg-background/95 backdrop-blur-sm relative z-30">
      <KitContainer>
        {/* Coverage stats first */}
        {children}

        {/* Then: Viewing Status + location/date selectors.
            Divider is white-ish in dark mode so the section boundary stays visible
            against the near-black background (border-border is dark-on-dark there). */}
        <div className="flex items-center justify-between py-4 border-t border-border/60 dark:border-white/30">
          <div className="flex items-center gap-3">
            {/* Label and status dot are desktop-only. On a phone the row has to
                hold the location, the location picker and the month picker, and
                a ward like "Alausa Oregun Olusosun" wraps to four lines if it
                shares the width with anything else — so the location gets it
                all, and the surrounding section already says what it is. */}
            <div className="hidden sm:block h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              You are viewing
            </span>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                setDateDropdownOpen(false);
              }}
              className="font-semibold text-sm text-foreground text-left transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
            >
              {data.state} · {data.lga} · {data.ward}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Location Selector */}
            <div className="relative">
              <button 
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setDateDropdownOpen(false);
                }}
                type="button"
                className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 sm:px-4 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50"
              >
                <MapPin className="h-4 w-4 sm:hidden text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Change</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              
              <Show when={dropdownOpen}>
                <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 top-full mt-2 w-[300px] sm:w-80 rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/10 z-50 overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="p-3 border-b border-border/50 flex items-center gap-2 bg-muted/30">
                    <Show when={selectorStep !== "state"}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectorStep(selectorStep === "ward" ? "lga" : "state");
                          setSearchQuery("");
                        }}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </Show>
                    <div className={`font-semibold text-sm flex-1 text-center ${selectorStep === "state" ? "" : "pr-6"}`}>
                      {selectorStep === "state" ? "Select State" : selectorStep === "lga" ? "Select LGA" : "Select Ward"}
                    </div>
                  </div>
                  
                  {/* Search */}
                  <div className="p-2 border-b border-border/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="text" 
                        placeholder={`Search ${selectorStep === "state" ? "states" : selectorStep === "lga" ? "LGAs" : "wards"}...`}
                        className="w-full bg-muted/50 border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-60 overflow-y-auto p-2 scrollbar-theme">
                    {getListItems().map(item => (
                      <button
                        type="button"
                        key={item.code}
                        onClick={() => handleLocationSelect(item)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 text-foreground"
                      >
                        {item.name}
                        <Show when={selectorStep !== "ward"}><ChevronRight className="h-4 w-4 text-muted-foreground/50" /></Show>
                        <Show when={selectorStep === "ward" && data.ward === item.name && data.lga === pendingSelection.lgaName}><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></Show>
                      </button>
                    ))}
                    <Show when={getListItems().length === 0}>
                      <div className="py-8 text-center text-sm text-muted-foreground">No results found.</div>
                    </Show>
                  </div>
                </div>
              </Show>
            </div>

            {/* Date Selector */}
            <div className="relative">
              <button 
                onClick={() => {
                  setDateDropdownOpen(!dateDropdownOpen);
                  setDropdownOpen(false);
                }}
                type="button"
                className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50"
              >
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="sm:hidden">
                  {selectedMonth ? monthNames[selectedMonth - 1].slice(0, 3) : "..."}
                </span>
                <span className="hidden sm:inline">
                  {selectedMonth ? monthNames[selectedMonth - 1] : "..."} {selectedYear || "..."}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              
              <Show when={dateDropdownOpen}>
                <div className="absolute right-0 top-full mt-2 w-[280px] sm:w-72 rounded-2xl border border-border/60 bg-card p-2 shadow-xl shadow-black/10 z-50 flex gap-2">
                  <div className="flex-1 max-h-60 overflow-y-auto pr-1 scrollbar-theme">
                    <div className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2 pt-1">Month</div>
                    {selectedYear && faacPeriods.monthsByYear[selectedYear]?.map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => {
                          setSelectedMonth(m);
                          if (currentSelection.stateCode) {
                            fetchFullProfile(
                              currentSelection.stateCode, currentSelection.stateName,
                              currentSelection.lgaCode, currentSelection.lgaName,
                              currentSelection.wardCode, currentSelection.wardName,
                              selectedYear, m
                            );
                          }
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                          selectedMonth === m ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium" : "hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        {monthNames[m - 1]}
                      </button>
                    ))}
                  </div>
                  <div className="w-px bg-border/50" />
                  <div className="flex-1 max-h-60 overflow-y-auto pr-1 scrollbar-theme">
                    <div className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2 pt-1">Year</div>
                    {faacPeriods.years.map((y) => (
                      <button
                        type="button"
                        key={y}
                        onClick={() => {
                          setSelectedYear(y);
                          setDateDropdownOpen(false);
                          
                          // Check if currently selected month is valid for the new year
                          let nextMonth = selectedMonth;
                          const availableMonths = faacPeriods.monthsByYear[y] || [];
                          if (selectedMonth && !availableMonths.includes(selectedMonth)) {
                            nextMonth = availableMonths[availableMonths.length - 1] || null;
                            setSelectedMonth(nextMonth);
                          }
                          
                          if (currentSelection.stateCode && nextMonth) {
                            fetchFullProfile(
                              currentSelection.stateCode, currentSelection.stateName,
                              currentSelection.lgaCode, currentSelection.lgaName,
                              currentSelection.wardCode, currentSelection.wardName,
                              y, nextMonth
                            );
                          }
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                          selectedYear === y ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium" : "hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </KitContainer>
    </div>

    <section className="pb-20 pt-16 lg:pb-28 lg:pt-20 relative z-10">
      <KitContainer>
        <div className="mb-12 text-center">
          <KitSectionTitle
            kicker="Your Local Context"
            title="See where the money dey move in your area"
            subtitle="Grant location access to instantly see budgets, projects, and FAAC allocations for your specific State, Local Government, and Ward."
          />
          
          <Show when={locationState === "idle"}>
            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                onClick={requestLocation}
                className="h-12 rounded-2xl bg-emerald-600 px-7 text-base font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Use my current location
              </Button>
            </div>
          </Show>

          <Show when={locationState === "loading"}>
            <div className="mt-8 flex justify-center items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span className="text-sm font-medium">Fetching local data...</span>
            </div>
          </Show>

          <Show when={locationState === "denied"}>
            <div className="mt-8 flex flex-col items-center gap-2">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-900">
                Location access denied. Showing default data for Lagos.
              </p>
              <Button
                variant="outline"
                type="button"
                onClick={requestLocation}
                className="mt-2 h-10 rounded-xl px-5 text-sm"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Try again
              </Button>
            </div>
          </Show>

          <Show when={locationState === "outside_nigeria"}>
            <div className="mt-8 flex flex-col items-center gap-2">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-900">
                Your detected location is outside Nigeria. Showing default data for Lagos.
              </p>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setDropdownOpen(true);
                  setDateDropdownOpen(false);
                }}
                className="mt-2 h-10 rounded-xl px-5 text-sm"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Choose manually
              </Button>
            </div>
          </Show>
        </div>

        <div className="mx-auto max-w-5xl transition-all duration-500 ease-in-out">
          <Show when={locationState === "loading"}>
            <SkeletonLoader />
          </Show>
          <Show when={locationState !== "loading"}>
          <div className="grid items-start gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* LGA Financials — after the officials card on mobile, before it on desktop */}
              <div className="order-2 lg:order-1 rounded-[1.75rem] border border-border/60 bg-gradient-to-b from-card to-card/40 p-6 shadow-xl shadow-black/5 backdrop-blur-md">
                <div className="flex items-center gap-4 mb-6 border-b border-border/50 pb-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Local Government
                    </p>
                    <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold">
                      {data.lga}
                    </h3>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {data.lgaKpis.map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-xl border border-border/50 bg-background/60 px-4 py-3"
                    >
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {kpi.label}
                      </p>
                      <p className="mt-1 font-[family-name:var(--font-mono)] text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                        {kpi.value === "Coming Soon" ? (
                          <span className="inline-flex items-center rounded-full bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border/50">
                            Coming Soon
                          </span>
                        ) : (
                          kpi.value
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{kpi.delta}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured official — the headline holder for this area.
                  Comes first on mobile, sits under the LGA card on desktop. */}
              <FeaturedOfficialCard
                className="order-1 lg:order-2"
                official={toLocalOfficial(data.officials[0], currentSelection)}
              />
            </div>
            <div className="lg:col-span-7 flex flex-col gap-8">
              <KitDashboardMock
                title={`${data.state} snapshot`}
                region={`${data.lga} · ${data.ward}`}
                kpis={data.kpis}
                bars={data.bars}
                hideBadge
              />
              {/* The viewer's other representatives, three across. */}
              <PeerOfficialsStrip
                officials={data.officials
                  .slice(1)
                  .map((o) => toLocalOfficial(o, currentSelection))}
                moreHref={`/states/${currentSelection.stateName.toLowerCase().replace(/\s+/g, "-")}`}
                moreLabel={`Learn more about ${data.state}`}
              />
            </div>
          </div>
          </Show>
        </div>
      </KitContainer>
    </section>

    <Show when={locationState !== "loading"}>
      <>
        <section className="pb-8 pt-16 lg:pb-12 lg:pt-20 border-t border-border/50 bg-muted/10 dark:bg-muted/5 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
          <KitContainer className="relative z-10">
            <KitSectionTitle
              kicker="Civic Education"
              title="How national wealth reaches your doorstep"
              subtitle="The road you drive on, the primary school near you, and the health centre in your ward are partly funded by public money that starts in a national pool."
            />
            
            <FollowTheNaira data={data} />
          </KitContainer>
        </section>

        <LgLineItems data={data} />
        <NeighbourComparison data={data} />
        <TakeAction data={data} />
      </>
    </Show>
    <Methodology />
    <FaqAndTestimonials />
    </>
  );
}

function SkeletonLoader() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse transition-all duration-500 ease-in-out mt-8">
      <div className="grid items-start gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col gap-16">
          {/* LGA Financials Skeleton */}
          <div className="rounded-[1.75rem] border border-border/60 bg-gradient-to-b from-card to-card/40 p-6 shadow-xl shadow-black/5 backdrop-blur-md">
            <div className="flex items-center gap-4 mb-6 border-b border-border/50 pb-5">
              <div className="h-12 w-12 rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-6 w-32 bg-muted rounded" />
              </div>
            </div>
            <div className="grid gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 space-y-2">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-6 w-24 bg-muted rounded" />
                  <div className="h-3 w-3/4 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Officials Skeleton */}
          <div className="rounded-[1.75rem] border border-border/60 bg-card/50 p-6 shadow-xl shadow-black/5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-5">
              <div className="h-6 w-40 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="h-11 w-11 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                    <div className="h-3 w-1/3 bg-muted rounded mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          {/* Dashboard Mock Skeleton */}
          <div className="rounded-[1.75rem] border border-border/60 bg-gradient-to-b from-card to-card/40 p-6 shadow-2xl shadow-black/10 backdrop-blur-md">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/50 pb-5">
              <div className="space-y-2">
                <div className="h-7 w-48 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 space-y-2">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-6 w-24 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-48 bg-muted rounded" />
                <div className="h-5 w-5 bg-muted rounded" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-24 bg-muted rounded" />
                      <div className="h-3 w-8 bg-muted rounded" />
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- V2 Follow the Naira Components ---
function FlowCanvas({ active, stops }: { active: number; stops: FlowStop[] }) {
  const H = 220;
  const pct = active / (stops.length - 1);
  return (
    <div className="h-[220px] rounded-3xl p-4 bg-card/80 backdrop-blur-xl border border-border/60 shadow-2xl shadow-black/5 flex gap-3 overflow-hidden relative">
      {/* pipe column */}
      <div className="w-[60px] relative shrink-0">
        <svg viewBox="0 0 60 200" width="100%" height="100%" className="absolute inset-0" preserveAspectRatio="none">
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.4" />
            </filter>
          </defs>
          {/* main pipe */}
          <path d="M 30 10 L 30 190" className="stroke-muted dark:stroke-muted/30" strokeWidth="10" strokeLinecap="round" />
          {/* filled portion */}
          <path
            d="M 30 10 L 30 190"
            className="stroke-emerald-500"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="180"
            strokeDashoffset={180 - 180 * pct}
            style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.65,0,0.35,1)" }}
          />
          {/* stop nodes */}
          {stops.map((_, i) => {
            const y = 10 + (180 * i) / (stops.length - 1);
            const done = i <= active;
            return (
              <g key={i}>
                <circle cx="30" cy={y} r="8" className={`transition-colors duration-500 ${done ? "fill-emerald-500" : "fill-muted dark:fill-muted/30"}`} />
                <circle cx="30" cy={y} r="3" className="fill-background" />
              </g>
            );
          })}
          {/* traveling token */}
          <g style={{ transition: "transform 0.7s cubic-bezier(0.65,0,0.35,1)", transform: `translateY(${(180 * pct)}px)`, transformOrigin: "30px 10px" }}>
            <circle cx="30" cy="10" r="13" fill="url(#goldGrad)" filter="url(#shadow)" />
            <text x="30" y="14" textAnchor="middle" fill="#78350f" fontFamily="var(--font-mono)" fontWeight="700" fontSize="13">₦</text>
          </g>
        </svg>
      </div>
      {/* labels */}
      <div className="flex-1 flex flex-col justify-between pr-1">
        {stops.map((st, i) => {
          const done = i <= active;
          const current = i === active;
          return (
            <div key={i} className={`flex items-center gap-2 transition-opacity duration-500 ${done ? 'opacity-100' : 'opacity-40'}`}>
              <div className="flex-1 min-w-0">
                <div className={`font-[family-name:var(--font-mono)] text-[9px] tracking-[0.15em] font-semibold ${current ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"}`}>
                  {st.sub.toUpperCase()}
                </div>
                <div className="font-[family-name:var(--font-heading)] font-bold text-sm text-foreground tracking-tight truncate">
                  {st.label}
                </div>
              </div>
              <div className={`font-[family-name:var(--font-mono)] text-[11px] font-semibold ${done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50"}`}>
                {st.amt}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SplitPreview() {
  const splits = [
    { label: "Federal Govt", pct: 52.68, color: "bg-emerald-600 dark:bg-emerald-500" },
    { label: "All States", pct: 26.72, color: "bg-amber-500 dark:bg-amber-400" },
    { label: "All LGAs", pct: 20.60, color: "bg-violet-600 dark:bg-violet-500" },
  ];
  return (
    <div className="mt-4 p-4 bg-card border border-border/60 rounded-2xl shadow-sm">
      <div className="font-[family-name:var(--font-mono)] text-[9px] text-muted-foreground tracking-[0.18em] mb-2.5">
        HOW THE POT IS SHARED
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden">
        {splits.map((s) => (
          <div key={s.label} style={{ width: `${s.pct}%` }} className={s.color} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {splits.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-sm ${s.color}`} />
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
            <div className="font-[family-name:var(--font-mono)] text-xs font-semibold text-foreground">{s.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StateBreakdown({ loc }: { loc: Pick<NairaLocationContext, "name" | "derivation"> }) {
  const parts = [
    { label: "Equality share", pct: 40 },
    { label: "Population", pct: 30 },
    { label: "Landmass", pct: 10 },
    { label: "IGR effort", pct: 8 },
    { label: "Social dev.", pct: 12 },
  ];
  return (
    <div className="mt-4 p-4 bg-card border border-border/60 rounded-2xl shadow-sm">
      <div className="font-[family-name:var(--font-mono)] text-[9px] text-muted-foreground tracking-[0.18em] mb-2.5">
        {loc.name.toUpperCase()} HORIZONTAL FORMULA
      </div>
      <div className="flex flex-col gap-1.5">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center gap-2.5">
            <div className="flex-1 text-xs text-muted-foreground">{p.label}</div>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div style={{ width: `${p.pct * 2}%` }} className="h-full bg-emerald-500 dark:bg-emerald-400" />
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[11px] text-foreground font-semibold w-7 text-right">{p.pct}%</div>
          </div>
        ))}
        <Show when={!!loc.derivation}>
          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50">
            <strong>+ 13% derivation</strong> — oil-producing state bonus
          </div>
        </Show>
      </div>
    </div>
  );
}

function WardOutcomes({ ward }: { ward: string }) {
  const outcomes = [
    { label: "Accessible primary healthcare centre" },
    { label: "Clean running water" },
    { label: "Paved access roads" },
    { label: "Functioning public primary school" },
    { label: "Working street lights" },
  ];
  return (
    <div className="mt-4 p-4 bg-card border border-border/60 rounded-2xl shadow-sm">
      <div className="font-[family-name:var(--font-mono)] text-[9px] text-muted-foreground tracking-[0.18em] mb-2.5">
        EXPECTED IN {ward.toUpperCase()}
      </div>
      <div className="flex flex-col">
        {outcomes.map((o, i) => (
          <div key={o.label} className={`flex items-center gap-2.5 py-1.5 ${i !== 0 ? 'border-t border-border/50' : ''}`}>
            <span className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400">
              ?
            </span>
            <span className="text-xs text-foreground">{o.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LgLineItems({ data }: { data: ProfileViewData }) {
  return (
    <section className="py-12 lg:py-16 relative">
      <KitContainer>
        <div className="mb-10">
          <KitSectionTitle
            kicker="LGA BUDGET"
            title={`What's in the ${data.state} budget for ${data.lga}`}
            subtitle={`Approved capital projects and line items for ${data.lga}. Pulled from published state and LG budgets.`}
          />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 overflow-hidden flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We are currently collecting and verifying detailed budget data for {data.lga}. Check back later.
            </p>
          </div>
        </div>
        
        <p className="mt-4 text-xs text-muted-foreground">
          Sourced from official budget documents. Think something&apos; off? <button onClick={() => globalThis.dispatchEvent(new CustomEvent("open-feedback", { detail: { category: "data_issue" } }))} className="text-emerald-600 dark:text-emerald-400 font-medium underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">Flag it — we re-verify.</button>
        </p>
      </KitContainer>
    </section>
  );
}

function NeighbourComparison({ data }: { data: ProfileViewData }) {
  return (
    <section className="py-12 lg:py-16 relative">
      <KitContainer>
        <div className="mb-10">
          <KitSectionTitle
            kicker="NEIGHBOUR COMPARISON"
            title="How your state stacks up"
            subtitle={`${data.state} against the states that border it. Figures are 2025 where available.`}
          />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 overflow-hidden flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We are currently collecting and verifying comparative data for {data.state} and its neighbours. Check back later.
            </p>
          </div>
        </div>
      </KitContainer>
    </section>
  );
}

function TakeAction({ data }: { data: ProfileViewData }) {
  return (
    <section className="py-16 lg:py-24 relative">
      <KitContainer>
        <div className="mb-12">
          <KitSectionTitle
            kicker="TAKE ACTION"
            title="What you can do in 2 minutes"
            subtitle="Small actions that add up across 8,809 wards."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Card 1: Report */}
          <div className="group relative overflow-hidden rounded-[2rem] border border-rose-200/60 bg-gradient-to-b from-rose-50/80 to-rose-100/50 dark:border-rose-900/30 dark:from-rose-950/20 dark:to-rose-900/10 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-200/50 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 transition-transform group-hover:scale-110">
              <Flag className="h-6 w-6" />
            </div>
            <div className="mb-3 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-rose-700/80 dark:text-rose-400/80">
              1 Minute
            </div>
            <h3 className="mb-4 font-[family-name:var(--font-heading)] text-2xl font-bold text-rose-950 dark:text-rose-100 leading-tight">
              Report what isn&apos;t working
            </h3>
            <p className="mb-8 text-[15px] leading-relaxed text-rose-900/80 dark:text-rose-200/70">
              See a stalled project, ghost contractor, or phantom school? Flag it and we follow up.
            </p>
            <Button className="w-full sm:w-auto rounded-xl bg-rose-700 text-white hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-700 shadow-sm transition-all group-hover:pr-6 relative overflow-hidden">
              <span className="relative z-10 flex items-center">
                Report now <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </div>

          {/* Card 2: Propose */}
          <div className="group relative overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-gradient-to-b from-emerald-50/80 to-emerald-100/50 dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-emerald-900/10 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-200/50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 transition-transform group-hover:scale-110">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div className="mb-3 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/80">
              3 Minutes
            </div>
            <h3 className="mb-4 font-[family-name:var(--font-heading)] text-2xl font-bold text-emerald-950 dark:text-emerald-100 leading-tight">
              Propose what your ward needs
            </h3>
            <p className="mb-8 text-[15px] leading-relaxed text-emerald-900/80 dark:text-emerald-200/70">
              Shape the 2026 budget: rank the priorities that matter most for {data.ward}.
            </p>
            <Button className="w-full sm:w-auto rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm transition-all group-hover:pr-6 relative overflow-hidden">
              <span className="relative z-10 flex items-center">
                Submit priority <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </div>

          {/* Card 3: Join */}
          <div className="group relative overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-gradient-to-b from-emerald-50/80 to-emerald-100/50 dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-emerald-900/10 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-200/50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 transition-transform group-hover:scale-110">
              <Users className="h-6 w-6" />
            </div>
            <div className="mb-3 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/80">
              Join a circle
            </div>
            <h3 className="mb-4 font-[family-name:var(--font-heading)] text-2xl font-bold text-emerald-950 dark:text-emerald-100 leading-tight">
              Join others in your ward
            </h3>
            <p className="mb-8 text-[15px] leading-relaxed text-emerald-900/80 dark:text-emerald-200/70">
              148 neighbours in {data.ward} are already tracking these projects — join the circle.
            </p>
            <Button asChild className="w-full sm:w-auto rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm transition-all group-hover:pr-6 relative overflow-hidden">
              <a href="https://t.me/+ZFpykF_Ka4RjMGQ0" target="_blank" rel="noopener noreferrer">
                <span className="relative z-10 flex items-center">
                  Join circle <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </a>
            </Button>
          </div>
        </div>
      </KitContainer>
    </section>
  );
}

function Methodology() {
  const sources = [
    {
      title: "Official Gazettes",
      desc: "State and federal government publications.",
    },
    {
      title: "FAAC Monthly",
      desc: "Federation Allocation distribution per state + LG.",
    },
    {
      title: "Auditor-General Reports",
      desc: "Audit queries and resolutions, coded by region.",
    },
    {
      title: "Citizen Reports",
      desc: "Crowd-sourced reports we verify before publishing.",
    },
    {
      title: "Contract Registry",
      desc: "Awarded contracts above the disclosure threshold.",
    },
    {
      title: "Monthly Refresh",
      desc: "Every 30 days, no exceptions. Changelogs public.",
    },
  ];

  return (
    <section className="py-16 lg:py-24 relative bg-muted/10 dark:bg-muted/5 border-t border-border/50">
      <KitContainer>
        <div className="mb-12">
          <KitSectionTitle
            kicker="METHODOLOGY"
            title="Where this data comes from"
            subtitle=""
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sources.map((source, idx) => (
            <div 
              key={idx} 
              className={`rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-colors hover:border-emerald-500/30 ${
                idx === 0 || idx === 1 ? 'lg:col-span-1' :
                idx === 2 ? 'lg:col-span-1' :
                idx === 3 ? 'lg:col-span-1' :
                idx === 4 || idx === 5 ? 'lg:col-span-1' : ''
              }`}
            >
              <h4 className="mb-3 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                {source.title}
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {source.desc}
              </p>
            </div>
          ))}
        </div>
      </KitContainer>
    </section>
  );
}

function FaqAndTestimonials() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: "Who runs OurNigeria?", a: "OurNigeria is an open-source civic tech platform built by a coalition of data scientists, journalists, and active citizens." },
    { q: "Where does the data come from?", a: "We source data directly from official government gazettes, FAAC monthly reports, Auditor-General reports, and verified citizen submissions." },
    { q: "How often is the data updated?", a: "We update our database monthly as new FAAC allocations are published, and continuously as state and local governments release their budgets and implementation reports." },
    { q: "Why can't I find specific projects for my ward?", a: "Data availability depends on what the government publishes. While FAAC and state budgets are generally available, granular ward-level project data is often missing from official records. We publish everything that is publicly accessible, but we also rely on citizens like you to submit and track projects in your locality." },
    { q: "What if I spot a mistake?", a: "You can flag any data point directly on the platform. Our verification team will review it against official records and update it if necessary." },
    { q: "Can I download the data for my own research?", a: "Yes! All our datasets are open and available for download. You can export budgets, FAAC allocations, and project tracking data in CSV format." },
    { q: "How can I use this to hold leaders accountable?", a: "Use the data to ask informed questions. When you see a project marked as 'funded' but abandoned in reality, you can use the contact details provided in the 'Know Your Leaders' section to reach out to your representatives." },
    { q: "Is it free?", a: "Yes, OurNigeria is 100% free to use. We believe public data should be publicly accessible without barriers." }
  ];

  const testimonials = [
    { quote: "Finally, I can see exactly how much my LGA gets every month. This changes everything for local accountability.", author: "Chinedu O.", role: "Active Citizen, Rivers" },
    { quote: "As a journalist, this tool saves me weeks of digging through PDF gazettes. The data is clean, structured, and ready to use.", author: "Amina S.", role: "Investigative Reporter" },
    { quote: "I used the project tracker to flag an abandoned health center in my ward. Two weeks later, contractors were back on site.", author: "Tunde B.", role: "Community Leader, Lagos" },
    { quote: "The breakdown of FAAC allocations makes it so easy to understand where the money is actually going.", author: "Ngozi E.", role: "Policy Analyst" },
    { quote: "Every Nigerian needs to see this. It bridges the gap between Abuja billions and our local reality.", author: "Yusuf M.", role: "Student, Kano" },
  ];

  // Duplicate for seamless infinite scroll
  const scrollItems = [...testimonials, ...testimonials];

  return (
    <section className="py-20 lg:py-32 bg-background relative overflow-hidden">
      <KitContainer>
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          
          {/* Left: FAQ */}
          <div>
            <KitSectionTitle
              kicker="FAQ"
              title="Questions people ask"
              subtitle=""
            />
            <div className="mt-10 flex flex-col">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-border/50 py-5">
                  <button 
                    type="button"
                    onClick={() => setOpenIndex(openIndex === i ? null : i)} 
                    className="flex w-full items-center justify-between text-left group"
                  >
                    <span className="font-semibold text-lg text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {faq.q}
                    </span>
                    <Show when={openIndex === i}>
                      <Minus className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </Show>
                    <Show when={openIndex !== i}>
                      <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </Show>
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Testimonials (Auto-scrolling Downwards) */}
          <div className="relative h-[600px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)]">
            <style>{`
              @keyframes scroll-down {
                0% { transform: translateY(-50%); }
                100% { transform: translateY(0); }
              }
              .animate-scroll-down {
                animation: scroll-down 40s linear infinite;
              }
              .animate-scroll-down:hover {
                animation-play-state: paused;
              }
            `}</style>
            <div className="flex flex-col gap-6 animate-scroll-down">
              {scrollItems.map((t, i) => (
                <div key={i} className="rounded-2xl border border-border/50 bg-muted/20 dark:bg-muted/5 p-8 shadow-sm backdrop-blur-sm transition-colors hover:border-emerald-500/30">
                  <p className="text-foreground leading-relaxed text-lg font-medium">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-8 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-lg font-bold font-[family-name:var(--font-heading)]">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{t.author}</div>
                      <div className="text-xs text-muted-foreground font-[family-name:var(--font-mono)] uppercase tracking-wider mt-0.5">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </KitContainer>
    </section>
  );
}

function FollowTheNaira({ data }: { data: ProfileViewData }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            setActive(idx);
          }
        });
      },
      {
        rootMargin: "-30% 0px -30% 0px", // Triggers when the element is in the middle 40% of the screen
        threshold: 0,
      }
    );

    const currentRefs = refs.current;
    currentRefs.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      currentRefs.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const faacStateKpi = data.kpis.find((k) => k.label.includes("FAAC"));
  const SAMPLE_COMPACT = { 
    purse: "₦1.35T", 
    states: "₦361B", 
    state: faacStateKpi?.value ?? "₦32.5B", 
    lg: data.lgaKpis[0]?.value || "₦620.5M", 
    ward: "???" 
  };

  const stops: FlowStop[] = [
    { label: "FAAC POT", sub: "Federation Account", amt: SAMPLE_COMPACT.purse },
    { label: "FIRST SPLIT", sub: "Fed · States · LGAs", amt: SAMPLE_COMPACT.states },
    { label: data.state.toUpperCase(), sub: "State Allocation", amt: SAMPLE_COMPACT.state },
    { label: data.lga.toUpperCase(), sub: "LG Council", amt: SAMPLE_COMPACT.lg },
    { label: data.ward.toUpperCase(), sub: "Your Ward", amt: SAMPLE_COMPACT.ward },
  ];

  const steps = [
    {
      id: 1,
      title: "The National Purse",
      desc: "Every month, federally collected revenue enters a common pool. This includes major revenues like oil-related income, customs, and company taxes. But not every part of the pool is shared the same way.",
    },
    {
      id: 2,
      title: "The First Split",
      desc: "For NET Federation Account revenue, FAAC shares money among the Federal Government (52.68%), states (26.72%), and local governments (20.60%). Separate rules apply to VAT and derivation.",
    },
    {
      id: 3,
      title: `Why ${data.state} Gets Its Share`,
      desc: `${data.state} receives a state allocation based on population and equality. Depending on resources, it may also benefit from the 13% derivation fund, making its real inflow more complex than one headline percentage.`,
    },
    {
      id: 4,
      title: `${data.lga} Is the Real Local Link`,
      desc: `The money does not jump straight from Abuja to your ward. ${data.lga} is the government layer that is closer to your everyday services.`,
    },
    {
      id: 5,
      title: `What You Should Feel in ${data.ward}`,
      desc: `If public money is working, you should see it here: cleaner streets, functioning health centres, better schools, maintained roads, and visible projects. This is where allocation becomes accountability.`,
    },
  ];

  const loc: NairaLocationContext = { name: data.state, lga: data.lga, ward: data.ward, derivation: true };

  return (
    <div className="relative max-w-5xl mx-auto mt-12 flex flex-col md:flex-row gap-8 items-start">
      {/* Sticky Canvas (Left on Desktop, Top on Mobile) */}
      <div className="sticky top-24 z-20 w-full md:w-[320px] shrink-0 pt-4 pb-8 md:py-0 bg-gradient-to-b from-muted/10 via-muted/10 to-transparent md:bg-transparent">
        <FlowCanvas active={active} stops={stops} />
      </div>

      {/* Scrolling Steps */}
      <div className="flex-1 pb-8 w-full max-w-xl mx-auto md:mx-0">
        {steps.map((s, i) => (
          <div
            key={s.id}
            ref={(el) => { refs.current[i] = el; }}
            data-index={i}
            className={`min-h-[50vh] flex flex-col justify-center py-8 transition-opacity duration-500 ${active === i ? 'opacity-100' : 'opacity-30'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 font-bold text-sm shadow-sm">
                ₦
              </div>
              <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold tracking-[0.18em] text-emerald-700 dark:text-emerald-500">
                STOP {s.id} / 5
              </span>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-[family-name:var(--font-heading)] font-bold mb-3 text-foreground leading-tight">
              {s.title}
            </h3>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {s.desc}
            </p>

            {/* Step-specific inline illustration */}
            <Show when={i === 1}><SplitPreview /></Show>
            <Show when={i === 2}><StateBreakdown loc={loc} /></Show>
            <Show when={i === 4}><WardOutcomes ward={loc.ward} /></Show>

            {/* Amount Box */}
            <div className="mt-6 p-3 rounded-2xl bg-card border border-border/60 shadow-lg shadow-black/5 flex items-center gap-3 self-start">
              <div className="w-1 self-stretch bg-amber-500 rounded-full" />
              <div>
                <div className="font-[family-name:var(--font-mono)] text-[9px] text-muted-foreground tracking-[0.18em] font-bold">
                  AMOUNT AT THIS STOP
                </div>
                <div className="font-[family-name:var(--font-mono)] text-lg text-foreground font-semibold mt-0.5">
                  {stops[i].amt}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
