-- AlterTable
ALTER TABLE "conversations"
ADD COLUMN "summary" TEXT,
ADD COLUMN "summary_up_to" INTEGER,
ADD COLUMN "last_agent_type" VARCHAR(20);
