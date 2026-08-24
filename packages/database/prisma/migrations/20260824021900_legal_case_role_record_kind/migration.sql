-- AlterTable
-- Plan 59: official's role in the matter (defendant|plaintiff|claimant|respondent|named_in)
-- + plan 58 §3.8 record kind (adjudicated|allegation|listing|appearance). Both nullable
-- (legacy rows unclassified); enforced by code-side enum coercion, not a check constraint.
ALTER TABLE "official_legal_cases" ADD COLUMN     "role" VARCHAR(20),
ADD COLUMN     "record_kind" VARCHAR(20);
