-- Data backfill: populate change_proposals.entity_role for rows created before the column
-- existed (or by an agent build that predates the write-path change). Runs automatically on
-- deploy via `prisma migrate deploy`, so no manual/SSH step is needed on any environment.
--
-- Mirrors the app-side hybrid resolver:
--   create                    -> proposed_value.position.role
--   official_positions target -> that position's own role
--   nigerian_officials target -> the official's preferred current position role
--   else                      -> unknown
-- then normalizes into the fixed bucket set (rep -> representative; anything else -> unknown).
--
-- Idempotent: only touches rows where entity_role IS NULL, so re-running is a no-op.
-- target_pk is compared as text (op.id::text = cp.target_pk) to avoid uuid-cast errors on any
-- non-uuid pointer value.

WITH raw AS (
  SELECT cp.id,
    CASE
      WHEN cp.change_kind = 'create'
        THEN lower(trim(cp.proposed_value -> 'position' ->> 'role'))
      WHEN cp.target_table = 'official_positions'
        THEN (
          SELECT lower(trim(op.role)) FROM official_positions op
          WHERE op.id::text = cp.target_pk
          LIMIT 1
        )
      WHEN cp.target_table = 'nigerian_officials'
        THEN (
          SELECT lower(trim(op.role)) FROM official_positions op
          WHERE op.official_id::text = cp.target_pk
            AND op.status = 'active'
            AND op.start_date <= CURRENT_DATE
            AND (op.end_date IS NULL OR op.end_date > CURRENT_DATE)
          ORDER BY op.start_date DESC
          LIMIT 1
        )
      ELSE NULL
    END AS role
  FROM change_proposals cp
  WHERE cp.entity_role IS NULL
)
UPDATE change_proposals cp
SET entity_role = CASE
  WHEN raw.role = 'rep' THEN 'representative'
  WHEN raw.role IN ('governor', 'senator', 'representative', 'mha', 'lga_chairman', 'councilor')
    THEN raw.role
  ELSE 'unknown'
END
FROM raw
WHERE cp.id = raw.id;
