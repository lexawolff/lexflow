-- Avisos por e-mail antes de apagar os dados de um teste vencido.
-- A exclusão só acontece depois que o último aviso tiver sido enviado.

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "trialDeletionFinalNoticeAt" TIMESTAMP(3),
ADD COLUMN     "trialDeletionNoticeAt" TIMESTAMP(3);
