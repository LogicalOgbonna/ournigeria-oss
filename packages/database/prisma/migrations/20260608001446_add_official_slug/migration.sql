-- AlterTable
ALTER TABLE "nigerian_officials" ADD COLUMN     "slug" VARCHAR(160);

-- CreateIndex
CREATE UNIQUE INDEX "nigerian_officials_slug_key" ON "nigerian_officials"("slug");
