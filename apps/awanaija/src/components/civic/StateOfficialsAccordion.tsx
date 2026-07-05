"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Users, ArrowUpRight } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";

interface Rep {
  id: string;
  slug?: string | null;
  name: string;
  party: string;
  image?: string | null;
}

interface ConstituencyItem {
  code: string;
  name: string;
  representative: Rep | null;
}

interface StateOfficialsAccordionProps {
  constituencies: {
    senatorial: ConstituencyItem[];
    federal: ConstituencyItem[];
    state: ConstituencyItem[];
  };
}

type SectionKey = "senatorial" | "federal" | "state";

const SECTIONS: { key: SectionKey; label: string; unit: string; repRole: string }[] = [
  { key: "senatorial", label: "Senatorial Districts", unit: "district", repRole: "Senator" },
  { key: "federal", label: "Federal Constituencies", unit: "constituency", repRole: "Representative" },
  { key: "state", label: "State Constituencies", unit: "constituency", repRole: "State Assembly Member" },
];

export function StateOfficialsAccordion({ constituencies }: StateOfficialsAccordionProps) {
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    senatorial: false,
    federal: false,
    state: false,
  });

  const toggle = (key: SectionKey) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  const renderConstituency = (c: ConstituencyItem, repRole: string) => (
    <div key={c.code} className="bg-card border border-border rounded-[10px] p-3 space-y-2">
      {/* Link at the top to visit the constituency page */}
      <Link
        href={`/constituencies/${c.code}`}
        className="group flex items-center justify-between gap-2"
      >
        <span className="font-heading text-sm font-semibold truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {c.name}
        </span>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 shrink-0 transition-colors" />
      </Link>

      {/* Representative in the same card */}
      {c.representative ? (
        <Link
          href={`/officials/${c.representative.slug ?? c.representative.id}`}
          className="flex items-center gap-3 p-2 -m-1 hover:bg-muted/50 rounded-md transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            <OfficialAvatar
              src={c.representative.image}
              alt={c.representative.name}
              px={36}
              imgClassName="w-full h-full object-cover"
              fallback={<Users className="w-4 h-4 text-muted-foreground" />}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-sm font-medium truncate">{c.representative.name}</p>
            <div className="flex items-center gap-2 text-[10px] font-sans text-muted-foreground truncate">
              <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium shrink-0">
                {c.representative.party}
              </span>
              <span className="truncate">{repRole}</span>
            </div>
          </div>
        </Link>
      ) : (
        <p className="px-2 py-1.5 text-xs text-muted-foreground italic">
          {repRole} not yet identified
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {SECTIONS.map(({ key, label, unit, repRole }) => {
        const items = constituencies?.[key] ?? [];
        const isOpen = open[key];
        return (
          <div key={key} className="bg-card border border-border rounded-[10px] overflow-hidden">
            <button
              onClick={() => toggle(key)}
              className="w-full p-4 flex items-center justify-between group hover:border-emerald-500/50 transition-colors text-left"
            >
              <div className="space-y-1">
                <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {label}
                </p>
                <p className="font-heading text-sm font-medium">
                  {items.length} {items.length === 1 ? unit : `${unit === "constituency" ? "constituencies" : unit + "s"}`}
                </p>
              </div>
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-emerald-500 transition-colors" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
              )}
            </button>

            {isOpen && (
              <div className="border-t border-border p-2 space-y-2 max-h-[360px] overflow-y-auto scrollbar-theme">
                {items.length > 0 ? (
                  items.map((c) => renderConstituency(c, repRole))
                ) : (
                  <p className="p-4 text-sm text-center text-muted-foreground">
                    No {label.toLowerCase()} found.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
