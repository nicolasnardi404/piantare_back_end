/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `plant_locations` table. All the data in the column will be lost.
  - Made the column `imageUrl` on table `plant_updates` required. This step will fail if there are existing NULL values in that column.
  - Made the column `measurements` on table `plant_updates` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "plant_locations" DROP COLUMN "imageUrl";

-- AlterTable
ALTER TABLE "plant_updates" ALTER COLUMN "imageUrl" SET NOT NULL,
ALTER COLUMN "measurements" SET NOT NULL;
