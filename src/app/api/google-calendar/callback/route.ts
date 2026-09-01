import {
  google,
} from "googleapis";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getCurrentUser,
} from "@/lib/auth";

import {
  encryptSecret,
} from "@/lib/crypto";

import {
  createGoogleOAuthClient,
} from "@/lib/google-calendar";

import {
  prisma,
} from "@/lib/prisma";

import {
  getDefaultWorkspace,
} from "@/lib/workspace";

export const runtime =
  "nodejs";

const STATE_COOKIE =
  "lexflow_google_calendar_oauth_state";

function integrationsUrl(
  request: NextRequest,
  status: string,
) {
  const url =
    new URL(
      "/configuracoes/integracoes",
      request.url,
    );

  url.searchParams.set(
    "google",
    status,
  );

  return url;
}

export async function GET(
  request: NextRequest,
) {
  const user =
    await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(
      new URL(
        "/login",
        request.url,
      ),
    );
  }

  const workspace =
    await getDefaultWorkspace();

  const error =
    request.nextUrl.searchParams.get(
      "error",
    );

  if (error) {
    const response =
      NextResponse.redirect(
        integrationsUrl(
          request,
          "denied",
        ),
      );

    response.cookies.delete(
      STATE_COOKIE,
    );

    return response;
  }

  const code =
    request.nextUrl.searchParams.get(
      "code",
    );

  const receivedState =
    request.nextUrl.searchParams.get(
      "state",
    );

  const storedState =
    request.cookies.get(
      STATE_COOKIE,
    )?.value;

  if (
    !code ||
    !receivedState ||
    !storedState ||
    receivedState !==
      storedState
  ) {
    const response =
      NextResponse.redirect(
        integrationsUrl(
          request,
          "invalid_state",
        ),
      );

    response.cookies.delete(
      STATE_COOKIE,
    );

    return response;
  }

  try {
    const oauthClient =
      createGoogleOAuthClient();

    const {
      tokens,
    } =
      await oauthClient.getToken(
        code,
      );

    oauthClient.setCredentials(
      tokens,
    );

    const existing =
      await prisma.googleCalendarConnection.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId:
              workspace.id,

            userId:
              user.id,
          },
        },

        select: {
          refreshTokenEncrypted:
            true,
        },
      });

    /*
     * Em reconexões o Google pode
     * não enviar um refresh token.
     *
     * Se já existe conexão, podemos
     * preservar o token existente.
     */
    const refreshTokenEncrypted =
      tokens.refresh_token
        ? encryptSecret(
            tokens.refresh_token,
          )
        : existing
            ?.refreshTokenEncrypted;

    if (
      !refreshTokenEncrypted
    ) {
      throw new Error(
        "O Google não retornou um refresh token.",
      );
    }

    /*
     * Descobrimos qual conta Google
     * acabou de ser autorizada.
     */
    const oauth2 =
      google.oauth2({
        version:
          "v2",

        auth:
          oauthClient,
      });

    const {
      data:
        profile,
    } =
      await oauth2.userinfo.get();

    await prisma.googleCalendarConnection.upsert({
      where: {
        workspaceId_userId: {
          workspaceId:
            workspace.id,

          userId:
            user.id,
        },
      },

      create: {
        workspaceId:
          workspace.id,

        userId:
          user.id,

        googleAccountEmail:
          profile.email ??
          null,

        calendarId:
          "primary",

        refreshTokenEncrypted,

        syncFromGoogle:
          true,

        syncToGoogle:
          true,

        syncToken:
          null,

        lastSyncedAt:
          null,
      },

      update: {
        googleAccountEmail:
          profile.email ??
          null,

        calendarId:
          "primary",

        refreshTokenEncrypted,

        syncToken:
          null,

        lastSyncedAt:
          null,

        watchChannelId:
          null,

        watchResourceId:
          null,

        watchExpiresAt:
          null,
      },
    });

    const response =
      NextResponse.redirect(
        integrationsUrl(
          request,
          "connected",
        ),
      );

    response.cookies.delete(
      STATE_COOKIE,
    );

    return response;
  } catch (error) {
    console.error(
      "Google Calendar OAuth:",
      error,
    );

    const response =
      NextResponse.redirect(
        integrationsUrl(
          request,
          "error",
        ),
      );

    response.cookies.delete(
      STATE_COOKIE,
    );

    return response;
  }
}