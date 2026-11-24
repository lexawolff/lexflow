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
  runCronJob,
} from "@/lib/cron-route";

export const dynamic = "force-dynamic";

export function GET(
  request: NextRequest,
) {
  return runCronJob(
    request,
    "avisar e excluir testes vencidos",
    async () => {
      // Uma falha nos avisos não impede excluir quem já foi avisado.
      const notices = await sendTrialDeletionNotices().catch(() => {
        console.error("Falha ao enviar avisos de exclusão de testes vencidos.");
        return { sent: 0, skipped: 0, failed: -1 };
      });

      return {
        notices,
        deletion: await deleteExpiredTrialWorkspaces(),
      };
    },
  );
}
