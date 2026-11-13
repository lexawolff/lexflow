import "server-only";

import {
  google,
} from "googleapis";

export const GOOGLE_CALENDAR_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
];

function requireGoogleEnv(
  name:
    | "GOOGLE_CLIENT_ID"
    | "GOOGLE_CLIENT_SECRET"
    | "GOOGLE_REDIRECT_URI",
): string {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não configurada.`,
    );
  }

  return value;
}

export function createGoogleOAuthClient() {
  return new google.auth.OAuth2(
    requireGoogleEnv(
      "GOOGLE_CLIENT_ID",
    ),
    requireGoogleEnv(
      "GOOGLE_CLIENT_SECRET",
    ),
    requireGoogleEnv(
      "GOOGLE_REDIRECT_URI",
    ),
  );
}

export function createGoogleAuthorizationUrl(
  state: string,
) {
  const oauthClient =
    createGoogleOAuthClient();

  return oauthClient.generateAuthUrl({
    access_type:
      "offline",

    /*
     * Essencial na reconexão:
     * força nova tela de consentimento
     * para obter novo refresh_token.
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
