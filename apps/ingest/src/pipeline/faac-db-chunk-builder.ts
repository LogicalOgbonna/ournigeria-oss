/**
 * Pure functions that turn resolved FAAC database rows into rich, embeddable
 * chunks. The DB is the single source of truth; these builders capture every
 * financial component the tables hold plus lightweight derived context
 * (rank, share, month-over-month, year-over-year) computed in-process.
 *
 * Chunk types (deterministic IDs so re-runs replace, never duplicate):
 *  1. lga_monthly      faac:lga:{year}:{Month}:{state_lga}
 *  2. state_monthly    faac:state:{year}:{Month}:{state}
 *  3. national_monthly faac:national:{year}:{Month}
 *  4. zone_monthly     faac:zone:{year}:{Month}:{zone_slug}
 *  5. fgn_monthly      faac:fgn:{year}:{Month}
 *  6. state_annual     faac:state_annual:{year}:{state}
 */

import type { ResolvedDisbursement } from "./faac-db-loader";
import { GEOPOLITICAL_ZONES, getStatesInZone } from "./faac-constants";

export interface FaacChunk {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Append "Label: ₦x" when the value is present and non-zero. */
function money(label: string, value: number | null | undefined): string | null {
  if (value === null || value === undefined || value === 0) return null;
  return `${label}: ${formatNaira(value)}`;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/* ───────────────────────── 1. LGA monthly ───────────────────────── */

function buildLgaMonthlyChunks(d: ResolvedDisbursement): FaacChunk[] {
  return d.lgas.map((lga) => {
    const text = [
      `FAAC Allocation for ${lga.lgaName} LGA, ${lga.stateName} State, ${d.monthName} ${d.year}:`,
      money("Net Statutory Allocation", lga.netStatutory),
      money("Deduction", lga.deduction),
      money("Exchange Gain", lga.exchangeGain),
      money("EMTL", lga.emtl),
      money("Augmentation", lga.augmentation),
      money("Solid Mineral", lga.solidMineral),
      money("Ecology (Gross)", lga.ecologyGross),
      money("Ecology Transfer to NDDC/HYPPADEC", lga.ecologyTransferNddcHyppadec),
      money("Ecology (Net)", lga.ecologyNet),
      money("VAT", lga.vat),
      `Total Net Allocation: ${formatNaira(lga.totalNet)}`,
      `Geopolitical Zone: ${lga.zone}`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      id: `faac:lga:${d.year}:${d.monthName}:${slug(lga.stateName)}_${slug(lga.lgaName)}`,
      text,
      metadata: {
        text,
        chunk_type: "lga_monthly",
        year: d.year,
        month: d.monthName,
        state: lga.stateName,
        lga: lga.lgaName,
        geopolitical_zone: lga.zone,
        total_allocation: lga.totalNet,
        is_oil_producing: lga.isOilProducing,
        source_file: `db/faac/${d.year}/${d.monthName}`,
      },
    };
  });
}

/* ──────────────────────── 2. State monthly ──────────────────────── */

function buildStateMonthlyChunks(
  d: ResolvedDisbursement,
  prevStateTotals: Map<string, number>,
): FaacChunk[] {
  const statesPool = d.states.reduce((sum, s) => sum + s.totalNet, 0);
  // Rank by total net allocation, highest first.
  const ranked = [...d.states].sort((a, b) => b.totalNet - a.totalNet);
  const rankByState = new Map(ranked.map((s, i) => [s.stateName, i + 1]));
  const stateCount = d.states.length;

  return d.states.map((s) => {
    const rank = rankByState.get(s.stateName)!;
    const sharePct = statesPool > 0 ? (s.totalNet / statesPool) * 100 : 0;
    const prev = prevStateTotals.get(s.stateName);

    const lines = [
      `FAAC Allocation Summary for ${s.stateName} State, ${d.monthName} ${d.year}:`,
      `Number of Local Governments: ${s.numLgcs}`,
      money("Gross Statutory Allocation", s.grossStatutory),
      s.isOilProducing ? money("13% Derivation", s.derivation13pct) : null,
      s.isOilProducing
        ? money("13% Derivation (Exchange Gain)", s.exchangeGainDerivation13pct)
        : null,
      money("Gross Total", s.grossTotal),
    ];

    const dedParts: string[] = [];
    if (s.deductionExternalDebt)
      dedParts.push(`External Debt ${formatNaira(s.deductionExternalDebt)}`);
    if (s.deductionIspo) dedParts.push(`ISPO ${formatNaira(s.deductionIspo)}`);
    if (s.deductionOther) dedParts.push(`Other ${formatNaira(s.deductionOther)}`);
    if (dedParts.length) lines.push(`Deductions: ${dedParts.join(", ")}`);

    lines.push(
      money("Net Statutory Allocation", s.netStatutory),
      money("Exchange Gain", s.exchangeGain),
      money("EMTL", s.emtl),
      money("Augmentation", s.augmentation),
      money("Solid Mineral", s.solidMineral),
      money("Ecology (Gross)", s.ecologyGross),
      money("Ecology Transfer to NDDC/HYPPADEC", s.ecologyTransferNddcHyppadec),
      money("Ecology (Net)", s.ecologyNet),
      money("VAT (Gross)", s.vatGross),
      money("VAT Deduction", s.vatDeduction),
      money("VAT (Net)", s.vatNet),
      `Total Net Allocation: ${formatNaira(s.totalNet)}`,
      `Ranking: ${ordinal(rank)} highest of ${stateCount} states this month`,
      `Share of all states' allocation: ${sharePct.toFixed(1)}%`,
    );

    if (prev && prev > 0) {
      const change = ((s.totalNet - prev) / prev) * 100;
      const sign = change >= 0 ? "+" : "";
      lines.push(`Month-over-Month Change: ${sign}${change.toFixed(1)}%`);
    }

    lines.push(
      `Oil-Producing State: ${s.isOilProducing ? "Yes" : "No"}`,
      `Geopolitical Zone: ${s.zone}`,
    );

    const text = lines.filter(Boolean).join("\n");

    return {
      id: `faac:state:${d.year}:${d.monthName}:${slug(s.stateName)}`,
      text,
      metadata: {
        text,
        chunk_type: "state_monthly",
        year: d.year,
        month: d.monthName,
        state: s.stateName,
        lga: "",
        geopolitical_zone: s.zone,
        total_allocation: s.totalNet,
        is_oil_producing: s.isOilProducing,
        rank,
        state_count: stateCount,
        share_pct: Number(sharePct.toFixed(2)),
        source_file: `db/faac/${d.year}/${d.monthName}`,
      },
    };
  });
}

/* ─────────────────────── 3. National monthly ─────────────────────── */

function buildNationalMonthlyChunk(d: ResolvedDisbursement): FaacChunk {
  const n = d.national;
  const revenueNote =
    n.sourceDescription ??
    `Revenue from ${d.revenueMonthName} ${d.revenueYear}`;

  const lines = [
    `FAAC National Disbursement Summary, ${d.monthName} ${d.year} (${revenueNote}):`,
    money("Federal Government Total", n.fgnTotal),
    money("States Total", n.statesTotal),
    money("Local Governments Total", n.lgcsTotal),
    money("13% Derivation Fund", n.derivation13pctTotal),
    `Grand Total Distributed: ${formatNaira(n.grandTotal)}`,
  ];

  const revParts = [
    money("Statutory Revenue", n.totalStatutory),
    money("VAT", n.totalVat),
    money("EMTL", n.totalEmtl),
    money("Exchange Gain", n.totalExchangeGain),
    money("Augmentation", n.totalAugmentation),
    money("Solid Mineral", n.totalSolidMineral),
  ].filter(Boolean);
  if (revParts.length) {
    lines.push("Revenue Components:");
    lines.push(...revParts.map((p) => `  ${p}`));
  }

  const cocParts = [
    money("Nigeria Customs Service (NCS)", n.costOfCollectionNcs),
    money("FIRS", n.costOfCollectionFirs),
    money("NUPRC", n.costOfCollectionNuprc),
    money("Transfer to NMDPRA", n.transferToNmdpra),
  ].filter(Boolean);
  if (cocParts.length) {
    lines.push("Cost of Collection & Transfers:");
    lines.push(...cocParts.map((p) => `  ${p}`));
  }

  if (d.specialItems.length) {
    lines.push("Special Items & Refunds:");
    for (const item of d.specialItems) {
      if (!item?.name) continue;
      const amt = item.total_net ?? item.statutory ?? 0;
      lines.push(`  ${item.name}: ${formatNaira(amt)}`);
    }
  }

  // Derived: top and bottom states this month.
  if (d.states.length) {
    const ranked = [...d.states].sort((a, b) => b.totalNet - a.totalNet);
    const top = ranked
      .slice(0, 3)
      .map((s) => `${s.stateName} (${formatNaira(s.totalNet)})`);
    const bottom = ranked[ranked.length - 1];
    lines.push(`Highest-allocated states: ${top.join(", ")}`);
    if (bottom)
      lines.push(
        `Lowest-allocated state: ${bottom.stateName} (${formatNaira(bottom.totalNet)})`,
      );
  }

  const text = lines.filter(Boolean).join("\n");

  return {
    id: `faac:national:${d.year}:${d.monthName}`,
    text,
    metadata: {
      text,
      chunk_type: "national_monthly",
      year: d.year,
      month: d.monthName,
      state: "",
      lga: "",
      geopolitical_zone: "",
      total_allocation: n.grandTotal,
      is_oil_producing: false,
      source_file: `db/faac/${d.year}/${d.monthName}`,
    },
  };
}

/* ───────────────────────── 4. Zone monthly ───────────────────────── */

function buildZoneMonthlyChunks(d: ResolvedDisbursement): FaacChunk[] {
  const stateByName = new Map(d.states.map((s) => [s.stateName, s]));
  const lgaTotalsByZone = new Map<string, number>();
  for (const lga of d.lgas) {
    lgaTotalsByZone.set(
      lga.zone,
      (lgaTotalsByZone.get(lga.zone) ?? 0) + lga.totalNet,
    );
  }
  const grandTotal = d.national.grandTotal;

  return GEOPOLITICAL_ZONES.map((zone) => {
    const zoneStates = getStatesInZone(zone);
    let stateTotal = 0;
    const present: string[] = [];
    for (const name of zoneStates) {
      const s = stateByName.get(name);
      if (s) {
        stateTotal += s.totalNet;
        present.push(name);
      }
    }
    const lgaTotal = lgaTotalsByZone.get(zone) ?? 0;
    const combined = stateTotal + lgaTotal;
    const sharePct = grandTotal > 0 ? (combined / grandTotal) * 100 : 0;

    const text = [
      `FAAC Allocation for the ${zone} Geopolitical Zone, ${d.monthName} ${d.year}:`,
      `States: ${present.join(", ")}`,
      `Total State Allocation: ${formatNaira(stateTotal)}`,
      `Total LGA Allocation: ${formatNaira(lgaTotal)}`,
      `Combined Zone Total: ${formatNaira(combined)}`,
      `Zone Share of National Grand Total: ${sharePct.toFixed(1)}%`,
    ].join("\n");

    return {
      id: `faac:zone:${d.year}:${d.monthName}:${slug(zone)}`,
      text,
      metadata: {
        text,
        chunk_type: "zone_monthly",
        year: d.year,
        month: d.monthName,
        state: "",
        lga: "",
        geopolitical_zone: zone,
        total_allocation: combined,
        is_oil_producing: false,
        share_pct: Number(sharePct.toFixed(2)),
        source_file: `db/faac/${d.year}/${d.monthName}`,
      },
    };
  });
}

/* ───────────────────────── 5. FGN monthly ───────────────────────── */

function buildFgnMonthlyChunk(d: ResolvedDisbursement): FaacChunk | null {
  if (!d.fgn.length) return null;

  const fgnSum = d.fgn.reduce((sum, b) => sum + b.total, 0);

  const lines = [
    `Federal Government (FGN) FAAC Beneficiary Breakdown, ${d.monthName} ${d.year}:`,
    `Total Federal Government Allocation: ${formatNaira(fgnSum)}`,
    "Beneficiaries:",
  ];

  for (const b of d.fgn) {
    const sharePct = fgnSum > 0 ? (b.total / fgnSum) * 100 : 0;
    const parts = [
      money("Gross Statutory", b.grossStatutory),
      money("Net Statutory", b.netStatutory),
      money("Exchange Gain", b.exchangeGain),
      money("EMTL", b.emtl),
      money("VAT", b.vat),
      money("Augmentation", b.augmentation),
      money("Solid Mineral", b.solidMineral),
    ].filter(Boolean);
    lines.push(
      `  ${b.beneficiary}: ${formatNaira(b.total)} (${sharePct.toFixed(1)}% of FGN share)`,
    );
    if (parts.length) lines.push(`    ${parts.join(", ")}`);
  }

  const text = lines.join("\n");

  return {
    id: `faac:fgn:${d.year}:${d.monthName}`,
    text,
    metadata: {
      text,
      chunk_type: "fgn_monthly",
      year: d.year,
      month: d.monthName,
      state: "",
      lga: "",
      geopolitical_zone: "",
      total_allocation: fgnSum,
      is_oil_producing: false,
      source_file: `db/faac/${d.year}/${d.monthName}`,
    },
  };
}

/* ───────────────────────── 6. State annual ───────────────────────── */

function buildStateAnnualChunks(
  disbursements: ResolvedDisbursement[],
): FaacChunk[] {
  const byYear = new Map<number, ResolvedDisbursement[]>();
  for (const d of disbursements) {
    if (!byYear.has(d.year)) byYear.set(d.year, []);
    byYear.get(d.year)!.push(d);
  }

  const yearStateTotal = (year: number): Map<string, number> => {
    const totals = new Map<string, number>();
    for (const d of byYear.get(year) ?? []) {
      for (const s of d.states) {
        totals.set(s.stateName, (totals.get(s.stateName) ?? 0) + s.totalNet);
      }
    }
    return totals;
  };

  const chunks: FaacChunk[] = [];

  for (const [year, yearDisbursements] of byYear) {
    const agg = new Map<
      string,
      { total: number; zone: string; isOil: boolean; months: { month: string; amount: number }[] }
    >();

    for (const d of yearDisbursements) {
      for (const s of d.states) {
        if (!agg.has(s.stateName))
          agg.set(s.stateName, {
            total: 0,
            zone: s.zone,
            isOil: s.isOilProducing,
            months: [],
          });
        const a = agg.get(s.stateName)!;
        a.total += s.totalNet;
        a.months.push({ month: d.monthName, amount: s.totalNet });
      }
    }

    const prevTotals = yearStateTotal(year - 1);

    for (const [stateName, a] of agg) {
      const monthCount = a.months.length;
      const avg = monthCount > 0 ? a.total / monthCount : 0;
      const sorted = [...a.months].sort((x, y) => y.amount - x.amount);
      const highest = sorted[0];
      const lowest = sorted[sorted.length - 1];

      const lines = [
        `Annual FAAC Summary for ${stateName} State, ${year}:`,
        `Total Allocation across ${monthCount} month(s): ${formatNaira(a.total)}`,
        `Monthly Average: ${formatNaira(avg)}`,
      ];
      if (highest && lowest && monthCount > 1) {
        lines.push(
          `Highest Month: ${highest.month} (${formatNaira(highest.amount)})`,
          `Lowest Month: ${lowest.month} (${formatNaira(lowest.amount)})`,
        );
      }
      const prev = prevTotals.get(stateName);
      if (prev && prev > 0) {
        const change = ((a.total - prev) / prev) * 100;
        const sign = change >= 0 ? "+" : "";
        lines.push(
          `Year-over-Year Change: ${sign}${change.toFixed(1)}% from ${year - 1}`,
        );
      }
      lines.push(
        `Oil-Producing State: ${a.isOil ? "Yes" : "No"}`,
        `Geopolitical Zone: ${a.zone}`,
      );

      const text = lines.join("\n");

      chunks.push({
        id: `faac:state_annual:${year}:${slug(stateName)}`,
        text,
        metadata: {
          text,
          chunk_type: "state_annual",
          year,
          month: "",
          state: stateName,
          lga: "",
          geopolitical_zone: a.zone,
          total_allocation: a.total,
          is_oil_producing: a.isOil,
          source_file: `db/faac/${year}/annual_summary`,
        },
      });
    }
  }

  return chunks;
}

/* ──────────────────────────── Entry point ───────────────────────── */

/**
 * Build every FAAC chunk from the full set of resolved disbursements.
 * Disbursements are processed in chronological order so month-over-month
 * and year-over-year context can be computed without extra queries.
 */
export function buildAllFaacChunks(
  disbursements: ResolvedDisbursement[],
): FaacChunk[] {
  const ordered = [...disbursements].sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );

  const chunks: FaacChunk[] = [];
  const prevStateTotals = new Map<string, number>();

  for (const d of ordered) {
    chunks.push(...buildLgaMonthlyChunks(d));
    chunks.push(...buildStateMonthlyChunks(d, prevStateTotals));
    chunks.push(buildNationalMonthlyChunk(d));
    chunks.push(...buildZoneMonthlyChunks(d));
    const fgn = buildFgnMonthlyChunk(d);
    if (fgn) chunks.push(fgn);

    // Refresh prior-month state totals for the next iteration's MoM.
    prevStateTotals.clear();
    for (const s of d.states) prevStateTotals.set(s.stateName, s.totalNet);
  }

  chunks.push(...buildStateAnnualChunks(ordered));

  return chunks;
}
