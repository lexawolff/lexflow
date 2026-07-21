/*
  Warnings:

  - You are about to drop the column `caseLink` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `protocolDate` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Case` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CaseOrigin" AS ENUM ('ADMINISTRATIVO', 'JUDICIAL', 'AMBOS');

-- CreateEnum
CREATE TYPE "AdministrativeStatus" AS ENUM ('NAO_APLICAVEL', 'REQUERIDO', 'EM_ANALISE', 'DEFERIDO', 'INDEFERIDO', 'RECURSO');

-- AlterTable
ALTER TABLE "Case" DROP COLUMN "caseLink",
DROP COLUMN "protocolDate",
DROP COLUMN "value",
ADD COLUMN     "administrativeNumber" TEXT,
ADD COLUMN     "administrativeProcess" TEXT,
ADD COLUMN     "administrativeRequestDate" TIMESTAMP(3),
ADD COLUMN     "administrativeStatus" "AdministrativeStatus" NOT NULL DEFAULT 'NAO_APLICAVEL',
ADD COLUMN     "benefitType" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "claimValue" DECIMAL(65,30),
ADD COLUMN     "distributionDate" TIMESTAMP(3),
ADD COLUMN     "judge" TEXT,
ADD COLUMN     "origin" "CaseOrigin" NOT NULL DEFAULT 'JUDICIAL',
ADD COLUMN     "state" TEXT;

-- CreateIndex
CREATE INDEX "Case_administrativeNumber_idx" ON "Case"("administrativeNumber");

-- CreateIndex
CREATE INDEX "Case_origin_idx" ON "Case"("origin");
