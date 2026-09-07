-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(160) NOT NULL,
    "election_type" VARCHAR(30) NOT NULL,
    "year" INTEGER NOT NULL,
    "state_code" VARCHAR(30),
    "constituency_code" VARCHAR(80),
    "lga_code" VARCHAR(60),
    "party_acronym" VARCHAR(20),
    "official_election_id" UUID,
    "candidate_official_id" UUID,
    "candidate_name" VARCHAR(200) NOT NULL,
    "candidate_short_name" VARCHAR(60),
    "candidate_image_url" VARCHAR(500),
    "candidate_bio" TEXT,
    "running_mate_official_id" UUID,
    "running_mate_name" VARCHAR(200),
    "running_mate_image_url" VARCHAR(500),
    "faction_label" VARCHAR(100),
    "is_disputed" BOOLEAN NOT NULL DEFAULT false,
    "vision_line" TEXT,
    "fineprint" TEXT,
    "pull_quote" TEXT,
    "pull_quote_bg" VARCHAR(20),
    "brand_color" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "source_url" TEXT,
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_council_roles" (
    "code" VARCHAR(60) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_council_roles_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "campaign_council_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "role_code" VARCHAR(60) NOT NULL,
    "official_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "image_url" VARCHAR(500),
    "scope_level" VARCHAR(10) NOT NULL DEFAULT 'national',
    "state_code" VARCHAR(30),
    "lga_code" VARCHAR(60),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "end_reason" VARCHAR(30),
    "start_date" DATE,
    "end_date" DATE,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "source_url" TEXT,
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_council_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "subject" VARCHAR(20) NOT NULL DEFAULT 'ticket',
    "title" VARCHAR(100) NOT NULL,
    "blurb" VARCHAR(255),
    "cover_url" VARCHAR(500),
    "file_url" VARCHAR(500),
    "page_count" INTEGER,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "source_url" TEXT,
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "caption" VARCHAR(255),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "source_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_official_election_id_key" ON "campaigns"("official_election_id");

-- CreateIndex
CREATE INDEX "idx_campaigns_type_year" ON "campaigns"("election_type", "year");

-- CreateIndex
CREATE INDEX "idx_campaigns_party_type_year" ON "campaigns"("party_acronym", "election_type", "year");

-- CreateIndex
CREATE INDEX "idx_campaigns_state" ON "campaigns"("state_code");

-- CreateIndex
CREATE INDEX "idx_campaigns_constituency" ON "campaigns"("constituency_code");

-- CreateIndex
CREATE INDEX "idx_campaigns_lga" ON "campaigns"("lga_code");

-- CreateIndex
CREATE INDEX "idx_campaigns_candidate" ON "campaigns"("candidate_official_id");

-- CreateIndex
CREATE INDEX "idx_campaigns_running_mate" ON "campaigns"("running_mate_official_id");

-- CreateIndex
CREATE INDEX "idx_campaign_council_campaign" ON "campaign_council_members"("campaign_id");

-- CreateIndex
CREATE INDEX "idx_campaign_council_official" ON "campaign_council_members"("official_id");

-- CreateIndex
CREATE INDEX "idx_campaign_council_role" ON "campaign_council_members"("role_code");

-- CreateIndex
CREATE INDEX "idx_campaign_council_state_status" ON "campaign_council_members"("state_code", "status");

