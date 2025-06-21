/*
  Warnings:

  - The values [ARVORES,ARVORES_FRUTIFERAS,CAPINS,FOLHAGENS_ALTAS,ARBUSTOS,TREPADEIRAS,AROMATICAS_E_COMESTIVEIS,PLANTAS_DE_FORRACAO,PLANTAS_AQUATICAS_OU_PALUSTRES] on the enum `PlantCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlantCategory_new" AS ENUM ('TREES', 'FRUIT_TREES', 'GRASSES', 'TALL_FOLIAGE', 'SHRUBS', 'CLIMBING_PLANTS', 'AROMATIC_AND_EDIBLE', 'GROUND_COVER', 'AQUATIC_OR_MARSH');
ALTER TABLE "plants" ALTER COLUMN "category" TYPE "PlantCategory_new" USING ("category"::text::"PlantCategory_new");
ALTER TYPE "PlantCategory" RENAME TO "PlantCategory_old";
ALTER TYPE "PlantCategory_new" RENAME TO "PlantCategory";
DROP TYPE "PlantCategory_old";
COMMIT;
