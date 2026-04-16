-- AlterTable
ALTER TABLE "faac_disbursements" ADD COLUMN     "total_augmentation" DECIMAL(20,2),
ADD COLUMN     "total_solid_mineral" DECIMAL(20,2);

-- AlterTable
ALTER TABLE "faac_fgn_details" ADD COLUMN     "augmentation" DECIMAL(20,2),
ADD COLUMN     "solid_mineral" DECIMAL(20,2),
ALTER COLUMN "exchange_gain" DROP NOT NULL;

-- AlterTable
ALTER TABLE "faac_lga_allocations" ADD COLUMN     "augmentation" DECIMAL(20,2),
ADD COLUMN     "solid_mineral" DECIMAL(20,2),
ALTER COLUMN "deduction" DROP NOT NULL,
ALTER COLUMN "exchange_gain" DROP NOT NULL,
ALTER COLUMN "emtl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "faac_state_allocations" ADD COLUMN     "augmentation" DECIMAL(20,2),
ADD COLUMN     "solid_mineral" DECIMAL(20,2),
ALTER COLUMN "exchange_gain" DROP NOT NULL,
ALTER COLUMN "total_exchange_gain" DROP NOT NULL,
ALTER COLUMN "emtl" DROP NOT NULL;
