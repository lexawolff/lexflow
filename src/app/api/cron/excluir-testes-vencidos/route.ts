import type {
  NextRequest,
} from "next/server";

import {
  deleteExpiredTrialWorkspaces,
} from "@/features/settings/services/delete-expired-trials";

import {
  sendTrialDeletionNotices,
} from "@/features/settings/services/send-trial-deletion-notices";

import {
  reconcileAsaasSubscriptions,
} from "@/features/settings/services/sync-asaas-subscription";

import {
  runCronJob,
} from "@/lib/cron-route";

export const dynamic = "force-dynamic";

export function GET(
  request: NextRequest,
) {
  return runCronJob(
    request,
    "conferir assinaturas, avisar e excluir testes vencidos",
    async () => {
      // Primeiro confere pagamentos: quem pagou não recebe aviso nem é apagado.
      const reconciliation = await reconcileAsaasSubscriptions().catch(() => {
        console.error("Falha na conferência diária das assinaturas.");
        return { synced: 0, failed: -1 };
      });

      // Uma falha nos avisos não impede excluir quem já foi avisado.
      const notices = await sendTrialDeletionNotices().catch(() => {
        console.error("Falha ao enviar avisos de exclusão de testes vencidos.");
        return { sent: 0, skipped: 0, failed: -1 };
      });

      return {
        reconciliation,
        notices,
        deletion: await deleteExpiredTrialWorkspaces(),
      };
    },
  );
}
