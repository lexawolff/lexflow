-- CreateEnum
CREATE TYPE "TimelineEntityType" AS ENUM ('CLIENT', 'CASE', 'DOCUMENT', 'FINANCIAL', 'TASK', 'NOTE');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('CLIENT_CREATED', 'CLIENT_UPDATED', 'CASE_CREATED', 'CASE_UPDATED', 'CASE_STATUS_CHANGED', 'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'FINANCIAL_CREATED', 'FINANCIAL_UPDATED', 'FINANCIAL_PAID', 'TASK_CREATED', 'TASK_COMPLETED', 'NOTE_CREATED', 'SYSTEM');

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entityType" "TimelineEntityType",
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimelineEvent_workspaceId_idx" ON "TimelineEvent"("workspaceId");

-- CreateIndex
CREATE INDEX "TimelineEvent_clientId_idx" ON "TimelineEvent"("clientId");

-- CreateIndex
CREATE INDEX "TimelineEvent_clientId_createdAt_idx" ON "TimelineEvent"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "TimelineEvent_entityType_entityId_idx" ON "TimelineEvent"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
