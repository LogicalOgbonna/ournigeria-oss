-- AlterTable: make phone_number nullable (Telegram users won't have one)
ALTER TABLE "users" ALTER COLUMN "phone_number" DROP NOT NULL;

-- AlterTable: add telegram_id column
ALTER TABLE "users" ADD COLUMN "telegram_id" VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");
