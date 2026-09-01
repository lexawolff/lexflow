"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  decryptSecret,
} from "@/lib/crypto";

import {
  createGoogleOAuthClient,
} from "@/lib/google-calendar";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  getDefaultWorkspace,
} from "@/lib/workspace";

export async function disconnectGoogleCalendar() {
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
      success: true,
    };
  }

  try {
    const refreshToken =
      decryptSecret(
        connection.refreshTokenEncrypted,
      );

    const oauthClient =
      createGoogleOAuthClient();

    /*
     * Revogamos também no Google.
     * Se o token já estiver inválido,
     * ainda assim eliminamos nossa
     * conexão local.
     */
    await oauthClient.revokeToken(
      refreshToken,
    );
  } catch (error) {
    console.error(
      "Erro ao revogar Google Calendar:",
      error,
    );
  }

  await prisma.googleCalendarConnection.delete({
    where: {
      id:
        connection.id,
    },
  });

  revalidatePath(
    "/configuracoes/integracoes",
  );

  return {
    success: true,
  };
}