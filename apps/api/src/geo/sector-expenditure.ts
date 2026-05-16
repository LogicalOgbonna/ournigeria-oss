import type { PrismaService } from "@ournigeria/database";
import { formatNaira } from "../lib/format";

export type SectorRow = {
  name: string;
  amount: string;
  percentage: number;
  color: string;
};

const EXPENDITURE_TYPES = ["recurrent_expenditure", "capital_expenditure"] as const;

const BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
] as const;

function sumApproved(v: { _sum: { approvedBudget: unknown } }): number {
  const raw = v._sum.approvedBudget;
  if (raw == null) return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw === "bigint") return Number(raw);
  if (typeof raw === "object" && raw !== null && "toString" in raw) {
    const n = Number((raw as { toString: () => string }).toString());
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function truncateLabel(s: string, max = 52): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Strip seed placeholder suffix from `budget_function_codes.name` before API output. */
function cleanFunctionDisplayName(name: string): string {
  return name
    .replace(/\s*\(\s*inferred ancestor;\s*not present in extract\s*\)\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

type CodeAmount = { code: string | null; amount: number };

/**
 * Top `topK` COFOG function groups by approved expenditure (recurrent + capital only).
 * Percentages are share of **all** such expenditure (may sum to under 100% when more than `topK` codes exist).
 */
export async function buildTopFunctionSectorRows(
  prisma: PrismaService,
  entityCode: string,
  fiscalYear: number,
  topK = 5,
): Promise<SectorRow[]> {
  const base = {
    entityCode,
    fiscalYear,
    budgetType: { in: [...EXPENDITURE_TYPES] },
  };

  const grouped = await prisma.budgetLineItem.groupBy({
    by: ["functionCode"],
    where: base,
    _sum: { approvedBudget: true },
  });

  const items: CodeAmount[] = grouped
    .map((g) => ({
      code: g.functionCode,
      amount: sumApproved({ _sum: { approvedBudget: g._sum.approvedBudget } }),
    }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const total = items.reduce((s, x) => s + x.amount, 0);
  if (total <= 0) {
    return [];
  }

  const top = items.slice(0, topK);

  const codes = top.map((t) => t.code).filter((c): c is string => !!c);
  const fnRows =
    codes.length > 0
      ? await prisma.budgetFunctionCode.findMany({
          where: { code: { in: codes } },
        })
      : [];
  const nameByCode = new Map(fnRows.map((f) => [f.code, f.name]));

  const pct = (amt: number) => Number(((amt / total) * 100).toFixed(1));
  const percentages = top.map((d) => pct(d.amount));

  return top.map((d, i) => {
    let name: string;
    if (d.code == null) {
      name = "Unclassified expenditure";
    } else {
      const rawName = nameByCode.get(d.code);
      name = truncateLabel(cleanFunctionDisplayName(rawName ?? `COFOG ${d.code}`));
    }

    return {
      name,
      amount: formatNaira(d.amount),
      percentage: percentages[i]!,
      color: BAR_COLORS[i % BAR_COLORS.length]!,
    };
  });
}
