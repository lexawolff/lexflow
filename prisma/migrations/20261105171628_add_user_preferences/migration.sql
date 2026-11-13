-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "agendaDefaultStatus" TEXT NOT NULL DEFAULT 'TODOS',
ADD COLUMN     "agendaItemsPerDay" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "agendaShowAttention" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "agendaShowCompleted" BOOLEAN NOT NULL DEFAULT true;
