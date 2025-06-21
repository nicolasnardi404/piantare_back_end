/*
  Warnings:

  - You are about to drop the column `altura` on the `plants` table. All the data in the column will be lost.
  - You are about to drop the column `categoria` on the `plants` table. All the data in the column will be lost.
  - You are about to drop the column `especificacao` on the `plants` table. All the data in the column will be lost.
  - You are about to drop the column `nomeCientifico` on the `plants` table. All the data in the column will be lost.
  - You are about to drop the column `nomePopular` on the `plants` table. All the data in the column will be lost.
  - You are about to drop the column `origem` on the `plants` table. All the data in the column will be lost.
  - Added the required column `category` to the `plants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commonName` to the `plants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scientificName` to the `plants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plants" DROP COLUMN "altura",
DROP COLUMN "categoria",
DROP COLUMN "especificacao",
DROP COLUMN "nomeCientifico",
DROP COLUMN "nomePopular",
DROP COLUMN "origem",
ADD COLUMN     "category" "PlantCategory" NOT NULL,
ADD COLUMN     "commonName" TEXT NOT NULL,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "scientificName" TEXT NOT NULL,
ADD COLUMN     "specification" TEXT;
