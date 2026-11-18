import type {
  NextRequest,
} from "next/server";

import {
  deleteExpiredUnconfirmedSignups,
} from "@/features/auth/lib/signup-cleanup";

import {
  runCronJob,
} from "@/lib/cron-route";

export const dynamic = "force-dynamic";

export function GET(
  request: NextRequest,
) {
  return runCronJob(
    request,
    "limpar cadastros não confirmados",
    () => deleteExpiredUnconfirmedSignups(),
  );
}
