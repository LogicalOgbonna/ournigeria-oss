-- DropIndex
DROP INDEX "idx_messages_conversation_seq";

-- CreateIndex
CREATE INDEX "idx_ingestion_status_updated" ON "ingestion_records"("status", "updated_at");
