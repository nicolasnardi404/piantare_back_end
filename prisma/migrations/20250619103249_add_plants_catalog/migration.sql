-- CreateEnum
CREATE TYPE "PlantCategory" AS ENUM ('ARVORES', 'ARVORES_FRUTIFERAS', 'CAPINS', 'FOLHAGENS_ALTAS', 'ARBUSTOS', 'TREPADEIRAS', 'AROMATICAS_E_COMESTIVEIS', 'PLANTAS_DE_FORRACAO', 'PLANTAS_AQUATICAS_OU_PALUSTRES');

-- CreateTable
CREATE TABLE "plants" (
    "id" SERIAL NOT NULL,
    "nomePopular" TEXT NOT NULL,
    "nomeCientifico" TEXT NOT NULL,
    "origem" TEXT,
    "altura" TEXT,
    "especificacao" TEXT,
    "categoria" "PlantCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);
