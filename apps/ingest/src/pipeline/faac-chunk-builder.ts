/**
 * Pure functions that build embeddable text chunks from structured FAAC extraction data.
 *
 * Chunk types:
 *  1. LGA Monthly    (~774 per file)
 *  2. State Monthly  (37 per file)
 *  3. National Monthly (1 per file)
 *  4. Zone Monthly   (6 per file)
 *  5. State Annual   (37 per year — built after all monthly files are processed)
 */

import type { FaacExtraction } from "./faac-extractor.service";
import {
  STATE_TO_ZONE,
  OIL_PRODUCING_STATES,
  GEOPOLITICAL_ZONES,
  normalizeStateName,
  normalizeLgaName,
  getStatesInZone,
} from "./faac-constants";

export interface FaacChunk {
  text: string;
  metadata: Record<string, unknown>;
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ────── 1. LGA Monthly Chunks ────── */

export function buildLgaMonthlyChunks(
  extraction: FaacExtraction,
  sourceFile: string,
): FaacChunk[] {
  const { disbursement_month, disbursement_year, lgas } = extraction;

  return lgas.map((lga) => {
    const stateName = normalizeStateName(lga.state);
    const lgaName = normalizeLgaName(lga.name);
    const zone = STATE_TO_ZONE[stateName] ?? "Unknown";

    const text = [
      `FAAC Allocation for ${lgaName} LGA, ${stateName} State, ${disbursement_month} ${disbursement_year}:`,
      `Statutory Allocation: ${formatNaira(lga.gross_statutory)}`,
      lga.deduction ? `Deduction: ${formatNaira(lga.deduction)}` : null,
      lga.exchange_gain ? `Exchange Gain: ${formatNaira(lga.exchange_gain)}` : null,
      lga.emtl ? `EMTL: ${formatNaira(lga.emtl)}` : null,
      lga.ecology ? `Ecology: ${formatNaira(lga.ecology)}` : null,
      `VAT: ${formatNaira(lga.vat)}`,
      `Total Allocation: ${formatNaira(lga.total_allocation)}`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      text,
      metadata: {
        text,
        chunk_type: "lga_monthly",
        year: disbursement_year,
        month: disbursement_month,
        state: stateName,
        lga: lgaName,
        geopolitical_zone: zone,
        total_allocation: lga.total_allocation,
        is_oil_producing: OIL_PRODUCING_STATES.has(stateName),
        source_file: sourceFile,
      },
    };
  });
}

/* ────── 2. State Monthly Chunks ────── */

export function buildStateMonthlyChunks(
  extraction: FaacExtraction,
  sourceFile: string,
): FaacChunk[] {
  const { disbursement_month, disbursement_year, states } = extraction;

  return states.map((state) => {
    const stateName = normalizeStateName(state.name);
    const zone = STATE_TO_ZONE[stateName] ?? "Unknown";
    const isOil = OIL_PRODUCING_STATES.has(stateName);

    const lines = [
      `FAAC Allocation Summary for ${stateName} State, ${disbursement_month} ${disbursement_year}:`,
      state.num_lgcs ? `Number of LGAs: ${state.num_lgcs}` : null,
      `Gross Statutory Allocation: ${formatNaira(state.gross_statutory)}`,
      isOil && state.derivation_13_pct
        ? `13% Derivation: ${formatNaira(state.derivation_13_pct)}`
        : null,
      `Gross Total: ${formatNaira(state.gross_total)}`,
    ];

    const ded = state.deductions;
    if (ded.external_debt || ded.ispo || ded.other) {
      const parts: string[] = [];
      if (ded.external_debt) parts.push(`External Debt ${formatNaira(ded.external_debt)}`);
      if (ded.ispo) parts.push(`ISPO ${formatNaira(ded.ispo)}`);
      if (ded.other) parts.push(`Other ${formatNaira(ded.other)}`);
      lines.push(`Deductions: ${parts.join(", ")}`);
    }

    lines.push(
      `Net Statutory Allocation: ${formatNaira(state.net_statutory)}`,
      `VAT: ${formatNaira(state.vat)}`,
    );
    if (state.exchange_gain) lines.push(`Exchange Gain: ${formatNaira(state.exchange_gain)}`);
    if (state.emtl) lines.push(`EMTL: ${formatNaira(state.emtl)}`);
    if (state.ecology) lines.push(`Ecology: ${formatNaira(state.ecology)}`);
    lines.push(
      `Total Net Allocation: ${formatNaira(state.total_net)}`,
      `Geopolitical Zone: ${zone}`,
    );

    const text = lines.filter(Boolean).join("\n");

    return {
      text,
      metadata: {
        text,
        chunk_type: "state_monthly",
        year: disbursement_year,
        month: disbursement_month,
        state: stateName,
        lga: "",
        geopolitical_zone: zone,
        total_allocation: state.total_net,
        is_oil_producing: isOil,
        source_file: sourceFile,
      },
    };
  });
}

/* ────── 3. National Monthly Chunk ────── */

export function buildNationalMonthlyChunk(
  extraction: FaacExtraction,
  sourceFile: string,
): FaacChunk {
  const { disbursement_month, disbursement_year, revenue_month, revenue_year, national_summary } =
    extraction;

  const revenueNote =
    revenue_month && revenue_year
      ? ` (Revenue from ${revenue_month} ${revenue_year})`
      : "";

  const lines = [
    `FAAC National Disbursement Summary, ${disbursement_month} ${disbursement_year}${revenueNote}:`,
    `Federal Government: ${formatNaira(national_summary.fgn_total)}`,
    `States Total: ${formatNaira(national_summary.states_total)}`,
    `Local Governments Total: ${formatNaira(national_summary.lgcs_total)}`,
  ];
  if (national_summary.derivation_13_pct) {
    lines.push(`13% Derivation Fund: ${formatNaira(national_summary.derivation_13_pct)}`);
  }
  lines.push(`Grand Total: ${formatNaira(national_summary.grand_total)}`);

  // Revenue source breakdown
  const sources = national_summary.revenue_sources;
  if (Object.keys(sources).length > 0) {
    lines.push("Revenue Sources:");
    for (const [source, amount] of Object.entries(sources)) {
      if (amount) {
        const label = source
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        lines.push(`  ${label}: ${formatNaira(amount)}`);
      }
    }
  }

  const text = lines.join("\n");

  return {
    text,
    metadata: {
      text,
      chunk_type: "national_monthly",
      year: disbursement_year,
      month: disbursement_month,
      state: "",
      lga: "",
      geopolitical_zone: "",
      total_allocation: national_summary.grand_total,
      is_oil_producing: false,
      source_file: sourceFile,
    },
  };
}

/* ────── 4. Zone Monthly Chunks ────── */

export function buildZoneMonthlyChunks(
  extraction: FaacExtraction,
  sourceFile: string,
): FaacChunk[] {
  const { disbursement_month, disbursement_year, states, lgas } = extraction;

  // Build state name → normalized name map for matching
  const normalizedStates = new Map(
    states.map((s) => [normalizeStateName(s.name), s]),
  );

  // Sum LGA allocations per zone
  const lgaTotalsByZone = new Map<string, number>();
  for (const lga of lgas) {
    const stateName = normalizeStateName(lga.state);
    const zone = STATE_TO_ZONE[stateName];
    if (!zone) continue;
    lgaTotalsByZone.set(zone, (lgaTotalsByZone.get(zone) ?? 0) + lga.total_allocation);
  }

  return GEOPOLITICAL_ZONES.map((zone) => {
    const zoneStates = getStatesInZone(zone);
    let stateTotal = 0;
    const stateNames: string[] = [];

    for (const stateName of zoneStates) {
      const stateData = normalizedStates.get(stateName);
      if (stateData) {
        stateTotal += stateData.total_net;
        stateNames.push(stateName);
      }
    }

    const lgaTotal = lgaTotalsByZone.get(zone) ?? 0;
    const combinedTotal = stateTotal + lgaTotal;
    const grandTotal = extraction.national_summary.grand_total;
    const sharePercent =
      grandTotal > 0 ? ((combinedTotal / grandTotal) * 100).toFixed(1) : "0.0";

    const text = [
      `FAAC Allocation for ${zone} Zone, ${disbursement_month} ${disbursement_year}:`,
      `States: ${stateNames.join(", ")}`,
      `Total State Allocation: ${formatNaira(stateTotal)}`,
      `Total LGA Allocation: ${formatNaira(lgaTotal)}`,
      `Combined Zone Total: ${formatNaira(combinedTotal)}`,
      `Zone Share of National Total: ${sharePercent}%`,
    ].join("\n");

    return {
      text,
      metadata: {
        text,
        chunk_type: "zone_monthly",
        year: disbursement_year,
        month: disbursement_month,
        state: "",
        lga: "",
        geopolitical_zone: zone,
        total_allocation: combinedTotal,
        is_oil_producing: false,
        source_file: sourceFile,
      },
    };
  });
}

/* ────── 5. State Annual Chunks ────── */

/**
 * Build annual aggregation chunks for each state across all months.
 * Called once after all monthly files have been extracted.
 */
export function buildStateAnnualChunks(
  extractions: FaacExtraction[],
): FaacChunk[] {
  // Group extractions by year
  const byYear = new Map<number, FaacExtraction[]>();
  for (const ext of extractions) {
    const year = ext.disbursement_year;
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(ext);
  }

  const chunks: FaacChunk[] = [];

  for (const [year, yearExtractions] of byYear) {
    // Aggregate per state
    const stateAgg = new Map<
      string,
      { total: number; months: { month: string; amount: number }[] }
    >();

    for (const ext of yearExtractions) {
      for (const state of ext.states) {
        const name = normalizeStateName(state.name);
        if (!stateAgg.has(name)) stateAgg.set(name, { total: 0, months: [] });
        const agg = stateAgg.get(name)!;
        agg.total += state.total_net;
        agg.months.push({ month: ext.disbursement_month, amount: state.total_net });
      }
    }

    // Get previous year data for YoY comparison
    const prevYearExtractions = byYear.get(year - 1);
    const prevYearTotals = new Map<string, number>();
    if (prevYearExtractions) {
      for (const ext of prevYearExtractions) {
        for (const state of ext.states) {
          const name = normalizeStateName(state.name);
          prevYearTotals.set(
            name,
            (prevYearTotals.get(name) ?? 0) + state.total_net,
          );
        }
      }
    }

    for (const [stateName, agg] of stateAgg) {
      const zone = STATE_TO_ZONE[stateName] ?? "Unknown";
      const isOil = OIL_PRODUCING_STATES.has(stateName);
      const monthCount = agg.months.length;
      const avg = monthCount > 0 ? agg.total / monthCount : 0;

      const sorted = [...agg.months].sort((a, b) => b.amount - a.amount);
      const highest = sorted[0];
      const lowest = sorted[sorted.length - 1];

      const lines = [
        `Annual FAAC Summary for ${stateName} State, ${year}:`,
        `Total Allocation (${monthCount} months): ${formatNaira(agg.total)}`,
        `Monthly Average: ${formatNaira(avg)}`,
      ];

      if (highest && lowest && monthCount > 1) {
        lines.push(`Highest Month: ${highest.month} (${formatNaira(highest.amount)})`);
        lines.push(`Lowest Month: ${lowest.month} (${formatNaira(lowest.amount)})`);
      }

      const prevTotal = prevYearTotals.get(stateName);
      if (prevTotal && prevTotal > 0) {
        const change = ((agg.total - prevTotal) / prevTotal) * 100;
        const sign = change >= 0 ? "+" : "";
        lines.push(`Year-over-Year Change: ${sign}${change.toFixed(1)}% from ${year - 1}`);
      }

      lines.push(`Geopolitical Zone: ${zone}`);

      const text = lines.join("\n");

      chunks.push({
        text,
        metadata: {
          text,
          chunk_type: "state_annual",
          year,
          month: "",
          state: stateName,
          lga: "",
          geopolitical_zone: zone,
          total_allocation: agg.total,
          is_oil_producing: isOil,
          source_file: `faac/${year}/annual_summary`,
        },
      });
    }
  }

  return chunks;
}
