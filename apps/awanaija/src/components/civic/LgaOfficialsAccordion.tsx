"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Users, X } from "lucide-react";

interface Councilor {
  id: string;
  name: string;
  party: string;
  ward: string;
  leadershipRole?: string | null;
  image?: string | null;
}

interface Ward {
  code: string;
  name: string;
}

interface LgaOfficialsAccordionProps {
  councilors: Councilor[];
  wardCount: number;
  wards: Ward[];
  lgaCode: string;
  lgaName: string;
  stateCode: string;
  stateName: string;
}

export function LgaOfficialsAccordion({ councilors, wardCount, wards, lgaCode, lgaName, stateCode, stateName }: LgaOfficialsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-4 flex items-center justify-between group hover:border-emerald-500/50 transition-colors text-left"
        >
          <div className="space-y-1">
            <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Legislative Council
            </p>
            <p className="font-heading text-sm font-medium">
              {councilors?.length || wardCount} Councilors
            </p>
          </div>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-emerald-500 transition-colors" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
          )}
        </button>

        {isOpen && (
          <div className="border-t border-border p-2 space-y-1 max-h-[300px] overflow-y-auto scrollbar-theme">
            {councilors && councilors.length > 0 ? (
              councilors.map((councilor, i) => (
                <Link
                  key={i}
                  href={`/officials/${councilor.id}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                    {councilor.image ? (
                      <img src={councilor.image} alt={councilor.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {councilor.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      {councilor.leadershipRole ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{councilor.leadershipRole}</span>
                      ) : (
                        <span>{councilor.ward}</span>
                      )}
                      <span>•</span>
                      <span>{councilor.party}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  We don't have data for the {wardCount} councilors in this LGA yet.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-primary-foreground hover:bg-emerald-600/90 h-9 px-4 py-2"
                >
                  Help us identify them
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-[10px] shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-heading text-lg font-semibold">Select a Ward</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto scrollbar-theme flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                Which ward would you like to submit information for?
              </p>
              <div className="space-y-2">
                {wards.map((ward) => (
                  <Link
                    key={ward.code}
                    href={`/proposals/new?role=councilor&stateCode=${stateCode}&stateName=${encodeURIComponent(stateName)}&lgaCode=${lgaCode}&lgaName=${encodeURIComponent(lgaName)}&wardCode=${ward.code}&wardName=${encodeURIComponent(ward.name)}`}
                    className="block p-3 rounded-md border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {ward.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
