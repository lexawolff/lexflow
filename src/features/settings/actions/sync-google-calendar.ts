"use server";

import { GOOGLE_REAUTH_MESSAGE, isGoogleReauthRequired } from "@/lib/google-oauth-error";
import { safeErrorSummary } from "@/lib/security/safe-error";


import {
  revalidatePath,
} from "next/cache";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  getCurrentWorkspaceAccess,
  hasPermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  syncGoogleCalendar,
} from "../services/sync-google-calendar";

export type SyncGoogleCalendarActionResult =
  | {
      success: true;

      imported:
        number;

      updated:
        number;

      cancelled:
        number;

      exported:
        number;

      skippedRecurring:
        number;
    }
  | {
      success: false;

      error:
        string;
    };

export async function syncGoogleCalendarAction(): Promise<SyncGoogleCalendarActionResult> {
  const user =
    await requireCurrentUser();

  const {
    workspace,
    membership,
  } =
    await getCurrentWorkspaceAccess();

  const canCreateAgenda =
    hasPermission(
      membership.role,
      "AGENDA_CREATE",
    );

  const canEditAgenda =
    hasPermission(
      membership.role,
      "AGENDA_EDIT",
    );

  /*
   * A sincronização pode importar
   * novos compromissos e também
   * atualizar/cancelar existentes.
   */
  if (
    !canCreateAgenda ||
    !canEditAgenda
  ) {
    return {
      success: false,

      error:
        "Você não possui permissão para sincronizar compromissos com a Agenda.",
    };
  }

  const connection =
    await prisma.googleCalendarConnection.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId:
            workspace.id,

          userId:
            user.id,
        },
      },
    });

  if (!connection) {
    return {
      success: false,

      error:
        "Nenhuma conta Google Agenda está conectada.",
    };
  }

  try {
    const result =
      await syncGoogleCalendar(
        connection,
      );

    revalidatePath(
      "/agenda",
    );

    revalidatePath(
      "/dashboard",
    );

    revalidatePath(
      "/configuracoes/integracoes",
    );

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error(
      "Erro na sincronização com Google Agenda:",
      safeErrorSummary(error),
    );

    return {
      success: false,

      error:
        isGoogleReauthRequired(error)
          ? GOOGLE_REAUTH_MESSAGE
          : "Não foi possível sincronizar o Google Agenda.",
    };
  }
}