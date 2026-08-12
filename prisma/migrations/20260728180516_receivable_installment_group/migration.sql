/*
  Warnings:

  - You are about to drop the column `installments` on the `Receivable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Receivable" DROP COLUMN "installments",
ADD COLUMN     "installmentGroupId" TEXT,
ADD COLUMN     "installmentNumber" INTEGER,
ADD COLUMN     "originalDueDate" TIMESTAMP(3),
ADD COLUMN     "totalInstallments" INTEGER;

-- CreateIndex
CREATE INDEX "Receivable_installmentGroupId_idx" ON "Receivable"("installmentGroupId");
