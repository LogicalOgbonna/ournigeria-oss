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

  useEffect(() => {
    if (didAutoSelect.current) return;
    if (currentYear && currentMonth) return;
    if (availableYears.length === 0) return;
    didAutoSelect.current = true;

    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth() + 1;

    let bestYear: number | undefined;
    if (currentYear && availableYears.includes(Number(currentYear))) {
      bestYear = Number(currentYear);
    } else if (availableYears.includes(nowYear)) {
      bestYear = nowYear;
    } else {
      bestYear = availableYears[0];
    }

    if (!bestYear) return;

    const months = monthsByYear[bestYear] || [];
    if (months.length === 0) return;

    let bestMonth: number;
    if (currentMonth && months.includes(Number(currentMonth))) {
      bestMonth = Number(currentMonth);
    } else {
      const nearestInYear = bestYear === nowYear
        ? months.filter((m) => m <= nowMonth)
        : months;
      bestMonth = nearestInYear.length > 0
        ? nearestInYear[nearestInYear.length - 1]
        : months[months.length - 1];
    }

    const updates: Record<string, string> = {};
    if (!currentYear) updates.year = String(bestYear);
    if (!currentMonth) updates.month = String(bestMonth);
    if (Object.keys(updates).length > 0) {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) params.set(k, v);
      router.replace(pathname + "?" + params.toString(), { scroll: false });
    }
  }, [availableYears, monthsByYear, currentYear, currentMonth, router, pathname, searchParams]);

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
