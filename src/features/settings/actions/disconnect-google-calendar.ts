"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  decryptSecret,
} from "@/lib/crypto";

import {
  createGoogleOAuthClient,
} from "@/lib/google-calendar";

import {
  getCurrentWorkspaceAccess,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

export type DisconnectGoogleCalendarResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function disconnectGoogleCalendarAction(): Promise<DisconnectGoogleCalendarResult> {
  const user =
    await requireCurrentUser();

  const {
    workspace,
  } =
    await getCurrentWorkspaceAccess();

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
      success: true,
    };
  }

  /*
   * Tentamos revogar a autorização
   * também no próprio Google.
   *
   * Uma falha no Google não deve
   * impedir a desconexão local.
   */
  try {
    const refreshToken =
      decryptSecret(
        connection
          .refreshTokenEncrypted,
      );

    const oauthClient =
      createGoogleOAuthClient();

    await oauthClient.revokeToken(
      refreshToken,
    );
  } catch (error) {
    console.warn(
      "Não foi possível revogar o token no Google. A integração será desativada localmente:",
      error,
    );
  }

  /*
   * Preservamos o registro da conexão
   * porque tarefas sincronizadas podem
   * manter googleConnectionId e
   * googleEventId.
   *
   * Isso também reduz o risco de
   * duplicação após uma reconexão.
   */
  try {
    await prisma.googleCalendarConnection.update({
      where: {
        id:
          connection.id,
      },

      data: {
        syncFromGoogle:
          false,

        syncToGoogle:
          false,

        syncToken:
          null,

        watchChannelId:
          null,

        watchResourceId:
          null,

        watchExpiresAt:
          null,
      },
    });

    revalidatePath(
      "/configuracoes",
    );

    revalidatePath(
      "/configuracoes/integracoes",
    );

    revalidatePath(
      "/agenda",
    );

    revalidatePath(
      "/dashboard",
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Erro ao desconectar Google Agenda:",
      error,
    );

    return {
      success: false,

      error:
        "Não foi possível desconectar o Google Agenda.",
    };
  }
}