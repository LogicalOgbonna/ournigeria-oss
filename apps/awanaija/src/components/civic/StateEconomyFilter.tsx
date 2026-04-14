"use client";

import React, { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function StateEconomyFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentYear = searchParams.get("year") || "";
  const currentMonth = searchParams.get("month") || "";

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    router.push(pathname + "?" + createQueryString("year", newYear), { scroll: false });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    router.push(pathname + "?" + createQueryString("month", newMonth), { scroll: false });
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="flex gap-2 mb-4">
      <select
        value={currentYear}
        onChange={handleYearChange}
        className="bg-card border border-border rounded-md px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="">All Years</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <select
        value={currentMonth}
        onChange={handleMonthChange}
        className="bg-card border border-border rounded-md px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="">All Months</option>
        {months.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
    </div>
  );
}
