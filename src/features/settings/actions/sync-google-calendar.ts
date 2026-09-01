"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  prisma,
} from "@/lib/prisma";

import {
  getDefaultWorkspace,
} from "@/lib/workspace";

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

  const workspace =
    await getDefaultWorkspace();

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
      error,
    );

    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "Não foi possível sincronizar o Google Agenda.",
    };
  }
}