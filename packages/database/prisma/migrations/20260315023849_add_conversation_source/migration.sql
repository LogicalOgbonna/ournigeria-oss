-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "source" VARCHAR(20) NOT NULL DEFAULT 'web';

-- Backfill existing Telegram conversations
UPDATE "conversations" SET "source" = 'telegram' WHERE "title" = 'Telegram Chat';
