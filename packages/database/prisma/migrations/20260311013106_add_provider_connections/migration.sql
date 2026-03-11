-- CreateTable
CREATE TABLE "provider_connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "base_url" VARCHAR(500) NOT NULL,
    "api_key" TEXT NOT NULL,
    "model_id" VARCHAR(200) NOT NULL,
    "model_small" VARCHAR(200),
    "dimension" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "provider_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_provider_connections_type_active" ON "provider_connections"("type", "is_active");

-- CreateIndex
CREATE INDEX "idx_conversations_user_updated" ON "conversations"("user_id", "status", "updated_at" DESC);
