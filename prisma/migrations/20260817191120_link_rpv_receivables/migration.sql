/*
  Warnings:

  - A unique constraint covering the columns `[rpvId,type]` on the table `Receivable` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Receivable" ADD COLUMN     "rpvId" TEXT;

-- CreateIndex
CREATE INDEX "Receivable_rpvId_idx" ON "Receivable"("rpvId");

-- CreateIndex
CREATE UNIQUE INDEX "Receivable_rpvId_type_key" ON "Receivable"("rpvId", "type");

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_rpvId_fkey" FOREIGN KEY ("rpvId") REFERENCES "Rpv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
