-- CreateEnum
CREATE TYPE "message_role" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "conversation_status" AS ENUM ('active', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "document_status" AS ENUM ('unprocessed', 'parsing', 'parsed', 'indexing', 'indexed', 'error');

-- CreateEnum
CREATE TYPE "document_file_type" AS ENUM ('pdf', 'xlsx', 'xls', 'csv', 'docx');

-- CreateTable
CREATE TABLE "nigerian_states" (
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "geopolitical_zone" VARCHAR(20) NOT NULL,
    "capital" VARCHAR(50) NOT NULL,

    CONSTRAINT "nigerian_states_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferences" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL DEFAULT 'New Conversation',
    "status" "conversation_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mentioned_states" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mentioned_years" SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "role" "message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "rich_content" JSONB,
    "model_used" VARCHAR(50),
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "processing_time_ms" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "state_code" VARCHAR(30) NOT NULL,
    "fiscal_year" SMALLINT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_type" "document_file_type" NOT NULL,
    "file_size_bytes" BIGINT,
    "file_hash_sha256" VARCHAR(64),
    "status" "document_status" NOT NULL DEFAULT 'unprocessed',
    "error_details" TEXT,
    "parsed_at" TIMESTAMPTZ,
    "indexed_at" TIMESTAMPTZ,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "page_count" INTEGER,
    "extracted_sections" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_references" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "page_number" INTEGER,
    "line_start" INTEGER,
    "line_end" INTEGER,
    "sheet_name" VARCHAR(100),
    "section_heading" VARCHAR(300),
    "snippet" TEXT,
    "confidence_score" DECIMAL(3,2),
    "state_code" VARCHAR(30),
    "fiscal_year" SMALLINT,
    "relevance_rank" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_summaries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "state_code" VARCHAR(30) NOT NULL,
    "fiscal_year" SMALLINT NOT NULL,
    "total_budget" BIGINT NOT NULL,
    "education" BIGINT NOT NULL DEFAULT 0,
    "health" BIGINT NOT NULL DEFAULT 0,
    "infrastructure" BIGINT NOT NULL DEFAULT 0,
    "agriculture" BIGINT NOT NULL DEFAULT 0,
    "administration" BIGINT NOT NULL DEFAULT 0,
    "other" BIGINT NOT NULL DEFAULT 0,
    "source_document_id" UUID,
    "population_estimate" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "message_id" UUID,
    "query_category" VARCHAR(50),
    "queried_states" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "queried_years" SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],
    "query_text" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nigerian_states_name_key" ON "nigerian_states"("name");

-- CreateIndex
CREATE INDEX "idx_conversations_user_active" ON "conversations"("user_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_messages_conversation_seq" ON "messages"("conversation_id", "sequence_number");

-- CreateIndex
CREATE INDEX "idx_messages_created" ON "messages"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "messages_conversation_id_sequence_number_key" ON "messages"("conversation_id", "sequence_number");

-- CreateIndex
CREATE UNIQUE INDEX "documents_file_path_key" ON "documents"("file_path");

-- CreateIndex
CREATE INDEX "idx_documents_state_year" ON "documents"("state_code", "fiscal_year");

-- CreateIndex
CREATE INDEX "idx_source_refs_message" ON "source_references"("message_id");

-- CreateIndex
CREATE INDEX "idx_source_refs_document" ON "source_references"("document_id");

-- CreateIndex
CREATE INDEX "idx_source_refs_state_year" ON "source_references"("state_code", "fiscal_year");

-- CreateIndex
CREATE INDEX "idx_budget_summaries_state" ON "budget_summaries"("state_code");

-- CreateIndex
CREATE INDEX "idx_budget_summaries_year" ON "budget_summaries"("fiscal_year");

-- CreateIndex
CREATE INDEX "idx_budget_summaries_year_total" ON "budget_summaries"("fiscal_year", "total_budget" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "budget_summaries_state_code_fiscal_year_key" ON "budget_summaries"("state_code", "fiscal_year");

-- CreateIndex
CREATE INDEX "idx_analytics_category_date" ON "query_analytics"("query_category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_analytics_date" ON "query_analytics"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_references" ADD CONSTRAINT "source_references_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_references" ADD CONSTRAINT "source_references_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_references" ADD CONSTRAINT "source_references_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_summaries" ADD CONSTRAINT "budget_summaries_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_summaries" ADD CONSTRAINT "budget_summaries_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_analytics" ADD CONSTRAINT "query_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_analytics" ADD CONSTRAINT "query_analytics_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
