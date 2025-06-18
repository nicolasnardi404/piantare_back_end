-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'NEEDS_ATTENTION', 'SICK');

-- CreateTable
CREATE TABLE "plant_updates" (
    "id" SERIAL NOT NULL,
    "notes" TEXT,
    "imageUrl" TEXT,
    "healthStatus" "HealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "measurements" JSONB,
    "updateDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plantId" INTEGER NOT NULL,

    CONSTRAINT "plant_updates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "plant_updates" ADD CONSTRAINT "plant_updates_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plant_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
