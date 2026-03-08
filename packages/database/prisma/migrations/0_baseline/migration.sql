-- Baseline migration: captures the full state of the database as of 2026-03-08.
-- This includes all Prisma-managed tables + non-Prisma tables (vector chunks)
-- so that the migration history is fully in sync with the actual DB.
--
-- This migration is marked as "already applied" and will NOT be run against
-- existing databases. It only serves as the baseline for future migrations.

-- ============================================================
-- Enums
-- ============================================================

CREATE TYPE "message_role" AS ENUM ('user', 'assistant', 'system');
CREATE TYPE "conversation_status" AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE "conversation_visibility" AS ENUM ('private', 'public');
CREATE TYPE "document_status" AS ENUM ('unprocessed', 'parsing', 'parsed', 'indexing', 'indexed', 'error');
CREATE TYPE "document_file_type" AS ENUM ('pdf', 'xlsx', 'xls', 'csv', 'docx');
CREATE TYPE "notification_type" AS ENUM ('incident', 'announcement', 'info', 'warning');
CREATE TYPE "banner_type" AS ENUM ('incident', 'announcement', 'warning');
CREATE TYPE "feedback_status" AS ENUM ('new', 'reviewing', 'resolved', 'archived');
CREATE TYPE "feedback_category" AS ENUM ('bug', 'feature', 'general', 'data_issue');

-- ============================================================
-- Prisma-managed tables
-- ============================================================

CREATE TABLE "nigerian_states" (
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "geopolitical_zone" VARCHAR(20) NOT NULL,
    "capital" VARCHAR(50) NOT NULL,
    CONSTRAINT "nigerian_states_pkey" PRIMARY KEY ("code")
);
CREATE UNIQUE INDEX "nigerian_states_name_key" ON "nigerian_states"("name");

CREATE TABLE "admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "last_login_at" TIMESTAMPTZ,
    "created_by_id" UUID,
    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "admin_users_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone_number" VARCHAR(20),
    "telegram_id" VARCHAR(20),
    "name" VARCHAR(100),
    "email" VARCHAR(255),
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banned_at" TIMESTAMPTZ,
    "ban_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "preferences" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

CREATE TABLE "user_memories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "user_memories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "user_memories_user_id_key_key" ON "user_memories"("user_id", "key");
CREATE INDEX "idx_user_memory_user" ON "user_memories"("user_id");

CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone_number" VARCHAR(20) NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_otp_phone_active" ON "otp_verifications"("phone_number", "verified", "expires_at");

CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL DEFAULT 'New Conversation',
    "status" "conversation_status" NOT NULL DEFAULT 'active',
    "visibility" "conversation_visibility" NOT NULL DEFAULT 'private',
    "slug" VARCHAR(250),
    "shared_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "mentioned_states" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mentioned_years" SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],
    "summary" TEXT,
    "summary_up_to" INTEGER,
    "last_agent_type" VARCHAR(20),
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "conversations_slug_key" ON "conversations"("slug");
CREATE INDEX "idx_conversations_user_active" ON "conversations"("user_id", "status", "created_at" DESC);
CREATE INDEX "idx_conversations_public" ON "conversations"("visibility", "status");

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
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "messages_conversation_id_sequence_number_key" ON "messages"("conversation_id", "sequence_number");
CREATE INDEX "idx_messages_created" ON "messages"("created_at" DESC);

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
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "documents_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "documents_file_path_key" ON "documents"("file_path");
CREATE INDEX "idx_documents_state_year" ON "documents"("state_code", "fiscal_year");

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
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "source_references_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "source_references_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "source_references_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "source_references_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON UPDATE CASCADE
);
CREATE INDEX "idx_source_refs_message" ON "source_references"("message_id");
CREATE INDEX "idx_source_refs_document" ON "source_references"("document_id");
CREATE INDEX "idx_source_refs_state_year" ON "source_references"("state_code", "fiscal_year");

CREATE TABLE "budget_summaries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "state_code" VARCHAR(30) NOT NULL,
    "fiscal_year" SMALLINT NOT NULL,
    "total_budget" BIGINT NOT NULL,
    "allocations" JSONB NOT NULL DEFAULT '{}',
    "source_document_id" UUID,
    "population_estimate" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "budget_summaries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "budget_summaries_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON UPDATE CASCADE,
    CONSTRAINT "budget_summaries_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "documents"("id") ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "budget_summaries_state_code_fiscal_year_key" ON "budget_summaries"("state_code", "fiscal_year");
