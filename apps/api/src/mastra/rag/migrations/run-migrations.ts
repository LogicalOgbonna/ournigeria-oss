import { Pool } from "pg";

const ADD_TSVECTOR_SQL = `
DO $$
DECLARE
  idx_name TEXT;
  idx_names TEXT[] := ARRAY[
    current_setting('app.vector_index_budget', true),
    current_setting('app.vector_index_corruption', true),
    current_setting('app.vector_index_govspend', true),
    current_setting('app.vector_index_faac', true)
  ];
BEGIN
  FOREACH idx_name IN ARRAY idx_names LOOP
    IF idx_name IS NOT NULL AND idx_name != '' THEN
      -- Skip if the table does not exist yet (created by ingest pipeline)
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = idx_name
      ) THEN
        RAISE NOTICE 'Table % does not exist yet, skipping', idx_name;
        CONTINUE;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = idx_name AND column_name = 'tsv'
      ) THEN
        EXECUTE format(
          'ALTER TABLE %I ADD COLUMN tsv tsvector GENERATED ALWAYS AS (to_tsvector(''english'', COALESCE(metadata->>''text'', ''''))) STORED',
          idx_name
        );
      END IF;
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%s_tsv ON %I USING GIN(tsv)',
        replace(idx_name, '-', '_'),
        idx_name
      );
    END IF;
  END LOOP;
END
$$;
`;

export async function runRagMigrations(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const indexNames = [
      process.env.VECTOR_INDEX_BUDGET,
      process.env.VECTOR_INDEX_CORRUPTION,
      process.env.VECTOR_INDEX_GOVSPEND,
      process.env.VECTOR_INDEX_FAAC,
    ].filter(Boolean);

    const client = await pool.connect();
    try {
      const keys = [
        "app.vector_index_budget",
        "app.vector_index_corruption",
        "app.vector_index_govspend",
        "app.vector_index_faac",
      ];
      for (const [i, name] of indexNames.entries()) {
        await client.query(`SET ${keys[i]} = '${name}'`);
      }

      await client.query(ADD_TSVECTOR_SQL);
      console.log("[rag-migrations] tsvector migration completed successfully");
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn("[rag-migrations] Migration failed (non-fatal):", err);
  } finally {
    await pool.end();
  }
}
