import type {
  NextRequest,
} from "next/server";

import {
  deleteExpiredTrialWorkspaces,
} from "@/features/settings/services/delete-expired-trials";

import {
  runCronJob,
} from "@/lib/cron-route";

export const dynamic = "force-dynamic";

export function GET(
  request: NextRequest,
) {
  return runCronJob(
    request,
    "excluir testes vencidos",
    () => deleteExpiredTrialWorkspaces(),
  );
}
