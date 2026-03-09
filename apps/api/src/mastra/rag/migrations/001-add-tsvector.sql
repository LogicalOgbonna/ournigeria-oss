-- Add tsvector column and GIN index for BM25/hybrid search
-- This migration is idempotent (IF NOT EXISTS / IF NOT EXISTS checks)
-- Runs for all 4 vector index tables

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
      -- Add tsvector column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = idx_name AND column_name = 'tsv'
      ) THEN
        EXECUTE format(
          'ALTER TABLE %I ADD COLUMN tsv tsvector GENERATED ALWAYS AS (to_tsvector(''english'', COALESCE(metadata->>''text'', ''''))) STORED',
          idx_name
        );
      END IF;

      -- Create GIN index if it doesn't exist
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%s_tsv ON %I USING GIN(tsv)',
        replace(idx_name, '-', '_'),
        idx_name
      );
    END IF;
  END LOOP;
END
$$;
