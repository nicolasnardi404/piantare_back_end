-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';

-- DropForeignKey
ALTER TABLE "plant_locations" DROP CONSTRAINT "plant_locations_companyId_fkey";

-- AlterTable
ALTER TABLE "plant_locations" ALTER COLUMN "companyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "plant_locations" ADD CONSTRAINT "plant_locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
