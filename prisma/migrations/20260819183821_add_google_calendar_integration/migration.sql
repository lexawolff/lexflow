/*
  Warnings:

  - A unique constraint covering the columns `[googleConnectionId,googleEventId]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TaskSource" AS ENUM ('LEXFLOW', 'GOOGLE_CALENDAR');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "googleCalendarId" TEXT,
ADD COLUMN     "googleConnectionId" TEXT,
ADD COLUMN     "source" "TaskSource" NOT NULL DEFAULT 'LEXFLOW';

-- CreateTable
CREATE TABLE "GoogleCalendarConnection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleAccountEmail" TEXT,
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "refreshTokenEncrypted" TEXT NOT NULL,
    "syncToken" TEXT,
    "syncFromGoogle" BOOLEAN NOT NULL DEFAULT true,
    "syncToGoogle" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "watchChannelId" TEXT,
    "watchResourceId" TEXT,
    "watchExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarConnection_watchChannelId_key" ON "GoogleCalendarConnection"("watchChannelId");

-- CreateIndex
CREATE INDEX "GoogleCalendarConnection_workspaceId_idx" ON "GoogleCalendarConnection"("workspaceId");

-- CreateIndex
CREATE INDEX "GoogleCalendarConnection_userId_idx" ON "GoogleCalendarConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarConnection_workspaceId_userId_key" ON "GoogleCalendarConnection"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "Task_endsAt_idx" ON "Task"("endsAt");

-- CreateIndex
CREATE INDEX "Task_source_idx" ON "Task"("source");

-- CreateIndex
CREATE INDEX "Task_googleConnectionId_idx" ON "Task"("googleConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_googleConnectionId_googleEventId_key" ON "Task"("googleConnectionId", "googleEventId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_googleConnectionId_fkey" FOREIGN KEY ("googleConnectionId") REFERENCES "GoogleCalendarConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleCalendarConnection" ADD CONSTRAINT "GoogleCalendarConnection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleCalendarConnection" ADD CONSTRAINT "GoogleCalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
