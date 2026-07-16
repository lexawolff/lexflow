/*
  Warnings:

  - You are about to drop the column `priority` on the `Task` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "TaskType" ADD VALUE 'ATENDIMENTO';

-- DropIndex
DROP INDEX "Task_priority_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "priority",
ADD COLUMN     "googleEventId" TEXT,
ADD COLUMN     "location" TEXT;

-- CreateIndex
CREATE INDEX "Task_startsAt_idx" ON "Task"("startsAt");

-- CreateIndex
CREATE INDEX "Task_googleEventId_idx" ON "Task"("googleEventId");
