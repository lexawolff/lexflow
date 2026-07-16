/*
  Warnings:

  - You are about to drop the column `number` on the `Client` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "number",
ADD COLUMN     "addressNumber" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "govLogin" TEXT,
ADD COLUMN     "motherName" TEXT;