-- CreateIndex
CREATE INDEX "idx_campaign_council_lga_status" ON "campaign_council_members"("lga_code", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_campaign_documents_kind_subject" ON "campaign_documents"("campaign_id", "kind", "subject");

-- CreateIndex
CREATE INDEX "idx_campaign_media_campaign_type_order" ON "campaign_media"("campaign_id", "type", "display_order");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_party_acronym_fkey" FOREIGN KEY ("party_acronym") REFERENCES "political_parties"("acronym") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_constituency_code_fkey" FOREIGN KEY ("constituency_code") REFERENCES "nigerian_constituencies"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_lga_code_fkey" FOREIGN KEY ("lga_code") REFERENCES "nigerian_lgas"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_official_election_id_fkey" FOREIGN KEY ("official_election_id") REFERENCES "official_elections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_candidate_official_id_fkey" FOREIGN KEY ("candidate_official_id") REFERENCES "nigerian_officials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_running_mate_official_id_fkey" FOREIGN KEY ("running_mate_official_id") REFERENCES "nigerian_officials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_council_members" ADD CONSTRAINT "campaign_council_members_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_council_members" ADD CONSTRAINT "campaign_council_members_role_code_fkey" FOREIGN KEY ("role_code") REFERENCES "campaign_council_roles"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_council_members" ADD CONSTRAINT "campaign_council_members_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_council_members" ADD CONSTRAINT "campaign_council_members_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_council_members" ADD CONSTRAINT "campaign_council_members_lga_code_fkey" FOREIGN KEY ("lga_code") REFERENCES "nigerian_lgas"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_documents" ADD CONSTRAINT "campaign_documents_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_media" ADD CONSTRAINT "campaign_media_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================
-- Hand-written objects. Prisma cannot express any of these; the
-- create-migration guard protects the two indexes from future DROPs
-- (see PROTECTED_ARTIFACTS in scripts/create-migration.ts).
-- ============================================================

-- One ticket per (race, party, faction). NULLS NOT DISTINCT so two rows with a
-- NULL faction_label for the same race key collide — plain UNIQUE would let
-- every re-run of the seeder insert a duplicate canonical ticket.
CREATE UNIQUE INDEX "uq_campaigns_race_party_faction" ON "campaigns"
  ("election_type", "year", "state_code", "constituency_code", "lga_code", "party_acronym", "faction_label")
  NULLS NOT DISTINCT;

-- A ticket is one campaign; the running mate is a column, so the running-mate
-- election types from chk_elections_type are deliberately NOT allowed here.
ALTER TABLE "campaigns"
  ADD CONSTRAINT "chk_campaigns_election_type" CHECK ("election_type" IN
    ('presidential', 'gubernatorial', 'senatorial', 'house_of_reps', 'state_assembly', 'lga_chairman', 'councilor', 'other')),
  ADD CONSTRAINT "chk_campaigns_status" CHECK ("status" IN
    ('active', 'suspended', 'withdrawn', 'dissolved', 'concluded')),
  ADD CONSTRAINT "chk_campaigns_confidence" CHECK ("confidence" IN ('high', 'medium', 'low')),
  ADD CONSTRAINT "chk_campaigns_review_status" CHECK ("review_status" IN ('unreviewed', 'reviewed', 'disputed')),
  ADD CONSTRAINT "chk_campaigns_source_type" CHECK ("source_type" IN ('manual', 'agent', 'citizen', 'import'));

-- Council lifecycle follows official_positions: status = current state,
-- end_reason = why it ended. scope_level must agree with the geo columns or
-- "who covers Kano" silently misses rows.
ALTER TABLE "campaign_council_members"
  ADD CONSTRAINT "chk_campaign_council_scope_level" CHECK ("scope_level" IN ('national', 'state', 'lga')),
  ADD CONSTRAINT "chk_campaign_council_scope" CHECK (
    ("scope_level" = 'national' AND "state_code" IS NULL AND "lga_code" IS NULL) OR
    ("scope_level" = 'state'    AND "state_code" IS NOT NULL AND "lga_code" IS NULL) OR
    ("scope_level" = 'lga'      AND "lga_code" IS NOT NULL)),
  ADD CONSTRAINT "chk_campaign_council_status" CHECK ("status" IN ('active', 'ended')),
  ADD CONSTRAINT "chk_campaign_council_end_reason" CHECK ("end_reason" IS NULL OR "end_reason" IN
    ('resigned', 'removed', 'reshuffled', 'deceased', 'campaign_ended')),
  ADD CONSTRAINT "chk_campaign_council_confidence" CHECK ("confidence" IN ('high', 'medium', 'low')),
  ADD CONSTRAINT "chk_campaign_council_review_status" CHECK ("review_status" IN ('unreviewed', 'reviewed', 'disputed')),
  ADD CONSTRAINT "chk_campaign_council_source_type" CHECK ("source_type" IN ('manual', 'agent', 'citizen', 'import'));

-- A linked official holds a given role on a campaign once while active; the
-- seeder's find-or-create cannot double-insert them.
CREATE UNIQUE INDEX "uq_campaign_council_active_official" ON "campaign_council_members"
  ("campaign_id", "official_id", "role_code")
  WHERE "official_id" IS NOT NULL AND "status" = 'active';

ALTER TABLE "campaign_documents"
  ADD CONSTRAINT "chk_campaign_documents_kind" CHECK ("kind" IN ('manifesto', 'cv', 'achievements')),
  ADD CONSTRAINT "chk_campaign_documents_subject" CHECK ("subject" IN ('ticket', 'candidate', 'running_mate')),
  ADD CONSTRAINT "chk_campaign_documents_confidence" CHECK ("confidence" IN ('high', 'medium', 'low')),
  ADD CONSTRAINT "chk_campaign_documents_review_status" CHECK ("review_status" IN ('unreviewed', 'reviewed', 'disputed')),
  ADD CONSTRAINT "chk_campaign_documents_source_type" CHECK ("source_type" IN ('manual', 'agent', 'citizen', 'import'));

-- Every image slot the poster rail (163:2) and ticket page (1:987 / 1:1209) draw.
ALTER TABLE "campaign_media"
  ADD CONSTRAINT "chk_campaign_media_type" CHECK ("type" IN
    ('poster_candidate', 'poster_mate', 'card_candidate', 'card_mate', 'quote_photo', 'bio_photo', 'banner', 'logo', 'photo'));

-- Role catalog seed. Without these the first campaign_council_members insert
-- fails on the FK. Admin-extensible from the dashboard afterwards.
INSERT INTO "campaign_council_roles" ("code", "label", "sort_order") VALUES
  ('director_general',        'Director-General',        10),
  ('deputy_director_general', 'Deputy Director-General', 20),
  ('secretary',               'Secretary',               30),
  ('spokesperson',            'Spokesperson',            40),
  ('treasurer',               'Treasurer',               50),
  ('state_coordinator',       'State Coordinator',       60),
  ('lga_coordinator',         'LGA Coordinator',         70),
  ('women_leader',            'Women Leader',            80),
  ('youth_leader',            'Youth Leader',            90),
  ('member',                  'Member',                 100)
ON CONFLICT ("code") DO NOTHING;
