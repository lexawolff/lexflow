import {
  google,
} from "googleapis";

import {
  type NextRequest,
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

const OAUTH_STATE_COOKIE =
  "lexflow_google_calendar_oauth_state";

const OAUTH_WORKSPACE_COOKIE =
  "lexflow_google_calendar_oauth_workspace";

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

function redirectAndClearState(
  request: NextRequest,
  status: string,
) {
  const response =
    NextResponse.redirect(
      integrationsUrl(
        request,
        status,
      ),
    );

  response.cookies.delete(
    OAUTH_STATE_COOKIE,
  );

  response.cookies.delete(
    OAUTH_WORKSPACE_COOKIE,
  );

  return response;
}

export async function GET(
  request: NextRequest,
) {
  try {
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

    const state =
      request.nextUrl
        .searchParams
        .get("state");

    const savedState =
      request.cookies
        .get(
          OAUTH_STATE_COOKIE,
        )
        ?.value;

    const savedWorkspaceId =
      request.cookies
        .get(
          OAUTH_WORKSPACE_COOKIE,
        )
        ?.value;

    /*
     * O callback precisa corresponder
     * exatamente ao fluxo OAuth que
     * foi iniciado neste navegador.
     */
    if (
      !state ||
      !savedState ||
      state !== savedState ||
      !savedWorkspaceId
    ) {
      return redirectAndClearState(
        request,
        "invalid_state",
      );
    }

    /*
     * O workspace salvo no início do
     * OAuth só pode ser utilizado se
     * o usuário ainda pertencer a ele.
     *
     * Isso evita aceitar um workspaceId
     * arbitrário apenas porque apareceu
     * no cookie.
     */
    const membership =
      await prisma.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId:
              user.id,

            workspaceId:
              savedWorkspaceId,
          },
        },

        select: {
          id: true,
        },
      });

    if (!membership) {
      return redirectAndClearState(
        request,
        "invalid_state",
      );
    }

    /*
     * O Google também devolve o state
     * quando o usuário nega a autorização.
     *
     * Por isso só tratamos o erro depois
     * de validar o state.
     */
    const googleError =
      request.nextUrl
        .searchParams
        .get("error");

    if (googleError) {
      return redirectAndClearState(
        request,
        "denied",
      );
    }

    const code =
      request.nextUrl
        .searchParams
        .get("code");

    if (!code) {
      return redirectAndClearState(
        request,
        "error",
      );
    }

    const oauthClient =
      createGoogleOAuthClient();

    const {
      tokens,
    } =
      await oauthClient.getToken(
        code,
      );

    if (
      !tokens.refresh_token
    ) {
      console.error(
        "Google OAuth não retornou refresh_token.",
      );

      return redirectAndClearState(
        request,
        "error",
      );
    }

    oauthClient.setCredentials(
      tokens,
    );

    const oauth2 =
      google.oauth2({
        version:
          "v2",

        auth:
          oauthClient,
      });

    const userInfo =
      await oauth2.userinfo.get();

    const googleAccountEmail =
      userInfo.data.email ??
      null;

    if (!googleAccountEmail) {
      console.error(
        "Google OAuth não retornou e-mail da conta.",
      );

      return redirectAndClearState(
        request,
        "error",
      );
    }

    const refreshTokenEncrypted =
      encryptSecret(
        tokens.refresh_token,
      );

    await prisma.googleCalendarConnection.upsert({
      where: {
        workspaceId_userId: {
          workspaceId:
            savedWorkspaceId,

          userId:
            user.id,
        },
      },

      create: {
        workspaceId:
          savedWorkspaceId,

        userId:
          user.id,

        googleAccountEmail,

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
        googleAccountEmail,

        calendarId:
          "primary",

        refreshTokenEncrypted,

        /*
         * Reconectar também
         * reativa a integração.
         */
        syncFromGoogle:
          true,

        syncToGoogle:
          true,

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

    return redirectAndClearState(
      request,
      "connected",
    );
  } catch (error) {
    console.error(
      "Erro no callback do Google Agenda:",
      error,
    );

    return redirectAndClearState(
      request,
      "error",
    );
  }
}