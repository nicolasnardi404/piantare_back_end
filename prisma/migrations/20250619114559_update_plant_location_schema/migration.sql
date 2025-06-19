/*
  Warnings:

  - You are about to drop the column `species` on the `plant_locations` table. All the data in the column will be lost.
  - Added the required column `plantId` to the `plant_locations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plant_locations" DROP COLUMN "species",
ADD COLUMN     "plantId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "plant_locations" ADD CONSTRAINT "plant_locations_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
