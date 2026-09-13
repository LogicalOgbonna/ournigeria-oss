-- Plan 68: elections as a first-class entity. One row = one scheduled
-- election EVENT (nationwide or scoped); campaigns/official_elections gain a
-- nullable election_id FK saying which event they belong to. Additive only —
-- old code runs against the new schema unchanged.

-- CreateTable
CREATE TABLE "elections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(160) NOT NULL,
    "office" VARCHAR(30) NOT NULL,
    "year" INTEGER NOT NULL,
    "round" VARCHAR(20) NOT NULL DEFAULT 'general',
    "election_date" DATE,
    "date_precision" VARCHAR(10) NOT NULL DEFAULT 'year',
    "label" VARCHAR(120),
    "state_code" VARCHAR(30),
    "constituency_code" VARCHAR(80),
    "lga_code" VARCHAR(60),
    "ward_code" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "source_url" TEXT,
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "reviewed_by" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "election_excluded_states" (
    "election_id" UUID NOT NULL,
    "state_code" VARCHAR(30) NOT NULL,

    CONSTRAINT "election_excluded_states_pkey" PRIMARY KEY ("election_id", "state_code")
);

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "election_id" UUID;

-- AlterTable
ALTER TABLE "official_elections" ADD COLUMN "election_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "elections_slug_key" ON "elections"("slug");

-- CreateIndex
CREATE INDEX "idx_campaigns_election" ON "campaigns"("election_id");

-- CreateIndex
CREATE INDEX "idx_elections_participation" ON "official_elections"("election_id");

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_constituency_code_fkey" FOREIGN KEY ("constituency_code") REFERENCES "nigerian_constituencies"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_lga_code_fkey" FOREIGN KEY ("lga_code") REFERENCES "nigerian_lgas"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_ward_code_fkey" FOREIGN KEY ("ward_code") REFERENCES "nigerian_wards"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_excluded_states" ADD CONSTRAINT "election_excluded_states_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_excluded_states" ADD CONSTRAINT "election_excluded_states_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
-- Restrict, not SetNull: a hard delete of a linked election must fail loudly
-- until the rows are repointed — same stance as the official/election FKs on
-- campaigns (slug-alias invariant, CLAUDE.md).
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_elections" ADD CONSTRAINT "official_elections_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ============================================================
-- Hand-written objects. Prisma cannot express any of these; they are
-- documented in the Election model header (elections.prisma) and must be
-- audited on every later diff.
-- ============================================================

-- One event per (office, cycle, round, scope). NULLS NOT DISTINCT so two
-- nationwide rows (all-null scope) for the same office/year/round collide.
CREATE UNIQUE INDEX "uq_elections_event" ON "elections"
  ("office", "year", "round", "state_code", "constituency_code", "lga_code", "ward_code")
  NULLS NOT DISTINCT;

-- campaigns.election_type vocabulary MINUS 'other' (D10.6: the office map
-- can't emit it and awanaija drops unknown offices silently).
ALTER TABLE "elections"
  ADD CONSTRAINT "chk_elections_office" CHECK ("office" IN
    ('presidential', 'gubernatorial', 'senatorial', 'house_of_reps', 'state_assembly', 'lga_chairman', 'councilor')),
  ADD CONSTRAINT "chk_elections_status" CHECK ("status" IN
    ('scheduled', 'postponed', 'concluded', 'cancelled')),
  ADD CONSTRAINT "chk_elections_round" CHECK ("round" IN
    ('general', 'runoff', 'supplementary', 'rerun', 'bye')),
  -- D10.3 as amended by E1.2/E1.4: ONE legal encoding per precision — year ⇒
  -- date NULL; month ⇒ date = YYYY-MM-01; day ⇒ full date. Deliberately NO
  -- year-equality clause: `year` is the cycle key, not the poll calendar year.
  ADD CONSTRAINT "chk_elections_date_encoding" CHECK (
    ("date_precision" = 'year' AND "election_date" IS NULL) OR
    ("date_precision" IN ('month', 'day') AND "election_date" IS NOT NULL AND
     ("date_precision" <> 'month' OR EXTRACT(DAY FROM "election_date") = 1))),
  ADD CONSTRAINT "chk_elections_confidence" CHECK ("confidence" IN ('high', 'medium', 'low')),
  ADD CONSTRAINT "chk_elections_review_status" CHECK ("review_status" IN ('unreviewed', 'reviewed', 'disputed')),
  ADD CONSTRAINT "chk_elections_source_type" CHECK ("source_type" IN ('manual', 'agent', 'citizen', 'import'));

-- Gate read path: published upcoming rows only. `published` is constant
-- inside the partial index, so index the filter column alone (D10.8).
CREATE INDEX "idx_elections_gate" ON "elections" ("year") WHERE "published";
