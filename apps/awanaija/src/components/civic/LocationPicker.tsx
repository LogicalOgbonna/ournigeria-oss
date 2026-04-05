"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronLeft, Loader2, Search } from "lucide-react";
import { getStates, getLgas, getWards, reverseGeocode } from "@/lib/api";

interface LocationPickerProps {
  onLocationSelect: (location: {
    stateCode: string;
    stateName: string;
    lgaCode?: string;
    lgaName?: string;
    wardCode?: string;
    wardName?: string;
  }) => void;
}

type Step = "state" | "lga" | "ward";

export function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const [step, setStep] = useState<Step>("state");
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const [lgas, setLgas] = useState<{ code: string; name: string }[]>([]);
  const [wards, setWards] = useState<{ code: string; name: string }[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [search, setSearch] = useState("");

  const [pickedState, setPickedState] = useState<{ code: string; name: string } | null>(null);
  const [pickedLga, setPickedLga] = useState<{ code: string; name: string } | null>(null);

  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    setLoadingItems(true);
    getStates()
      .then(setStates)
      .catch(console.error)
      .finally(() => setLoadingItems(false));
    tryGeolocate();
  }, []);

  async function tryGeolocate() {
    if (!navigator.geolocation) return;
    setDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      );
      const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (result.stateCode) {
        const state = { code: result.stateCode, name: result.stateName || "" };
        setPickedState(state);

        if (result.lgaCode && result.lgaName && result.wardCode && result.wardName) {
          // Full location resolved — submit directly
          onLocationSelect({
            stateCode: state.code,
            stateName: state.name,
            lgaCode: result.lgaCode,
            lgaName: result.lgaName,
            wardCode: result.wardCode,
            wardName: result.wardName,
          });
        } else if (result.lgaCode && result.lgaName) {
          // State + LGA resolved — move to ward step
          const lga = { code: result.lgaCode, name: result.lgaName };
          setPickedLga(lga);
          setStep("ward");
          setLoadingItems(true);
          getWards(lga.code)
            .then(setWards)
            .catch(console.error)
            .finally(() => setLoadingItems(false));
        } else {
          // Only state resolved — move to LGA step
          setStep("lga");
          setLoadingItems(true);
          getLgas(state.code)
            .then(setLgas)
            .catch(console.error)
            .finally(() => setLoadingItems(false));
        }
      }
    } catch {
      // User denied or failed, show manual picker
    } finally {
      setDetecting(false);
    }
  }

  function handleSelectState(s: { code: string; name: string }) {
    setPickedState(s);
    setPickedLga(null);
    setStep("lga");
    setSearch("");
    setLoadingItems(true);
    getLgas(s.code)
      .then(setLgas)
      .catch(console.error)
      .finally(() => setLoadingItems(false));
  }

  function handleSelectLga(l: { code: string; name: string }) {
    setPickedLga(l);
    setStep("ward");
    setSearch("");
    setLoadingItems(true);
    getWards(l.code)
      .then(setWards)
      .catch(console.error)
      .finally(() => setLoadingItems(false));
  }

  function handleSelectWard(w: { code: string; name: string }) {
    onLocationSelect({
      stateCode: pickedState!.code,
      stateName: pickedState!.name,
      lgaCode: pickedLga!.code,
      lgaName: pickedLga!.name,
      wardCode: w.code,
      wardName: w.name,
    });
  }

  function handleBack() {
    setSearch("");
    if (step === "ward") {
      setStep("lga");
      setPickedLga(null);
    } else if (step === "lga") {
      setStep("state");
      setPickedState(null);
    }
  }

  // Filter items by search
  const filterBySearch = (items: { code: string; name: string }[]) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  };

  if (detecting) {
    return (
      <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Detecting your location...</span>
      </div>
    );
  }

  const stepLabel = step === "state" ? "Select your state" : step === "lga" ? "Select your LGA" : "Select your ward";
  const breadcrumb = [pickedState?.name, pickedLga?.name].filter(Boolean).join(" \u203a ");
  const currentItems =
    step === "state" ? filterBySearch(states) :
    step === "lga" ? filterBySearch(lgas) :
    filterBySearch(wards);

  return (
    <div>
      {/* Header with back button and breadcrumb */}
      <div className="flex items-center gap-2 mb-3">
        {step !== "state" && (
          <button
            onClick={handleBack}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {stepLabel}
          </p>
          {breadcrumb && (
            <p className="text-xs text-slate-400 truncate">{breadcrumb}</p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${step === "state" ? "states" : step === "lga" ? "LGAs" : "wards"}...`}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
        />
      </div>

      {/* Card grid */}
      {loadingItems ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">
          {search ? "No results found" : "No items available"}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[45vh] overflow-y-auto">
            {currentItems.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  if (step === "state") handleSelectState(item);
                  else if (step === "lga") handleSelectLga(item);
                  else handleSelectWard(item);
                }}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all text-left active:scale-[0.98]"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>

        </>
      )}
    </div>
  );
}
