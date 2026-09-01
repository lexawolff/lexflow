import "server-only";

import {
  google,
} from "googleapis";

export const GOOGLE_CALENDAR_SCOPES =
  [
    "openid",
    "email",
    "https://www.googleapis.com/auth/calendar.events",
  ];

function getGoogleClientId(): string {
  const value =
    process.env.GOOGLE_CLIENT_ID;

  if (!value) {
    throw new Error(
      "GOOGLE_CLIENT_ID não configurado.",
    );
  }

  return value;
}

function getGoogleClientSecret(): string {
  const value =
    process.env.GOOGLE_CLIENT_SECRET;

  if (!value) {
    throw new Error(
      "GOOGLE_CLIENT_SECRET não configurado.",
    );
  }

  return value;
}

function getGoogleRedirectUri(): string {
  const value =
    process.env.GOOGLE_REDIRECT_URI;

  if (!value) {
    throw new Error(
      "GOOGLE_REDIRECT_URI não configurado.",
    );
  }

  return value;
}

export function createGoogleOAuthClient() {
  return new google.auth.OAuth2(
    getGoogleClientId(),
    getGoogleClientSecret(),
    getGoogleRedirectUri(),
  );
}

export function createGoogleAuthorizationUrl(
  state: string,
): string {
  const oauthClient =
    createGoogleOAuthClient();

  return oauthClient.generateAuthUrl({
    access_type:
      "offline",

    /*
     * Garante nova tela de
     * consentimento em uma
     * reconexão e aumenta a
     * previsibilidade de obter
     * refresh_token.
     */
    prompt:
      "consent",

    include_granted_scopes:
      true,

    scope:
      GOOGLE_CALENDAR_SCOPES,

    state,
  });
}