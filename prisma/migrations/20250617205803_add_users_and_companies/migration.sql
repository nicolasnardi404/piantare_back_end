/*
  Warnings:

  - Added the required column `companyId` to the `plant_locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `plant_locations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FARMER', 'COMPANY_ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FARMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- Create a default company for existing plants
INSERT INTO "companies" ("name", "email", "description", "updatedAt")
VALUES ('Default Company', 'default@company.com', 'Default company for existing plants', CURRENT_TIMESTAMP);

-- Create a default user for existing plants
INSERT INTO "users" ("email", "password", "name", "role", "updatedAt")
VALUES ('default@farmer.com', 'change_this_password', 'Default Farmer', 'FARMER', CURRENT_TIMESTAMP);

-- Add the new columns to plant_locations
ALTER TABLE "plant_locations" ADD COLUMN "userId" INTEGER;
ALTER TABLE "plant_locations" ADD COLUMN "companyId" INTEGER;

-- Update existing plants to use the default user and company
UPDATE "plant_locations"
SET "userId" = (SELECT id FROM "users" WHERE email = 'default@farmer.com'),
    "companyId" = (SELECT id FROM "companies" WHERE email = 'default@company.com');

-- Now make the columns required
ALTER TABLE "plant_locations" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "plant_locations" ALTER COLUMN "companyId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_email_key" ON "companies"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_locations" ADD CONSTRAINT "plant_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_locations" ADD CONSTRAINT "plant_locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
