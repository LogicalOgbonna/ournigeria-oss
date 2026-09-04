-- RBAC + chain-of-trust audit logging (plan 62 phase 1).
-- Hand-authored (see CLAUDE.md: `migrate dev` is broken here; and the shared
-- dev DB makes `migrate diff --from-config-datasource` deltas untrustworthy).
-- Role DEFINITIONS live in code (@ournigeria/access); these tables hold
-- assignments and the tamper-evident audit chain.

-- CreateTable: role_assignments
CREATE TABLE "role_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "principal_type" VARCHAR(10) NOT NULL,
    "principal_id" UUID NOT NULL,
    "role" VARCHAR(40) NOT NULL,
    "scope" JSONB,
    "granted_by_id" UUID,
    "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,
    "revoked_by_id" UUID,
    "reason" VARCHAR(500),

    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_role_assignment_principal" ON "role_assignments"("principal_type", "principal_id");

-- Active-assignment uniqueness (re-grant after revoke allowed; history kept).
CREATE UNIQUE INDEX "uq_role_assignment_active"
    ON "role_assignments"("principal_type", "principal_id", "role")
    WHERE "revoked_at" IS NULL;

-- CreateTable: audit_events (append-only hash chain; seq derived under an
-- advisory lock — deliberately NOT a sequence/identity column).
CREATE TABLE "audit_events" (
    "seq" BIGINT NOT NULL,
    "id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ NOT NULL,
    "epoch" INTEGER NOT NULL DEFAULT 1,
    "actor_type" VARCHAR(10) NOT NULL,
    "actor_id" VARCHAR(64),
    "session_id" UUID,
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(400),
    "action" VARCHAR(60) NOT NULL,
    "target_type" VARCHAR(30),
    "target_id" VARCHAR(200),
    "diff" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "prev_hash" CHAR(64) NOT NULL,
    "hash" CHAR(64) NOT NULL,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("seq")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_audit_events_id" ON "audit_events"("id");
CREATE UNIQUE INDEX "uq_audit_events_hash" ON "audit_events"("hash");
CREATE INDEX "idx_audit_events_date" ON "audit_events"("occurred_at" DESC);
CREATE INDEX "idx_audit_events_actor" ON "audit_events"("actor_type", "actor_id");
CREATE INDEX "idx_audit_events_action" ON "audit_events"("action");
CREATE INDEX "idx_audit_events_target" ON "audit_events"("target_type", "target_id");

-- Append-only enforcement: audit_events is the tamper-evidence substrate.
-- Break-glass (DR only, logged as system.chain.restored):
--   ALTER TABLE audit_events DISABLE TRIGGER trg_audit_events_immutable;
CREATE OR REPLACE FUNCTION audit_events_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only (chain of trust)';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_events_immutable
  BEFORE UPDATE OR DELETE ON "audit_events"
  FOR EACH ROW EXECUTE FUNCTION audit_events_immutable();

-- Row-level triggers do NOT fire on TRUNCATE — guard it separately.
CREATE TRIGGER trg_audit_events_no_truncate
  BEFORE TRUNCATE ON "audit_events"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_events_immutable();

-- CreateTable: audit_anchors (external checkpoint receipts; mutable status)
CREATE TABLE "audit_anchors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "anchored_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "epoch" INTEGER NOT NULL,
    "head_seq" BIGINT NOT NULL,
    "head_hash" CHAR(64) NOT NULL,
    "event_count" BIGINT NOT NULL,
    "destination" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "receipt" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "audit_anchors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_audit_anchors_date" ON "audit_anchors"("anchored_at" DESC);

-- CreateTable: audit_erasure_keys (crypto-erasure; mutable BY DESIGN —
-- shredding the key is the erasure mechanism, the chain stays verifiable)
CREATE TABLE "audit_erasure_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subject_type" VARCHAR(30) NOT NULL,
    "subject_id" VARCHAR(64) NOT NULL,
    "key_ciphertext" VARCHAR(400),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shredded_at" TIMESTAMPTZ,

    CONSTRAINT "audit_erasure_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_erasure_subject" ON "audit_erasure_keys"("subject_type", "subject_id");

-- AlterTable: officials soft delete (spec §12)
ALTER TABLE "nigerian_officials" ADD COLUMN "deleted_at" TIMESTAMPTZ;
ALTER TABLE "nigerian_officials" ADD COLUMN "deleted_by_id" UUID;
ALTER TABLE "nigerian_officials" ADD COLUMN "deletion_reason" VARCHAR(500);

-- Phase-1 rollout seed: every existing admin becomes super_admin (zero lockout).
INSERT INTO "role_assignments" ("principal_type", "principal_id", "role", "granted_by_id", "reason")
SELECT 'staff', "id", 'super_admin', "id", 'phase-1 rollout seed (migration 20260902100000)'
FROM "admin_users"
ON CONFLICT ("principal_type", "principal_id", "role") WHERE "revoked_at" IS NULL DO NOTHING;
