"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const MONTH_LABELS: Record<number, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

interface Props {
  availableYears: number[];
  monthsByYear: Record<number, number[]>;
}

export function StateEconomyFilter({ availableYears, monthsByYear }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didAutoSelect = useRef(false);

  const currentYear = searchParams.get("year") || "";
  const currentMonth = searchParams.get("month") || "";

  const availableMonths = currentYear ? (monthsByYear[Number(currentYear)] || []) : [];

  const setParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(pathname + "?" + params.toString(), { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    if (!newYear) {
      setParams({ year: "", month: "" });
      return;
    }
    const months = monthsByYear[Number(newYear)] || [];
    const defaultMonth = months.length > 0 ? String(months[months.length - 1]) : "";
    setParams({ year: newYear, month: defaultMonth });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParams({ month: e.target.value });
  };

  return (
    <div className="flex gap-2 mb-4">
      <select
        value={currentYear}
        onChange={handleYearChange}
        className="bg-card border border-border rounded-md px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="">All Years</option>
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <select
        value={currentMonth}
        onChange={handleMonthChange}
        disabled={!currentYear}
        className="bg-card border border-border rounded-md px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">All Months</option>
        {availableMonths.map((m) => (
          <option key={m} value={m}>
            {MONTH_LABELS[m]}
          </option>
        ))}
      </select>
    </div>
  );
}
