"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Users } from "lucide-react";

interface Official {
  id: string;
  name: string;
  party: string;
  constituency: string;
  image?: string | null;
}

interface StateOfficialsAccordionProps {
  stateCode: string;
  stats: {
    senators: number;
    houseMembers: number;
    stateAssembly: number;
  };
  officials: {
    senators: Official[];
    houseMembers: Official[];
    stateAssembly: Official[];
  };
}

export function StateOfficialsAccordion({ stateCode, stats, officials }: StateOfficialsAccordionProps) {
  const [openSection, setOpenSection] = useState<"national" | "state" | null>(null);

  const toggleSection = (section: "national" | "state") => {
    setOpenSection(openSection === section ? null : section);
  };

  const renderOfficial = (official: Official, roleTitle: string) => (
    <Link
      key={official.id}
      href={`/officials/${official.id}`}
      className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-md transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {official.image ? (
          <img src={official.image} alt={official.name} className="w-full h-full object-cover" />
        ) : (
          <Users className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading text-sm font-semibold truncate">{official.name}</p>
        <div className="flex items-center gap-2 text-[10px] font-sans text-muted-foreground truncate">
          <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium shrink-0">
            {official.party}
          </span>
          <span className="truncate">{roleTitle} • {official.constituency}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-4">
      {/* National Assembly */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <button
          onClick={() => toggleSection("national")}
          className="w-full p-4 flex items-center justify-between group hover:border-emerald-500/50 transition-colors text-left"
        >
          <div className="space-y-1">
            <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              National Assembly
            </p>
            <p className="font-heading text-sm font-medium">
              {stats?.senators || 0} Senators
            </p>
            <p className="font-heading text-sm font-medium">
              {stats?.houseMembers || 0} House Members
            </p>
          </div>
          {openSection === "national" ? (
            <ChevronDown className="w-5 h-5 text-emerald-500 transition-colors" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
          )}
        </button>

        {openSection === "national" && (
          <div className="border-t border-border p-2 space-y-1 max-h-[300px] overflow-y-auto scrollbar-theme">
            {officials?.senators?.length > 0 && (
              <div className="mb-2">
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Senators</p>
                {officials.senators.map(official => renderOfficial(official, "Senator"))}
              </div>
            )}
            {officials?.houseMembers?.length > 0 && (
              <div>
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">House Members</p>
                {officials.houseMembers.map(official => renderOfficial(official, "Rep"))}
              </div>
            )}
            {(!officials?.senators?.length && !officials?.houseMembers?.length) && (
              <p className="p-4 text-sm text-center text-muted-foreground">No National Assembly members found.</p>
            )}
            <div className="p-2">
              <Link href={`/officials?state=${stateCode}&role=national_assembly`} className="block text-center text-xs font-medium text-emerald-600 hover:text-emerald-700 py-2">
                View all National Assembly members →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* State Assembly */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <button
          onClick={() => toggleSection("state")}
          className="w-full p-4 flex items-center justify-between group hover:border-emerald-500/50 transition-colors text-left"
        >
          <div className="space-y-1">
            <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              State Assembly
            </p>
            <p className="font-heading text-sm font-medium">
              {stats?.stateAssembly || 0} Members
            </p>
          </div>
          {openSection === "state" ? (
            <ChevronDown className="w-5 h-5 text-emerald-500 transition-colors" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
          )}
        </button>

        {openSection === "state" && (
          <div className="border-t border-border p-2 space-y-1 max-h-[300px] overflow-y-auto scrollbar-theme">
            {officials?.stateAssembly?.length > 0 ? (
              officials.stateAssembly.map(official => renderOfficial(official, "Member"))
            ) : (
              <p className="p-4 text-sm text-center text-muted-foreground">No State Assembly members found.</p>
            )}
            <div className="p-2">
              <Link href={`/officials?state=${stateCode}&role=state_assembly`} className="block text-center text-xs font-medium text-emerald-600 hover:text-emerald-700 py-2">
                View all State Assembly members →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
