-- INEC ballot/register code for a party. Usually equals `acronym`, but can diverge
-- where our PK predates the register (our 'Accord' row is INEC ballot code 'A').
-- NOTE: the auto-generated diff also emitted unrelated pre-existing drift
-- (nigerian_wards VarChar widths, constraint renames); trimmed to this change only.
ALTER TABLE "political_parties" ADD COLUMN "ballot_code" VARCHAR(20);
