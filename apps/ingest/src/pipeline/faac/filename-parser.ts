export interface ParsedFaacFilename {
  year: number;
  months: number[]; // 1-12, ascending
}

// Full names + common abbreviations seen on NBS (SEPT, etc.).
const MONTH_TOKENS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

/** Parse a FAAC data filename -> its year + the month(s) it covers. Data files
 * are .xlsx or .zip; .pdf and anything unrecognized return null. */
export function parseFaacFilename(raw: string): ParsedFaacFilename | null {
  const name = decodeURIComponent(raw);
  const ext = name.toLowerCase().split(".").pop();
  if (ext !== "xlsx" && ext !== "zip") return null;

  const yearMatch = name.match(/(20\d{2})/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[1]);

  const base = name.slice(0, name.lastIndexOf(".")).toLowerCase();
  const tokens = base.split(/[^a-z]+/).filter(Boolean);
  const monthIdx = tokens.map((t) => MONTH_TOKENS[t]).filter((m): m is number => !!m);
  const isRange = /[a-z]+\s*-\s*[a-z]+/i.test(name) && monthIdx.length === 2;

  let months: number[];
  if (isRange) {
    const [a, b] = monthIdx;
    months = [];
    for (let m = a; m <= b; m++) months.push(m);
  } else {
    months = Array.from(new Set(monthIdx)).sort((x, y) => x - y);
  }
  if (months.length === 0) return null;
  return { year, months };
}
