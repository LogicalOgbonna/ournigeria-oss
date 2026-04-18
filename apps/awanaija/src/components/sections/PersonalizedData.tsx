"use client";

import {
  KitContainer,
  KitDashboardMock,
  KitSectionTitle,
} from "@/components/landing-variants/LandingVariantKit";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, AtSign, Calendar, Check, ChevronDown, ChevronRight, Flag, Lightbulb, Loader2, Mail, MapPin, Minus, Phone, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getStates, getLgas, getWards, getStateDetails, getLgaDetails, getWardDetails, reverseGeocode } from "@/lib/api";

const mockLocations = {
  lagos: {
    id: "lagos",
    state: "Lagos State",
    lga: "Ikeja LG",
    ward: "Alausa Ward",
    lgaKpis: [
      {
        label: "LGA FAAC (Current Month)",
        value: "₦450.2M",
        delta: "Federal allocation directly to the local government.",
      },
      {
        label: "Tracked Projects",
        value: "Coming Soon",
        delta: "Public projects currently monitored in this LGA.",
      }
    ],
    officials: [
      { id: "1", role: "Governor", name: "Babajide Sanwo-Olu", party: "APC", term: "2023 - 2027", contact: "08000000000", contactType: "phone", image: "https://i.pravatar.cc/150?u=sanwoolu" },
      { id: "2", role: "Senator (Lagos West)", name: "Idiat Oluranti Adebule", party: "APC", term: "2023 - 2027", contact: "senator@lagos.gov.ng", contactType: "email", image: "https://i.pravatar.cc/150?u=adebule" },
      { id: "3", role: "House of Reps (Ikeja)", name: "James Abiodun Faleke", party: "APC", term: "2023 - 2027", contact: "@JAFaleke", contactType: "social", image: "https://i.pravatar.cc/150?u=faleke" },
      { id: "4", role: "State House (Ikeja II)", name: "Adedamola R. Kasunmu", party: "APC", term: "2023 - 2027", contact: "08011111111", contactType: "phone", image: "https://i.pravatar.cc/150?u=kasunmu" },
      { id: "5", role: "LGA Chairman", name: "Engr. Mojeed Balogun", party: "APC", term: "2021 - 2025", contact: "chairman@ikeja.gov.ng", contactType: "email", image: "https://i.pravatar.cc/150?u=mojeed" },
      { id: "6", role: "Ward Councillor", name: "Hon. Mutiu", party: "APC", term: "2021 - 2025", contact: "@HonMutiu", contactType: "social", image: "https://i.pravatar.cc/150?u=mutiu" }
    ],
    kpis: [
      {
        label: "2024 Budget",
        value: "₦2.26T",
        delta: "How much the state plans to spend to improve your life.",
      },
      {
        label: "FAAC (Current Month)",
        value: "₦45.2B",
        delta: "Your state's share of the national wealth this month.",
      },
      {
        label: "State Debt",
        value: "₦1.04T",
        delta: "The heavy burden of debt hanging over the state's future.",
      },
      {
        label: "Internally Generated Revenue",
        value: "₦85.5B",
        delta: "How much the state is making from your taxes and levies.",
      },
      {
        label: "Recurrent Expenditure",
        value: "₦1.25T",
        delta: "What the state pays just to keep the lights on and pay salaries.",
      },
      {
        label: "Capital Expenditure",
        value: "₦1.01T",
        delta: "Money meant for building schools, hospitals, and roads.",
      },
    ],
    bars: [
      { label: "Works & transport", value: 34, color: "#d97706" },
      { label: "Education", value: 22, color: "#059669" },
      { label: "Health", value: 14, color: "#0891b2" },
      { label: "Environment / drainage", value: 18, color: "#65a30d" },
      { label: "Admin & governance", value: 12, color: "#64748b" },
    ],
    lineItems: [
      { id: "l1", title: "Road rehabilitation — Allen Avenue", sector: "Infrastructure", amount: "₦250M" },
      { id: "l2", title: "Alausa Primary Health Centre", sector: "Health", amount: "₦120M" },
      { id: "l3", title: "Drainage clearing — Oregun", sector: "Environment", amount: "₦45M" },
      { id: "l4", title: "Public school desks (12 schools)", sector: "Education", amount: "₦30M" },
    ],
  },
  rivers: {
    id: "rivers",
    state: "Rivers State",
    lga: "Obio-Akpor LG",
    ward: "Rumuigbo Ward",
    lgaKpis: [
      {
        label: "LGA FAAC (Current Month)",
        value: "₦620.5M",
        delta: "Federal allocation directly to the local government.",
      },
      {
        label: "Tracked Projects",
        value: "Coming Soon",
        delta: "Public projects currently monitored in this LGA.",
      }
    ],
    officials: [
      { id: "7", role: "Governor", name: "Siminalayi Fubara", party: "PDP", term: "2023 - 2027", contact: "08022222222", contactType: "phone", image: "https://i.pravatar.cc/150?u=fubara" },
      { id: "8", role: "Senator (Rivers West)", name: "Ipalibo Banigo", party: "PDP", term: "2023 - 2027", contact: "senator@rivers.gov.ng", contactType: "email", image: "https://i.pravatar.cc/150?u=banigo" },
      { id: "9", role: "House of Reps", name: "Kingsley Chinda", party: "PDP", term: "2023 - 2027", contact: "@KingsleyChinda", contactType: "social", image: "https://i.pravatar.cc/150?u=chinda" },
      { id: "10", role: "State House", name: "Martin Amaewhule", party: "PDP", term: "2023 - 2027", contact: "08033333333", contactType: "phone", image: "https://i.pravatar.cc/150?u=amaewhule" },
      { id: "11", role: "LGA Chairman", name: "Chijioke Ihunwo", party: "PDP", term: "2024 - 2027", contact: "chair@obioakpor.gov.ng", contactType: "email", image: "https://i.pravatar.cc/150?u=ihunwo" },
      { id: "12", role: "Ward Councillor", name: "Hon. Representative", party: "PDP", term: "2024 - 2027", contact: "@HonRep", contactType: "social", image: "https://i.pravatar.cc/150?u=rep" }
    ],
    kpis: [
      {
        label: "2024 Budget",
        value: "₦800B",
        delta: "How much the state plans to spend to improve your life.",
      },
      {
        label: "FAAC (Current Month)",
        value: "₦32.5B",
        delta: "Your state's share of the national wealth this month.",
      },
      {
        label: "State Debt",
        value: "₦232.6B",
        delta: "The heavy burden of debt hanging over the state's future.",
      },
      {
        label: "Internally Generated Revenue",
        value: "₦25.4B",
        delta: "How much the state is making from your taxes and levies.",
      },
      {
        label: "Recurrent Expenditure",
        value: "₦361.5B",
        delta: "What the state pays just to keep the lights on and pay salaries.",
      },
      {
        label: "Capital Expenditure",
        value: "₦438.5B",
        delta: "Money meant for building schools, hospitals, and roads.",
      },
    ],
    bars: [
      { label: "Infrastructure", value: 42, color: "#d97706" },
      { label: "Education", value: 18, color: "#059669" },
      { label: "Health", value: 15, color: "#0891b2" },
      { label: "Environment", value: 15, color: "#65a30d" },
      { label: "Governance", value: 10, color: "#64748b" },
    ],
    lineItems: [
      { id: "r1", title: "Road rehabilitation — Rumuola-NTA route", sector: "Infrastructure", amount: "₦180M" },
      { id: "r2", title: "Rumuigbo Primary Health Centre upgrade", sector: "Health", amount: "₦95M" },
      { id: "r3", title: "Potable water — boreholes (x4)", sector: "Water Resources", amount: "₦42M" },
      { id: "r4", title: "Primary school books (18 schools)", sector: "Education", amount: "₦38M" },
      { id: "r5", title: "Street lighting — Ada George Rd", sector: "Infrastructure", amount: "₦28M" },
      { id: "r6", title: "Refuse collection (Q3)", sector: "Environment", amount: "₦34M" },
    ],
  },
  kano: {
    id: "kano",
    state: "Kano State",
    lga: "Nassarawa LGA",
    ward: "Hotoro North Ward",
    lgaKpis: [
      {
        label: "LGA FAAC (Current Month)",
        value: "₦510.8M",
        delta: "Federal allocation directly to the local government.",
      },
      {
        label: "Tracked Projects",
        value: "Coming Soon",
        delta: "Public projects currently monitored in this LGA.",
      }
    ],
    officials: [
      { id: "13", role: "Governor", name: "Abba Kabir Yusuf", party: "NNPP", term: "2023 - 2027", contact: "08044444444", contactType: "phone", image: "https://i.pravatar.cc/150?u=yusuf" },
      { id: "14", role: "Senator (Kano Central)", name: "Rufai Hanga", party: "NNPP", term: "2023 - 2027", contact: "senator@kano.gov.ng", contactType: "email", image: "https://i.pravatar.cc/150?u=hanga" },
      { id: "15", role: "House of Reps", name: "Hon. Member", party: "NNPP", term: "2023 - 2027", contact: "@HonMember", contactType: "social", image: "https://i.pravatar.cc/150?u=kanorep" },
      { id: "16", role: "State House", name: "Hon. State Rep", party: "NNPP", term: "2023 - 2027", contact: "08055555555", contactType: "phone", image: "https://i.pravatar.cc/150?u=kanostate" },
      { id: "17", role: "LGA Chairman", name: "Hon. Chairman", party: "NNPP", term: "2024 - 2027", contact: "chair@nassarawa.gov.ng", contactType: "email", image: "https://i.pravatar.cc/150?u=kanochair" },
      { id: "18", role: "Ward Councillor", name: "Hon. Councillor", party: "NNPP", term: "2024 - 2027", contact: "@HonCouncillor", contactType: "social", image: "https://i.pravatar.cc/150?u=kanoward" }
    ],
    kpis: [
      {
        label: "2024 Budget",
        value: "₦437B",
        delta: "How much the state plans to spend to improve your life.",
      },
      {
        label: "FAAC (Current Month)",
        value: "₦28.1B",
        delta: "Your state's share of the national wealth this month.",
      },
      {
        label: "State Debt",
        value: "₦122.3B",
        delta: "The heavy burden of debt hanging over the state's future.",
      },
      {
        label: "Internally Generated Revenue",
        value: "₦15.2B",
        delta: "How much the state is making from your taxes and levies.",
      },
      {
        label: "Recurrent Expenditure",
        value: "₦210.5B",
        delta: "What the state pays just to keep the lights on and pay salaries.",
      },
      {
        label: "Capital Expenditure",
        value: "₦226.5B",
        delta: "Money meant for building schools, hospitals, and roads.",
      },
    ],
    bars: [
      { label: "Education", value: 30, color: "#059669" },
      { label: "Infrastructure", value: 25, color: "#d97706" },
      { label: "Health", value: 15, color: "#0891b2" },
      { label: "Agriculture", value: 15, color: "#65a30d" },
      { label: "Governance", value: 15, color: "#64748b" },
    ],
    lineItems: [
      { id: "k1", title: "Nassarawa Road expansion", sector: "Infrastructure", amount: "₦300M" },
      { id: "k2", title: "Hotoro North Clinic supplies", sector: "Health", amount: "₦50M" },
      { id: "k3", title: "Water pipeline extension", sector: "Water Resources", amount: "₦80M" },
      { id: "k4", title: "Street lighting — Main Blvd", sector: "Infrastructure", amount: "₦40M" },
    ],
  }
};

