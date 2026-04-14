"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Users } from "lucide-react";

interface Councilor {
  id: string;
  name: string;
  party: string;
  ward: string;
  leadershipRole?: string | null;
  image?: string | null;
}

interface LgaOfficialsAccordionProps {
  councilors: Councilor[];
  wardCount: number;
}

export function LgaOfficialsAccordion({ councilors, wardCount }: LgaOfficialsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
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

      {isOpen && councilors && councilors.length > 0 && (
        <div className="border-t border-border p-2 space-y-1 max-h-[300px] overflow-y-auto scrollbar-theme">
          {councilors.map((councilor, i) => (
            <Link
              key={i}
              href={`/officials/${councilor.id}`}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
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
          ))}
        </div>
      )}
    </div>
  );
}
