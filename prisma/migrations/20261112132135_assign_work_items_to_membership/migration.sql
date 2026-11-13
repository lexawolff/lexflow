/*
  Warnings:

  - Added the required column `assignedToMembershipId` to the `WorkItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Membership_workspaceId_idx";

-- AlterTable
ALTER TABLE "WorkItem" ADD COLUMN     "assignedToMembershipId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "WorkItem_assignedToMembershipId_idx" ON "WorkItem"("assignedToMembershipId");

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_assignedToMembershipId_fkey" FOREIGN KEY ("assignedToMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