const locationHierarchy: Record<string, Record<string, string[]>> = {
  "Lagos State": {
    "Ikeja LG": ["Alausa Ward", "Oregun Ward", "Ikeja GRA Ward"],
    "Eti-Osa LG": ["Victoria Island Ward", "Lekki Ward", "Ikoyi Ward"],
    "Alimosho LG": ["Egbeda Ward", "Ikotun Ward", "Ipaja Ward"],
  },
  "Rivers State": {
    "Obio-Akpor LG": ["Rumuigbo Ward", "Rumuola Ward", "Rumuodara Ward"],
    "Port Harcourt LG": ["Diobu Ward", "Town Ward", "D-Line Ward"],
    "Eleme LG": ["Alesa Ward", "Alode Ward", "Onne Ward"],
  },
  "Kano State": {
    "Nassarawa LGA": ["Hotoro North Ward", "Dakota Ward", "Gama Ward"],
    "Kano Municipal": ["Fagge Ward", "Tarauni Ward", "Zango Ward"],
    "Dala LGA": ["Gwammaja Ward", "Dala Ward", "Kabo Ward"],
  },
  "Abuja FCT": {
    "Abuja Municipal": ["Wuse Ward", "Garki Ward", "Maitama Ward"],
    "Bwari Area Council": ["Bwari Ward", "Kubwa Ward", "Ushafa Ward"],
    "Gwagwalada": ["Gwagwalada Centre", "Zuba Ward", "Dobi Ward"],
  }
};

