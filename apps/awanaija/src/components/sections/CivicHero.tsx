"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { LocationPicker } from "@/components/civic/LocationPicker";
import { Leaderboard } from "@/components/civic/Leaderboard";
import { ActivityFeed } from "@/components/civic/ActivityFeed";

export function CivicHero() {
  const router = useRouter();

  function handleLocationSelect(location: {
    stateCode: string;
    stateName: string;
    lgaCode?: string;
    lgaName?: string;
    wardCode?: string;
    wardName?: string;
  }) {
    const params = new URLSearchParams({ state: location.stateCode });
    if (location.lgaCode) params.set("lga", location.lgaCode);
    if (location.wardCode) params.set("ward", location.wardCode);
    router.push(`/representatives?${params.toString()}`);
  }

  return (
    <section className="py-16 md:py-24 bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)]">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero content */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Find your government
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white font-heading mb-4">
            Who Governs You?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            See every official from your ward councilor to the governor.
            Help fill in the missing data.
          </p>
        </div>

        {/* Location picker */}
        <div className="max-w-xl mx-auto mb-16">
          <LocationPicker onLocationSelect={handleLocationSelect} />
        </div>

        {/* Two-column: Leaderboard + Activity */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Leaderboard */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                State Completeness
              </h3>
              <a
                href="/leaderboard"
                className="text-xs text-emerald-600 hover:underline"
              >
                See all →
              </a>
            </div>
            <Leaderboard limit={10} />
          </div>

          {/* Activity feed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Recent Activity
              </h3>
              <a
                href="/activity"
                className="text-xs text-emerald-600 hover:underline"
              >
                See all →
              </a>
            </div>
            <ActivityFeed limit={5} />
          </div>
        </div>
      </div>
    </section>
  );
}
