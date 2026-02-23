/*
  Warnings:

  - You are about to drop the column `administration` on the `budget_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `agriculture` on the `budget_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `education` on the `budget_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `health` on the `budget_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `infrastructure` on the `budget_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `other` on the `budget_summaries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "budget_summaries" DROP COLUMN "administration",
DROP COLUMN "agriculture",
DROP COLUMN "education",
DROP COLUMN "health",
DROP COLUMN "infrastructure",
DROP COLUMN "other",
ADD COLUMN     "allocations" JSONB NOT NULL DEFAULT '{}';