export function PersonalizedData() {
  const [locationState, setLocationState] = useState<"idle" | "loading" | "success" | "denied">("idle");
  const [data, setData] = useState<any>(mockLocations.rivers);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("March");
  const [selectedYear, setSelectedYear] = useState("2024");

  const [selectorStep, setSelectorStep] = useState<"state" | "lga" | "ward">("state");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingSelection, setPendingSelection] = useState({ stateCode: "", stateName: "", lgaCode: "", lgaName: "" });

  const [statesList, setStatesList] = useState<{code: string, name: string}[]>([]);
  const [lgasList, setLgasList] = useState<{code: string, name: string}[]>([]);
  const [wardsList, setWardsList] = useState<{code: string, name: string}[]>([]);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = ["2024", "2023", "2022", "2021", "2020", "2019"];

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

  const fetchFullProfile = async (stateCode: string, stateName: string, lgaCode: string, lgaName: string, wardCode: string, wardName: string) => {
    setLocationState("loading");
    try {
      const stateSlug = stateName.toLowerCase().replace(/ /g, '-');
      const lgaSlug = lgaName.toLowerCase().replace(/ /g, '-');
      const wardSlug = wardName.toLowerCase().replace(/ /g, '-');

      const [stateDetails, lgaDetails, wardDetails] = await Promise.all([
        getStateDetails(stateSlug).catch(() => null),
        getLgaDetails(stateSlug, lgaSlug).catch(() => null),
        getWardDetails(stateSlug, lgaSlug, wardSlug).catch(() => null)
      ]);

      if (!stateDetails) throw new Error("State details not found");

      // Construct officials list
      const officials = [];
      if (stateDetails.governor) {
        officials.push({ ...stateDetails.governor, role: "Governor", contactType: "social", contact: "@gov" });
      }
      if (stateDetails.senatorPositions?.[0]) {
        const sen = stateDetails.senatorPositions[0];
        officials.push({ id: sen.official.id, role: `Senator (${sen.constituency?.name || 'Unknown'})`, name: sen.official.name, party: sen.partyAcronym || 'N/A', term: "Current", contact: "Contact", contactType: "social", image: sen.official.imageUrl });
      }
      if (stateDetails.houseMemberPositions?.[0]) {
        const rep = stateDetails.houseMemberPositions[0];
        officials.push({ id: rep.official.id, role: `House of Reps (${rep.constituency?.name || 'Unknown'})`, name: rep.official.name, party: rep.partyAcronym || 'N/A', term: "Current", contact: "Contact", contactType: "social", image: rep.official.imageUrl });
      }
      if (stateDetails.stateAssemblyPositions?.[0]) {
        const mha = stateDetails.stateAssemblyPositions[0];
        officials.push({ id: mha.official.id, role: `State House (${mha.constituency?.name || 'Unknown'})`, name: mha.official.name, party: mha.partyAcronym || 'N/A', term: "Current", contact: "Contact", contactType: "social", image: mha.official.imageUrl });
      }
      if (lgaDetails?.chairman) {
        officials.push({ ...lgaDetails.chairman, role: "LGA Chairman", contactType: "email", contact: "chair@lga.gov.ng" });
      }
      if (wardDetails?.councilor) {
        officials.push({ ...wardDetails.councilor, role: "Ward Councillor", term: "Current", contactType: "phone", contact: wardDetails.councilor.phone || "N/A" });
      }

      const formatCurrency = (val: number | string | null | undefined) => {
        if (!val) return "N/A";
        const num = Number(val);
        if (isNaN(num)) return val.toString();
        if (num >= 1_000_000_000_000) return `₦${(num / 1_000_000_000_000).toFixed(2)}T`;
        if (num >= 1_000_000_000) return `₦${(num / 1_000_000_000).toFixed(2)}B`;
        if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(2)}M`;
        return `₦${num.toLocaleString()}`;
      };

      const debtTotal = (Number(stateDetails.domesticDebt?.amount || 0) + Number(stateDetails.externalDebt?.amount || 0)) || null;

      const newData = {
        id: stateCode + lgaCode + wardCode,
        state: stateName,
        lga: lgaName,
        ward: wardName,
        lgaKpis: [
          {
            label: "LGA FAAC (YTD)",
            value: lgaDetails?.stats?.faac || "N/A",
            delta: "Federal allocation directly to the local government.",
          },
          {
            label: "Tracked Projects",
            value: "Coming Soon",
            delta: "Public projects currently monitored in this LGA.",
          }
        ],
        officials: officials.length > 0 ? officials : mockLocations.rivers.officials,
        kpis: [
          {
            label: "Latest Budget",
            value: stateDetails.budgetTotal || "N/A",
            delta: "How much the state plans to spend to improve your life.",
          },
          {
            label: "FAAC (YTD)",
            value: formatCurrency(stateDetails.faacYtd),
            delta: "Your state's share of the national wealth.",
          },
          {
            label: "State Debt",
            value: formatCurrency(debtTotal),
            delta: "The heavy burden of debt hanging over the state's future.",
          },
          {
            label: "Internally Generated Revenue",
            value: formatCurrency(stateDetails.igr?.total),
            delta: "How much the state is making from your taxes and levies.",
          },
          {
            label: "Recurrent Expenditure",
            value: "N/A",
            delta: "What the state pays just to keep the lights on and pay salaries.",
          },
          {
            label: "Capital Expenditure",
            value: "N/A",
            delta: "Money meant for building schools, hospitals, and roads.",
          },
        ],
        bars: mockLocations.rivers.bars,
        lineItems: mockLocations.rivers.lineItems,
      };

      setData(newData);
      setLocationState("success");
    } catch (err) {
      console.error(err);
      setLocationState("denied");
      setData(mockLocations.rivers);
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
        item.code, item.name
      );
    }
  };

  const requestLocation = () => {
    setLocationState("loading");
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (res && res.stateCode && res.lgaCode && res.wardCode) {
            await fetchFullProfile(
              res.stateCode, res.stateName || "",
              res.lgaCode, res.lgaName || "",
              res.wardCode, res.wardName || ""
            );
          } else if (res && res.stateCode && res.lgaCode) {
            // Fallback if ward is missing
            await fetchFullProfile(
              res.stateCode, res.stateName || "",
              res.lgaCode, res.lgaName || "",
              "unknown", "Unknown Ward"
            );
          } else {
            setLocationState("denied");
          }
        } catch {
          setLocationState("denied");
        }
      },
      () => {
        setLocationState("denied");
      }
    );
  };

  useEffect(() => {
    // Fetch default data immediately
    getStates().then(async (states) => {
      if (Array.isArray(states) && states.length > 0) {
        setStatesList(states);
        // Try to find Rivers, or fallback to first state
        const defaultState = states.find(s => s.name.includes("Rivers")) || states[0];
        
        const lgas = await getLgas(defaultState.code).catch(() => []);
        if (Array.isArray(lgas) && lgas.length > 0) {
          setLgasList(lgas);
          // Try to find Obio/Akpor, or fallback to first LGA
          const defaultLga = lgas.find(l => l.name.includes("Obio")) || lgas[0];
          
          const wards = await getWards(defaultLga.code).catch(() => []);
          if (Array.isArray(wards) && wards.length > 0) {
            setWardsList(wards);
            // Try to find Rumuigbo, or fallback to first Ward
            const defaultWard = wards.find(w => w.name.includes("Rumuigbo")) || wards[0];
            
            await fetchFullProfile(
              defaultState.code, defaultState.name,
              defaultLga.code, defaultLga.name,
              defaultWard.code, defaultWard.name
            );
          }
        }
      }

      // Then try to get location if permitted
      if (navigator.permissions) {
        navigator.permissions.query({ name: "geolocation" }).then((result) => {
          if (result.state === "granted") {
            requestLocation();
          } else if (result.state === "denied") {
            // Already loaded default data above, just update state
            setLocationState("success");
          }
        });
      }
    }).catch(console.error);
  }, []);

  return (
    <>
    {/* Personalization Top Bar */}
    <div className="border-y border-border/50 bg-background/95 backdrop-blur-sm relative z-30 -mt-20 lg:-mt-32">
      <KitContainer>
        {/* Top: Viewing Status */}
        <div className="flex items-center justify-between py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              You are viewing
            </span>
            <span className="font-semibold text-sm text-foreground">
              {data.state} · {data.lga} · {data.ward}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Location Selector */}
            <div className="relative">
              <button 
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setDateDropdownOpen(false);
                }}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50"
              >
                Change <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/10 z-50 overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="p-3 border-b border-border/50 flex items-center gap-2 bg-muted/30">
                    {selectorStep !== "state" && (
                      <button 
                        onClick={() => {
                          setSelectorStep(selectorStep === "ward" ? "lga" : "state");
                          setSearchQuery("");
                        }} 
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
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
                  <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
                    {getListItems().map(item => (
                      <button
                        key={item.code}
                        onClick={() => handleLocationSelect(item)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 text-foreground"
                      >
                        {item.name}
                        {selectorStep !== "ward" && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
                        {selectorStep === "ward" && data.ward === item.name && data.lga === pendingSelection.lgaName && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                      </button>
                    ))}
                    {getListItems().length === 0 && (
                      <div className="py-8 text-center text-sm text-muted-foreground">No results found.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Date Selector */}
            <div className="relative">
              <button 
                onClick={() => {
                  setDateDropdownOpen(!dateDropdownOpen);
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50"
              >
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {selectedMonth} {selectedYear} <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              
              {dateDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border/60 bg-card p-2 shadow-xl shadow-black/10 z-50 flex gap-2">
                  <div className="flex-1 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
                    <div className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2 pt-1">Month</div>
                    {months.map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedMonth(m)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                          selectedMonth === m ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium" : "hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="w-px bg-border/50" />
                  <div className="flex-1 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
                    <div className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2 pt-1">Year</div>
                    {years.map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          setSelectedYear(y);
                          setDateDropdownOpen(false);
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
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 py-6 gap-y-6">
          <div className="flex flex-col md:border-r border-border/50 px-4 md:px-6 first:pl-0">
            <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">States covered</span>
            <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">36</span>
          </div>
          <div className="flex flex-col md:border-r border-border/50 px-4 md:px-6">
            <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">LGA Covered</span>
            <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">774</span>
          </div>
          <div className="flex flex-col md:border-r border-border/50 px-4 md:px-6">
            <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Budgets/FAAC years covered</span>
            <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">2019-24</span>
          </div>
          <div className="flex flex-col px-4 md:px-6">
            <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Wards Covered</span>
            <span className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-400">8,809</span>
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
          
          {locationState === "idle" && (
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={requestLocation}
                className="h-12 rounded-2xl bg-emerald-600 px-7 text-base font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Use my current location
              </Button>
            </div>
          )}

          {locationState === "loading" && (
            <div className="mt-8 flex justify-center items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span className="text-sm font-medium">Locating your ward...</span>
            </div>
          )}

          {locationState === "denied" && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-900">
                Location access denied. Showing default data for Lagos.
              </p>
              <Button 
                variant="outline" 
                onClick={requestLocation}
                className="mt-2 h-10 rounded-xl px-5 text-sm"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Try again
              </Button>
            </div>
          )}
        </div>

        <div className="mx-auto max-w-5xl transition-all duration-500 ease-in-out">
          <div className="grid items-start gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5 flex flex-col gap-16">
              {/* LGA Financials */}
              <div className="rounded-[1.75rem] border border-border/60 bg-gradient-to-b from-card to-card/40 p-6 shadow-xl shadow-black/5 backdrop-blur-md">
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
                  {data.lgaKpis.map((kpi: any) => (
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

              {/* Officials */}
              <div className="rounded-[1.75rem] border border-border/60 bg-card/50 p-6 shadow-xl shadow-black/5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold">
                    Know Your Leaders
                  </h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    {data.ward}
                  </span>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
                  {data.officials.map((official: any) => (
                    <Link 
                      href={`/officials/${official.id}`}
                      key={official.role} 
                      className="group flex items-start gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0 transition-colors hover:bg-muted/20 rounded-xl p-2 -mx-2"
                    >
                      <img 
                        src={official.image} 
                        alt={official.name} 
                        className="h-11 w-11 shrink-0 rounded-full object-cover bg-emerald-100 dark:bg-emerald-900/50 transition-transform group-hover:scale-105" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{official.name}</p>
                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                            {official.party}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate mt-0.5">
                          {official.role}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> 
                            {official.term}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {official.contactType === "phone" && <Phone className="h-3 w-3" />}
                            {official.contactType === "email" && <Mail className="h-3 w-3" />}
                            {official.contactType === "social" && <AtSign className="h-3 w-3" />}
                            {official.contact}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
              <KitDashboardMock
                title={`${data.state} snapshot`}
                region={`${data.lga} · ${data.ward}`}
                kpis={data.kpis}
                bars={data.bars}
                hideBadge
              />
            </div>
          </div>
        </div>
      </KitContainer>
    </section>

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
    <Methodology />
    <FaqAndTestimonials />
    </>
  );
}

// --- V2 Follow the Naira Components ---
function FlowCanvas({ active, stops }: { active: number; stops: any[] }) {
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
    { label: "All LGs", pct: 20.60, color: "bg-violet-600 dark:bg-violet-500" },
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

function StateBreakdown({ loc }: { loc: any }) {
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
        {loc.derivation && (
          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50">
            <strong>+ 13% derivation</strong> — oil-producing state bonus
          </div>
        )}
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
            <span className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
              ✓
            </span>
            <span className="text-xs text-foreground">{o.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LgLineItems({ data }: { data: any }) {
  return (
    <section className="py-12 lg:py-16 relative">
      <KitContainer>
        <div className="mb-10">
          <KitSectionTitle
            kicker="LGA BUDGET"
            title={`What's in the budget for ${data.lga}`}
            subtitle={`Approved capital projects and line items for ${data.lga}. Pulled from published state and LG budgets.`}
          />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-2/3">Line Item</th>
                  <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sector</th>
                  <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Budgeted Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.lineItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-5 font-medium text-foreground whitespace-normal min-w-[300px]">{item.title}</td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-[family-name:var(--font-mono)] font-bold uppercase tracking-wider bg-muted/50 text-muted-foreground border border-border/50">
                        {item.sector}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-[family-name:var(--font-mono)] font-semibold text-emerald-600 dark:text-emerald-400 text-right text-base">{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <p className="mt-4 text-xs text-muted-foreground">
          Sourced from official budget documents. Think something's off? <button onClick={() => window.dispatchEvent(new CustomEvent("open-feedback", { detail: { category: "data_issue" } }))} className="text-emerald-600 dark:text-emerald-400 font-medium underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">Flag it — we re-verify.</button>
        </p>
      </KitContainer>
    </section>
  );
}

