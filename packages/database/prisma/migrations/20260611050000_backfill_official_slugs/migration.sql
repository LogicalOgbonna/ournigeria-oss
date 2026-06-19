-- Data backfill: give every nigerian_officials row a human-readable slug. Officials created
-- via the dashboard enrichment-apply path historically inserted (name) only, so their slug was
-- NULL and the public URL fell back to the UUID. Runs automatically on `prisma migrate deploy`
-- (API boot) — no SSH/box step (the boxes aren't reachable from dev).
--
-- Mirrors slugifyName() for ASCII names (the realistic case for the affected councilors):
-- &->and, lowercase, drop apostrophes/periods, non-alphanumerics -> '-', trim dashes, cap 120.
-- (Pure-SQL can't NFKD-strip diacritics like slugifyName; rare accented names just get '-'
-- where an accent was — still a valid, working URL.)
--
-- COLLISION-SAFE BY CONSTRUCTION (so it can never violate the unique index and fail the deploy):
--   * a base slug is taken only when it's unique within this batch AND not already in use;
--   * otherwise the row gets `base-<32-hex-of-id>`, which is unique because the id is unique
--     and existing slugs never carry a 32-hex suffix.
-- Idempotent: only touches rows where slug IS NULL.

WITH cand AS (
  SELECT o.id,
    NULLIF(
      regexp_replace(
        left(
          regexp_replace(
            regexp_replace(
              regexp_replace(lower(replace(o.name, '&', ' and ')), '[''’.]', '', 'g'),
              '[^a-z0-9]+', '-', 'g'),
            '^-+|-+$', '', 'g'),
          120),
        '-+$', '', 'g'),
      '') AS base
  FROM nigerian_officials o
  WHERE o.slug IS NULL
),
ranked AS (
  SELECT id, base, row_number() OVER (PARTITION BY base ORDER BY id) AS rn FROM cand
)
UPDATE nigerian_officials o
SET slug = CASE
  WHEN r.base IS NULL
    THEN 'official-' || left(replace(o.id::text, '-', ''), 8)
  WHEN r.rn = 1 AND NOT EXISTS (SELECT 1 FROM nigerian_officials e WHERE e.slug = r.base)
    THEN r.base
  ELSE left(r.base, 120) || '-' || replace(o.id::text, '-', '')
END
FROM ranked r
WHERE o.id = r.id;
