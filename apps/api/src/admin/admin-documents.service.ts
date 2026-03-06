import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const START_YEAR = 2019;
const YEARS = Array.from(
  { length: new Date().getFullYear() - START_YEAR + 1 },
  (_, i) => String(START_YEAR + i),
);

interface CoverageCell {
  row_key: string;
  col_key: string;
  has_done: number;
  total_chunks: bigint;
  total_docs: bigint;
}

interface CoverageRow {
  label: string;
  coverage: Record<string, "full" | "partial" | "missing">;
  totalDocs: number;
  totalChunks: number;
}

interface CoverageResponse {
  pipeline: string;
  rowLabel: string;
  colLabel: string;
  columns: string[];
  data: CoverageRow[];
}

/**
 * Pipeline-specific config for building coverage matrix.
 * rowKey/colKey are JSONB identity fields — these are hardcoded constants,
 * never from user input, so safe for string interpolation in SQL.
 *
 * When colKey is null, all records per row are aggregated into a single
 * "Status" column (used for corruption where sections are too granular).
 */
const PIPELINE_CONFIG: Record<
  string,
  {
    rowKey: string;
    colKey: string | null;
    rowLabel: string;
    colLabel: string;
    columns?: string[];
    fixedRows?: string[];
  }
> = {
  budget: {
    rowKey: "state",
    colKey: "year",
    rowLabel: "State",
    colLabel: "Year",
    columns: YEARS,
  },
  faac: {
    rowKey: "year",
    colKey: "month",
    rowLabel: "Year",
    colLabel: "Month",
    columns: MONTHS,
    fixedRows: YEARS,
  },
  govspend: {
    rowKey: "year",
    colKey: "month",
    rowLabel: "Year",
    colLabel: "Month",
    columns: MONTHS,
    fixedRows: YEARS,
  },
  corruption: {
    rowKey: "official",
    colKey: null,
    rowLabel: "Official",
    colLabel: "Status",
  },
};

@Injectable()
export class AdminDocumentsService {
  constructor(private prisma: PrismaService) {}

  async getCoverage(pipeline: string): Promise<CoverageResponse> {
    const config = PIPELINE_CONFIG[pipeline];
    if (!config) {
      throw new BadRequestException(
        `Unknown pipeline: ${pipeline}. Valid: ${Object.keys(PIPELINE_CONFIG).join(", ")}`,
      );
    }

    // When colKey is null, aggregate everything per row into a single column
    const colExpr = config.colKey
      ? `COALESCE(identity->>'${config.colKey}', 'unknown')`
      : `'Status'`;

    const cells = await this.prisma.$queryRawUnsafe<CoverageCell[]>(
      `SELECT
        COALESCE(identity->>'${config.rowKey}', 'unknown') AS row_key,
        ${colExpr} AS col_key,
        MAX(CASE WHEN status = 'done' THEN 1 ELSE 0 END)::int AS has_done,
        SUM(chunks)::bigint AS total_chunks,
        COUNT(*)::bigint AS total_docs
      FROM ingestion_records
      WHERE pipeline = $1
      GROUP BY 1, 2`,
      pipeline,
    );

    // Filter out the _index pseudo-official from corruption
    const filteredCells =
      pipeline === "corruption"
        ? cells.filter((c) => c.row_key !== "_index")
        : cells;

    // Determine columns
    let columns: string[];
    if (config.columns) {
      columns = config.columns;
    } else if (!config.colKey) {
      columns = ["Status"];
    } else {
      const colSet = new Set(filteredCells.map((c) => c.col_key));
      columns = [...colSet].sort();
    }

    // Determine expected rows
    let expectedRows: string[];
    if (config.fixedRows) {
      expectedRows = config.fixedRows;
    } else {
      const rowSet = new Set(filteredCells.map((c) => c.row_key));
      expectedRows = [...rowSet].sort();
    }

    // Build lookup: row_key → col_key → cell
    const lookup = new Map<string, Map<string, CoverageCell>>();
    for (const cell of filteredCells) {
      if (!lookup.has(cell.row_key)) lookup.set(cell.row_key, new Map());
      lookup.get(cell.row_key)!.set(cell.col_key, cell);
    }

    // Build rows
    const data: CoverageRow[] = expectedRows.map((rowKey) => {
      const rowCells = lookup.get(rowKey);
      const coverage: Record<string, "full" | "partial" | "missing"> = {};
      let totalDocs = 0;
      let totalChunks = 0;

      for (const col of columns) {
        const cell = rowCells?.get(col);
        if (!cell) {
          coverage[col] = "missing";
        } else if (cell.has_done === 1 && Number(cell.total_chunks) > 0) {
          coverage[col] = "full";
        } else {
          coverage[col] = "partial";
        }
        if (cell) {
          totalDocs += Number(cell.total_docs);
          totalChunks += Number(cell.total_chunks);
        }
      }

      return { label: rowKey, coverage, totalDocs, totalChunks };
    });

    return {
      pipeline,
      rowLabel: config.rowLabel,
      colLabel: config.colLabel,
      columns,
      data,
    };
  }
}