function NeighbourComparison({ data }: { data: any }) {
  const getNeighbours = (stateName: string) => {
    if (stateName.includes("Rivers")) {
      return [
        { state: "Bayelsa", budget: "₦598B", faac: "₦23.1B", debt: "₦178B", igr: "₦18.2B" },
        { state: "Abia", budget: "₦567B", faac: "₦19.4B", debt: "₦142B", igr: "₦20.0B" },
        { state: "Akwa Ibom", budget: "₦1.18T", faac: "₦42.0B", debt: "₦303B", igr: "₦35.5B" },
      ];
    }
    if (stateName.includes("Lagos")) {
      return [
        { state: "Ogun", budget: "₦553B", faac: "₦18.5B", debt: "₦293B", igr: "₦146B" },
      ];
    }
    if (stateName.includes("Kano")) {
      return [
        { state: "Katsina", budget: "₦434B", faac: "₦24.2B", debt: "₦130B", igr: "₦13.5B" },
        { state: "Jigawa", budget: "₦298B", faac: "₦21.5B", debt: "₦110B", igr: "₦10.2B" },
        { state: "Kaduna", budget: "₦458B", faac: "₦26.8B", debt: "₦180B", igr: "₦15.8B" },
        { state: "Bauchi", budget: "₦398B", faac: "₦22.1B", debt: "₦145B", igr: "₦12.4B" },
      ];
    }
    return [];
  };

  const neighbours = getNeighbours(data.state);
  
  // Extract values from the main state data
  const stateBudget = data.kpis.find((k: any) => k.label.includes('Budget'))?.value || "₦0B";
  const stateFaac = data.kpis.find((k: any) => k.label.includes('FAAC'))?.value || "₦0B";
  const stateDebt = data.kpis.find((k: any) => k.label.includes('Debt'))?.value || "₦0B";
  const stateIgr = data.kpis.find((k: any) => k.label.includes('Revenue'))?.value || "₦0B";

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

        <div className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">State</th>
                  <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Budget 2025</th>
                  <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">FAAC (Month)</th>
                  <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Debt</th>
                  <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">IGR 2024</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {/* Main State Row */}
                <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                  <td className="px-6 py-5 font-bold text-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {data.state}
                  </td>
                  <td className="px-6 py-5 font-[family-name:var(--font-mono)] font-semibold text-foreground">{stateBudget}</td>
                  <td className="px-6 py-5 font-[family-name:var(--font-mono)] font-semibold text-foreground">{stateFaac}</td>
                  <td className="px-6 py-5 font-[family-name:var(--font-mono)] font-semibold text-red-600 dark:text-red-400">{stateDebt}</td>
                  <td className="px-6 py-5 font-[family-name:var(--font-mono)] font-semibold text-emerald-600 dark:text-emerald-400">{stateIgr}</td>
                </tr>
                
                {/* Neighbour Rows */}
                {neighbours.map((n, idx) => (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-5 font-medium text-foreground pl-9">{n.state}</td>
                    <td className="px-6 py-5 font-[family-name:var(--font-mono)] font-semibold text-muted-foreground">{n.budget}</td>
                    <td className="px-6 py-5 font-[family-name:var(--font-mono)] font-semibold text-muted-foreground">{n.faac}</td>
                    <td className="px-6 py-5 font-[family-name:var(--font-mono)] font-semibold text-red-600/70 dark:text-red-400/70">{n.debt}</td>
                    <td className="px-6 py-5 font-[family-name:var(--font-mono)] font-semibold text-emerald-600/70 dark:text-emerald-400/70">{n.igr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </KitContainer>
    </section>
  );
}

function TakeAction({ data }: { data: any }) {
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
              Report what isn't working
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
          <div className="group relative overflow-hidden rounded-[2rem] border border-violet-200/60 bg-gradient-to-b from-violet-50/80 to-violet-100/50 dark:border-violet-900/30 dark:from-violet-950/20 dark:to-violet-900/10 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-200/50 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400 transition-transform group-hover:scale-110">
              <Users className="h-6 w-6" />
            </div>
            <div className="mb-3 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-violet-700/80 dark:text-violet-400/80">
              Join a circle
            </div>
            <h3 className="mb-4 font-[family-name:var(--font-heading)] text-2xl font-bold text-violet-950 dark:text-violet-100 leading-tight">
              Join others in your ward
            </h3>
            <p className="mb-8 text-[15px] leading-relaxed text-violet-900/80 dark:text-violet-200/70">
              148 neighbours in {data.ward} are already tracking these projects — join the circle.
            </p>
            <Button className="w-full sm:w-auto rounded-xl bg-violet-700 text-white hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-700 shadow-sm transition-all group-hover:pr-6 relative overflow-hidden">
              <span className="relative z-10 flex items-center">
                Join circle <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
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
                    onClick={() => setOpenIndex(openIndex === i ? null : i)} 
                    className="flex w-full items-center justify-between text-left group"
                  >
                    <span className="font-semibold text-lg text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {faq.q}
                    </span>
                    {openIndex === i ? (
                      <Minus className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
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
                  <p className="text-foreground leading-relaxed text-lg font-medium">"{t.quote}"</p>
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

function FollowTheNaira({ data }: { data: any }) {
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

  const SAMPLE_COMPACT = { 
    purse: "₦1.35T", 
    states: "₦361B", 
    state: data.kpis.find((k: any) => k.label.includes('FAAC'))?.value || "₦32.5B", 
    lg: data.lgaKpis[0]?.value || "₦620.5M", 
    ward: "???" 
  };

  const stops = [
    { label: "FAAC POT", sub: "Federation Account", amt: SAMPLE_COMPACT.purse },
    { label: "FIRST SPLIT", sub: "Fed · States · LGs", amt: SAMPLE_COMPACT.states },
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
      desc: "For net Federation Account revenue, FAAC shares money among the Federal Government (52.68%), states (26.72%), and local governments (20.60%). Separate rules apply to VAT and derivation.",
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

  const loc = { name: data.state, lga: data.lga, ward: data.ward, derivation: true };

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
                STOP {s.id} / 05
              </span>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-[family-name:var(--font-heading)] font-bold mb-3 text-foreground leading-tight">
              {s.title}
            </h3>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {s.desc}
            </p>

            {/* Step-specific inline illustration */}
            {i === 1 && <SplitPreview />}
            {i === 2 && <StateBreakdown loc={loc} />}
            {i === 4 && <WardOutcomes ward={loc.ward} />}

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
