"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, X, ChevronRight, List } from "lucide-react";
import { reverseGeocode, getStates, getLgas } from "@/lib/api";

const STORAGE_KEY = "ournigeria_welcomed";

type Phase = "welcome" | "detecting" | "manual_state" | "manual_lga";

export function WelcomeModal() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const [lgas, setLgas] = useState<{ code: string; name: string }[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [search, setSearch] = useState("");
  const [pickedState, setPickedState] = useState<{ code: string; name: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  function navigateToLocation(state: string, lga?: string) {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
    const params = new URLSearchParams({ state });
    if (lga) params.set("lga", lga);
    router.push(`/representatives?${params.toString()}`);
  }

  async function handleAllowLocation() {
    if (!navigator.geolocation) {
      showManualPicker();
      return;
    }
    setPhase("detecting");
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      );
      const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (result.stateCode) {
        navigateToLocation(result.stateCode, result.lgaCode || undefined);
      } else {
        showManualPicker();
      }
    } catch {
      showManualPicker();
    }
  }

  async function showManualPicker() {
    setPhase("manual_state");
    setSearch("");
    setLoadingItems(true);
    try {
      const data = await getStates();
      setStates(data);
    } catch (err) {
      console.error("Failed to load states:", err);
    } finally {
      setLoadingItems(false);
    }
  }

  async function handleSelectState(s: { code: string; name: string }) {
    setPickedState(s);
    setPhase("manual_lga");
    setSearch("");
    setLoadingItems(true);
    try {
      const data = await getLgas(s.code);
      setLgas(data);
    } catch (err) {
      console.error("Failed to load LGAs:", err);
    } finally {
      setLoadingItems(false);
    }
  }

  function handleSelectLga(l: { code: string; name: string }) {
    navigateToLocation(pickedState!.code, l.code);
  }

  if (!show) return null;

  const filtered = (items: { code: string; name: string }[]) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>

        {/* Welcome phase */}
        {phase === "welcome" && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading mb-2">
              Know Who Governs You
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
              Find out who your governor, senator, representative, and local council chair are — from your ward to the national level.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleAllowLocation}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Use my location
              </button>
              <button
                onClick={showManualPicker}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-xl transition-colors"
              >
                <List className="w-4 h-4" />
                Choose manually
              </button>
            </div>

            <button
              onClick={dismiss}
              className="mt-4 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Detecting phase */}
        {phase === "detecting" && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading mb-2">
              Detecting your location...
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please allow location access when prompted by your browser.
            </p>
          </div>
        )}

        {/* Manual state selection */}
        {phase === "manual_state" && (
          <div className="p-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading mb-1">
              Select your state
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              We&apos;ll show you who represents your area.
            </p>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search states..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 mb-3"
            />

            {loadingItems ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
                {filtered(states).map((s) => (
                  <button
                    key={s.code}
                    onClick={() => handleSelectState(s)}
                    className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all text-left"
                  >
                    <span className="truncate">{s.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual LGA selection */}
        {phase === "manual_lga" && (
          <div className="p-5">
            <button
              onClick={() => { setPhase("manual_state"); setSearch(""); }}
              className="text-xs text-emerald-600 hover:underline mb-2 inline-block"
            >
              &larr; Back to states
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading mb-1">
              Select your LGA
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              {pickedState?.name} &mdash; choose your local government area.
            </p>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search LGAs..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 mb-3"
            />

            {loadingItems ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
                  {filtered(lgas).map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleSelectLga(l)}
                      className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all text-left"
                    >
                      <span className="truncate">{l.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigateToLocation(pickedState!.code)}
                  className="mt-3 w-full text-center text-sm text-slate-500 hover:text-emerald-600 py-2 transition-colors"
                >
                  Skip, show state-level officials only
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
