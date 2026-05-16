-- `uq_budget_line` assumed a natural key (admin + economic + programme + …) unique per row.
-- State budget extracts have hundreds of distinct projects sharing that key (often blank
-- `programme_code`) with different descriptions/amounts — uniqueness on those columns is invalid.
-- Rows are identified by `id` (UUID); drop the unique index so seeds can load full detail.

DROP INDEX IF EXISTS "uq_budget_line";
