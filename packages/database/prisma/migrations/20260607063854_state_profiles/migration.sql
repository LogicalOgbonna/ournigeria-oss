-- CreateTable
CREATE TABLE "state_profiles" (
    "state_code" VARCHAR(30) NOT NULL,
    "about" TEXT,
    "motto" VARCHAR(120),
    "date_created" DATE,
    "land_area_sq_km" DECIMAL(10,2),
    "seal_image_url" TEXT,
    "flag_image_url" TEXT,
    "official_website_url" TEXT,
    "finance_ministry_url" TEXT,
    "assembly_website_url" TEXT,
    "inec_info_url" TEXT,
    "contact_address" TEXT,
    "contact_phone" VARCHAR(60),
    "contact_email" TEXT,
    "complaint_portal_url" TEXT,
    "whistleblower_url" TEXT,
    "twitter_url" TEXT,
    "facebook_url" TEXT,
    "instagram_url" TEXT,
    "youtube_url" TEXT,
    "news_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "state_profiles_pkey" PRIMARY KEY ("state_code")
);

-- AddForeignKey
ALTER TABLE "state_profiles" ADD CONSTRAINT "state_profiles_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
