-- CreateEnum
CREATE TYPE "conversation_visibility" AS ENUM ('private', 'public');

-- AlterTable
ALTER TABLE "conversations"
  ADD COLUMN "visibility" "conversation_visibility" NOT NULL DEFAULT 'private',
  ADD COLUMN "slug" VARCHAR(250),
  ADD COLUMN "shared_at" TIMESTAMPTZ;

-- CreateIndex
CREATE UNIQUE INDEX "conversations_slug_key" ON "conversations"("slug");

-- CreateIndex
CREATE INDEX "idx_conversations_public" ON "conversations"("visibility", "status");
