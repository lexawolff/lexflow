-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "WorkPlanningPeriod" AS ENUM ('ESTA_SEMANA', 'ESTE_MES', 'DEPOIS');

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT,
    "caseId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkItemStatus" NOT NULL DEFAULT 'PENDENTE',
    "period" "WorkPlanningPeriod" NOT NULL DEFAULT 'ESTA_SEMANA',
    "position" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkItem_workspaceId_idx" ON "WorkItem"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkItem_clientId_idx" ON "WorkItem"("clientId");

-- CreateIndex
CREATE INDEX "WorkItem_caseId_idx" ON "WorkItem"("caseId");

-- CreateIndex
CREATE INDEX "WorkItem_status_idx" ON "WorkItem"("status");

-- CreateIndex
CREATE INDEX "WorkItem_period_idx" ON "WorkItem"("period");

-- CreateIndex
CREATE INDEX "WorkItem_position_idx" ON "WorkItem"("position");

-- CreateIndex
CREATE INDEX "WorkItem_dueDate_idx" ON "WorkItem"("dueDate");

-- CreateIndex
CREATE INDEX "WorkItem_workspaceId_period_status_position_idx" ON "WorkItem"("workspaceId", "period", "status", "position");

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