CREATE INDEX "idx_budget_summaries_state" ON "budget_summaries"("state_code");
CREATE INDEX "idx_budget_summaries_year" ON "budget_summaries"("fiscal_year");
CREATE INDEX "idx_budget_summaries_year_total" ON "budget_summaries"("fiscal_year", "total_budget" DESC);

CREATE TABLE "query_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "message_id" UUID,
    "query_category" VARCHAR(50),
    "queried_states" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "queried_years" SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],
    "query_text" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "query_analytics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "query_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "query_analytics_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "idx_analytics_category_date" ON "query_analytics"("query_category", "created_at" DESC);
CREATE INDEX "idx_analytics_date" ON "query_analytics"("created_at" DESC);

CREATE TABLE "ingestion_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pipeline" VARCHAR(30) NOT NULL,
    "file_path" VARCHAR(1000) NOT NULL,
    "file_hash" VARCHAR(64) NOT NULL,
    "s3_etag" VARCHAR(128),
    "source_type" VARCHAR(10) NOT NULL,
    "identity" JSONB NOT NULL DEFAULT '{}',
    "chunks" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'processing',
    "error_msg" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "ingestion_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_ingestion_pipeline_filepath" ON "ingestion_records"("pipeline", "file_path");
CREATE INDEX "idx_ingestion_pipeline_status" ON "ingestion_records"("pipeline", "status");
CREATE INDEX "idx_ingestion_pipeline_etag" ON "ingestion_records"("pipeline", "s3_etag");
CREATE INDEX "idx_ingestion_status_updated" ON "ingestion_records"("status", "updated_at");

CREATE TABLE "ingestion_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pipeline" VARCHAR(30) NOT NULL,
    "trigger" VARCHAR(20) NOT NULL,
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "processed_files" INTEGER NOT NULL DEFAULT 0,
    "skipped_files" INTEGER NOT NULL DEFAULT 0,
    "error_files" INTEGER NOT NULL DEFAULT 0,
    "total_chunks" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "error_msg" TEXT,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "completed_at" TIMESTAMPTZ,
    CONSTRAINT "ingestion_runs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_runs_pipeline_started" ON "ingestion_runs"("pipeline", "started_at" DESC);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link_text" VARCHAR(100),
    "link_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "idx_notifications_user_unread" ON "notifications"("user_id", "read", "created_at" DESC);
CREATE INDEX "idx_notifications_user_date" ON "notifications"("user_id", "created_at" DESC);

CREATE TABLE "system_banners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "banner_type" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "link_text" VARCHAR(100),
    "link_url" VARCHAR(500),
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "system_banners_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_banners_active" ON "system_banners"("active", "expires_at");

CREATE TABLE "banner_dismissals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "banner_id" UUID NOT NULL,
    "dismissed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "banner_dismissals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "banner_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "banner_dismissals_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "system_banners"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "banner_dismissals_user_id_banner_id_key" ON "banner_dismissals"("user_id", "banner_id");

CREATE TABLE "system_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(500),
    "category" VARCHAR(50) NOT NULL,
    "value_type" VARCHAR(20) NOT NULL DEFAULT 'string',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_by" UUID,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "idx_settings_category" ON "system_settings"("category");

CREATE TABLE "feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category" "feedback_category" NOT NULL DEFAULT 'general',
    "subject" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "feedback_status" NOT NULL DEFAULT 'new',
    "admin_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "idx_feedback_user_date" ON "feedback"("user_id", "created_at" DESC);
CREATE INDEX "idx_feedback_status_date" ON "feedback"("status", "created_at" DESC);

CREATE TABLE "feedback_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "feedback_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "s3_key" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "feedback_attachments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feedback_attachments_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "idx_feedback_attachments_feedback" ON "feedback_attachments"("feedback_id");

-- NOTE: The following tables are NOT managed by Prisma migrations.
-- They are created/managed at runtime by Mastra PgVector (ingestion pipeline):
--   - budget_chunks
--   - corruption_chunks
--   - govspend_chunks
-- Do NOT add or drop these tables via Prisma migrations.
