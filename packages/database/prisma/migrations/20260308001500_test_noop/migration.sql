-- DropIndex
DROP INDEX IF EXISTS "idx_messages_conversation_seq";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_ingestion_status_updated" ON "ingestion_records"("status", "updated_at");
