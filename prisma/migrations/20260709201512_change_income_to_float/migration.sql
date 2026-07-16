/*
  Warnings:

  - You are about to alter the column `income` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "income" SET DATA TYPE DOUBLE PRECISION;
