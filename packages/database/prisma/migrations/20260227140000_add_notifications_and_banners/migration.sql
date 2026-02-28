-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('incident', 'announcement', 'info', 'warning');

-- CreateEnum
CREATE TYPE "banner_type" AS ENUM ('incident', 'announcement', 'warning');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link_text" VARCHAR(100),
    "link_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banner_dismissals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "banner_id" UUID NOT NULL,
    "dismissed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banner_dismissals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_notifications_user_unread" ON "notifications"("user_id", "read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_notifications_user_date" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_banners_active" ON "system_banners"("active", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "banner_dismissals_user_id_banner_id_key" ON "banner_dismissals"("user_id", "banner_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_dismissals" ADD CONSTRAINT "banner_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner_dismissals" ADD CONSTRAINT "banner_dismissals_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "system_banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
