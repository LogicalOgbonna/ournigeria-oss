"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, ChevronLeft, Loader2, Search, LocateFixed, XCircle } from "lucide-react";
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
type DetectStatus = "idle" | "detecting" | "denied" | "failed";

export function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const [step, setStep] = useState<Step>("state");
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const [lgas, setLgas] = useState<{ code: string; name: string }[]>([]);
  const [wards, setWards] = useState<{ code: string; name: string }[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [search, setSearch] = useState("");

  const [pickedState, setPickedState] = useState<{ code: string; name: string } | null>(null);
  const [pickedLga, setPickedLga] = useState<{ code: string; name: string } | null>(null);

  const [detectStatus, setDetectStatus] = useState<DetectStatus>("idle");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setLoadingItems(true);
    getStates()
      .then((data) => { if (mountedRef.current) setStates(data); })
      .catch(console.error)
      .finally(() => { if (mountedRef.current) setLoadingItems(false); });
    tryGeolocate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function tryGeolocate() {
    if (!navigator.geolocation) {
      setDetectStatus("failed");
      return;
    }

    setDetectStatus("detecting");

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      );

      if (!mountedRef.current) return;

      const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);

      if (!mountedRef.current) return;

      if (result.stateCode && result.stateName) {
        const state = { code: result.stateCode, name: result.stateName };
        setPickedState(state);

        if (result.lgaCode && result.lgaName && result.wardCode && result.wardName) {
          setDetectStatus("idle");
          onLocationSelect({
            stateCode: state.code,
            stateName: state.name,
            lgaCode: result.lgaCode,
            lgaName: result.lgaName,
            wardCode: result.wardCode,
            wardName: result.wardName,
          });
          return;
        }

        if (result.lgaCode && result.lgaName) {
          const lga = { code: result.lgaCode, name: result.lgaName };
          setPickedLga(lga);
          setStep("ward");
          setDetectStatus("idle");
          setLoadingItems(true);
          getWards(lga.code)
            .then((data) => { if (mountedRef.current) setWards(data); })
            .catch(console.error)
            .finally(() => { if (mountedRef.current) setLoadingItems(false); });
          return;
        }

        setStep("lga");
        setDetectStatus("idle");
        setLoadingItems(true);
        getLgas(state.code)
          .then((data) => { if (mountedRef.current) setLgas(data); })
          .catch(console.error)
          .finally(() => { if (mountedRef.current) setLoadingItems(false); });
        return;
      }

      setDetectStatus("failed");
    } catch (err) {
      if (!mountedRef.current) return;
      const isPermissionDenied =
        err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED;
      setDetectStatus(isPermissionDenied ? "denied" : "failed");
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

  const filterBySearch = (items: { code: string; name: string }[]) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  };

  if (detectStatus === "detecting") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Detecting your location...</p>
          <p className="text-xs text-slate-400 mt-1">Please allow location access when prompted</p>
        </div>
        <button
          onClick={() => setDetectStatus("idle")}
          className="mt-1 text-xs text-slate-400 hover:text-emerald-600 transition-colors"
        >
          Choose manually instead
        </button>
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
      {/* Location denied/failed banner */}
      {(detectStatus === "denied" || detectStatus === "failed") && step === "state" && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
          {detectStatus === "denied" ? (
            <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <LocateFixed className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {detectStatus === "denied"
              ? "Location access denied. Select your state below."
              : "Couldn\u2019t detect your location. Select your state below."}
          </p>
        </div>
      )}

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
      )}
    </div>
  );
}
