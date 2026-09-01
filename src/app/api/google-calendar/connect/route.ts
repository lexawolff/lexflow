import {
  randomBytes,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import {
  getCurrentUser,
} from "@/lib/auth";

import {
  createGoogleAuthorizationUrl,
} from "@/lib/google-calendar";

export const runtime =
  "nodejs";

const STATE_COOKIE =
  "lexflow_google_calendar_oauth_state";

export async function GET(
  request: Request,
) {
  const user =
    await getCurrentUser();

  if (!user) {
    const loginUrl =
      new URL(
        "/login",
        request.url,
      );

    return NextResponse.redirect(
      loginUrl,
    );
  }

  const state =
    randomBytes(32).toString(
      "hex",
    );

  const authorizationUrl =
    createGoogleAuthorizationUrl(
      state,
    );

  const response =
    NextResponse.redirect(
      authorizationUrl,
    );

  response.cookies.set({
    name:
      STATE_COOKIE,

    value:
      state,

    httpOnly:
      true,

    sameSite:
      "lax",

    secure:
      process.env.NODE_ENV ===
      "production",

    path:
      "/",

    maxAge:
      10 * 60,
  });

  return response;
}