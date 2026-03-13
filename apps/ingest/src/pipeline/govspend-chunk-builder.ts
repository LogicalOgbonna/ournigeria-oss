/**
 * Pure functions that build embeddable text chunks from structured GovSpend payment data.
 *
 * Chunk types:
 *  1. MDA Monthly Summary     (one per MDA per month)
 *  2. MDA Annual Summary      (one per MDA per year)
 *  3. Beneficiary Annual Summary (one per beneficiary per year)
 */

export interface GovspendChunk {
  text: string;
  metadata: Record<string, unknown>;
}

export interface GovspendPaymentRecord {
  organization_name: string;
  beneficiary_name: string;
  amount_numeric: number;
  year: string;
  month: string;
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Filter out records with empty organization_name or beneficiary_name. */
function filterValid(records: GovspendPaymentRecord[]): GovspendPaymentRecord[] {
  return records.filter(
    (r) => r.organization_name?.trim() && r.beneficiary_name?.trim(),
  );
}

/** Return top N entries from a map of name → total amount, sorted descending. */
function topN(
  totals: Map<string, number>,
  n: number,
): { name: string; amount: number }[] {
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, amount]) => ({ name, amount }));
}

/* ────── 1. MDA Monthly Summary Chunks ────── */

export function buildMdaMonthlyChunks(
  records: GovspendPaymentRecord[],
  year: string,
  month: string,
): GovspendChunk[] {
  const valid = filterValid(records);

  // Group by organization_name
  const byMda = new Map<string, GovspendPaymentRecord[]>();
  for (const r of valid) {
    if (!byMda.has(r.organization_name)) byMda.set(r.organization_name, []);
    byMda.get(r.organization_name)!.push(r);
  }

  const chunks: GovspendChunk[] = [];

  for (const [orgName, mdaRecords] of byMda) {
    const count = mdaRecords.length;
    const total = mdaRecords.reduce((sum, r) => sum + r.amount_numeric, 0);
    const avg = count > 0 ? total / count : 0;

    // Top 5 beneficiaries by amount
    const beneficiaryTotals = new Map<string, number>();
    for (const r of mdaRecords) {
      beneficiaryTotals.set(
        r.beneficiary_name,
        (beneficiaryTotals.get(r.beneficiary_name) ?? 0) + r.amount_numeric,
      );
    }
    const topBeneficiaries = topN(beneficiaryTotals, 5);

    const text = [
      `GovSpend Summary: ${orgName}, ${month} ${year}`,
      `Total Payments: ${count}`,
      `Total Amount: ${formatNaira(total)}`,
      `Average Payment: ${formatNaira(avg)}`,
      `Top Beneficiaries: ${topBeneficiaries.map((b) => `${b.name} (${formatNaira(b.amount)})`).join(", ")}`,
    ].join("\n");

    chunks.push({
      text,
      metadata: {
        text,
        chunk_type: "mda_monthly",
        year,
        month,
        organization_name: orgName,
        total_amount: total,
        payment_count: count,
      },
    });
  }

  return chunks;
}

/* ────── 2. MDA Annual Summary Chunks ────── */

export function buildMdaAnnualChunks(
  records: GovspendPaymentRecord[],
  year: string,
): GovspendChunk[] {
  const valid = filterValid(records);

  // Group by organization_name
  const byMda = new Map<string, GovspendPaymentRecord[]>();
  for (const r of valid) {
    if (!byMda.has(r.organization_name)) byMda.set(r.organization_name, []);
    byMda.get(r.organization_name)!.push(r);
  }

  const chunks: GovspendChunk[] = [];

  for (const [orgName, mdaRecords] of byMda) {
    const count = mdaRecords.length;
    const total = mdaRecords.reduce((sum, r) => sum + r.amount_numeric, 0);

    // Collect active months
    const activeMonths = new Set<string>();
    for (const r of mdaRecords) {
      activeMonths.add(r.month);
    }
    const monthCount = activeMonths.size;
    const avg = monthCount > 0 ? total / monthCount : 0;

    // Top 5 beneficiaries by amount
    const beneficiaryTotals = new Map<string, number>();
    for (const r of mdaRecords) {
      beneficiaryTotals.set(
        r.beneficiary_name,
        (beneficiaryTotals.get(r.beneficiary_name) ?? 0) + r.amount_numeric,
      );
    }
    const topBeneficiaries = topN(beneficiaryTotals, 5);

    const text = [
      `GovSpend Annual Summary: ${orgName}, ${year}`,
      `Total Payments: ${count}`,
      `Total Amount: ${formatNaira(total)}`,
      `Monthly Average: ${formatNaira(avg)}`,
      `Active Months: ${[...activeMonths].join(", ")}`,
      `Top Beneficiaries: ${topBeneficiaries.map((b) => `${b.name} (${formatNaira(b.amount)})`).join(", ")}`,
    ].join("\n");

    chunks.push({
      text,
      metadata: {
        text,
        chunk_type: "mda_annual",
        year,
        organization_name: orgName,
        total_amount: total,
        payment_count: count,
      },
    });
  }

  return chunks;
}

/* ────── 3. Beneficiary Annual Summary Chunks ────── */

export function buildBeneficiaryAnnualChunks(
  records: GovspendPaymentRecord[],
  year: string,
): GovspendChunk[] {
  const valid = filterValid(records);

  // Group by beneficiary_name
  const byBeneficiary = new Map<string, GovspendPaymentRecord[]>();
  for (const r of valid) {
    if (!byBeneficiary.has(r.beneficiary_name)) byBeneficiary.set(r.beneficiary_name, []);
    byBeneficiary.get(r.beneficiary_name)!.push(r);
  }

  const chunks: GovspendChunk[] = [];

  for (const [benefName, benefRecords] of byBeneficiary) {
    const count = benefRecords.length;
    const total = benefRecords.reduce((sum, r) => sum + r.amount_numeric, 0);

    // Top 5 paying MDAs by amount
    const mdaTotals = new Map<string, number>();
    for (const r of benefRecords) {
      mdaTotals.set(
        r.organization_name,
        (mdaTotals.get(r.organization_name) ?? 0) + r.amount_numeric,
      );
    }
    const topMdas = topN(mdaTotals, 5);

    const text = [
      `GovSpend Beneficiary Summary: ${benefName}, ${year}`,
      `Total Received: ${formatNaira(total)}`,
      `Number of Payments: ${count}`,
      `Paying MDAs: ${topMdas.map((m) => `${m.name} (${formatNaira(m.amount)})`).join(", ")}`,
    ].join("\n");

    chunks.push({
      text,
      metadata: {
        text,
        chunk_type: "beneficiary_annual",
        year,
        beneficiary_name: benefName,
        total_amount: total,
        payment_count: count,
      },
    });
  }

  return chunks;
}
