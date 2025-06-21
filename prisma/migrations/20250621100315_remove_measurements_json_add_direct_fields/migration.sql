/*
  Warnings:

  - You are about to drop the column `measurements` on the `plant_updates` table. All the data in the column will be lost.
  - Added the required column `height` to the `plant_updates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `plant_updates` table without a default value. This is not possible if the table is not empty.

*/
-- First, add the new columns as nullable
ALTER TABLE "plant_updates" 
ADD COLUMN "height" DOUBLE PRECISION,
ADD COLUMN "width" DOUBLE PRECISION;

-- Update the existing rows, extracting data from the measurements JSON
UPDATE "plant_updates"
SET 
  "height" = CAST(measurements->>'height' AS DOUBLE PRECISION),
  "width" = CAST(measurements->>'width' AS DOUBLE PRECISION);

-- Now make the columns required
ALTER TABLE "plant_updates" 
ALTER COLUMN "height" SET NOT NULL,
ALTER COLUMN "width" SET NOT NULL;

-- Finally, drop the measurements column and make imageUrl nullable
ALTER TABLE "plant_updates" 
DROP COLUMN "measurements",
ALTER COLUMN "imageUrl" DROP NOT NULL;
