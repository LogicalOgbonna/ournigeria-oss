import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Pool } from "pg";

export interface ChunkMetadata {
  id: string;
  metadata: Record<string, unknown>;
  text?: string;
}

const VALID_TABLES = [
  "budget_chunks",
  "corruption_chunks",
  "govspend_chunks",
  "faac_chunks",
] as const;

type ChunkTable = (typeof VALID_TABLES)[number];

@Injectable()
export class ChunkReader implements OnModuleDestroy {
  private readonly logger = new Logger(ChunkReader.name);
  private pool: Pool | null = null;
  private verifiedTables = new Set<string>();

  private getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 3,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
      });
    }
    return this.pool;
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  private validateTable(table: string): asserts table is ChunkTable {
    if (!VALID_TABLES.includes(table as ChunkTable)) {
      throw new Error(
        `Invalid table name: ${table}. Must be one of: ${VALID_TABLES.join(", ")}`,
      );
    }
  }

  private async verifySchema(table: ChunkTable): Promise<void> {
    if (this.verifiedTables.has(table)) return;

    const pool = this.getPool();
    const result = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [table],
    );

    const columns = new Set(result.rows.map((r: { column_name: string }) => r.column_name));
    if (!columns.has("id") || !columns.has("metadata")) {
      throw new Error(
        `Table ${table} missing required columns (id, metadata). Found: ${[...columns].join(", ")}`,
      );
    }

    this.verifiedTables.add(table);
    this.logger.log(`Schema verified for ${table}`);
  }

  async readChunks(
    table: string,
    lastId?: string,
    limit = 50,
  ): Promise<ChunkMetadata[]> {
    this.validateTable(table);
    await this.verifySchema(table);

    const pool = this.getPool();
    const result = lastId
      ? await pool.query(
          `SELECT id, metadata FROM "${table}" WHERE id > $1 ORDER BY id LIMIT $2`,
          [lastId, limit],
        )
      : await pool.query(
          `SELECT id, metadata FROM "${table}" ORDER BY id LIMIT $1`,
          [limit],
        );

    return result.rows.map((r: { id: string; metadata: unknown }) => ({
      id: r.id,
      metadata:
        typeof r.metadata === "string"
          ? JSON.parse(r.metadata)
          : (r.metadata as Record<string, unknown>),
    }));
  }

  async readChunksWithText(
    table: string,
    lastId?: string,
    limit = 50,
  ): Promise<ChunkMetadata[]> {
    this.validateTable(table);
    await this.verifySchema(table);

    const pool = this.getPool();
    const result = lastId
      ? await pool.query(
          `SELECT id, metadata, metadata->>'text' AS text FROM "${table}" WHERE id > $1 ORDER BY id LIMIT $2`,
          [lastId, limit],
        )
      : await pool.query(
          `SELECT id, metadata, metadata->>'text' AS text FROM "${table}" ORDER BY id LIMIT $1`,
          [limit],
        );

    return result.rows.map((r: { id: string; metadata: unknown; text?: string }) => ({
      id: r.id,
      metadata:
        typeof r.metadata === "string"
          ? JSON.parse(r.metadata)
          : (r.metadata as Record<string, unknown>),
      text: r.text,
    }));
  }

  async countChunks(table: string): Promise<number> {
    this.validateTable(table);

    const pool = this.getPool();
    const result = await pool.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    return result.rows[0].count;
  }
}
