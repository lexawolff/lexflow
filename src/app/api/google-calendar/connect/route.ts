import {
  randomBytes,
} from "node:crypto";

import {
  NextResponse,
} from "next/server";

import {
  getCurrentUser,
} from "@/lib/auth";

import {
  createGoogleAuthorizationUrl,
} from "@/lib/google-calendar";

import {
  getCurrentWorkspaceAccess,
} from "@/lib/permissions";

const OAUTH_STATE_COOKIE =
  "lexflow_google_calendar_oauth_state";

const OAUTH_WORKSPACE_COOKIE =
  "lexflow_google_calendar_oauth_workspace";

const TEN_MINUTES =
  10 * 60;

export async function GET(
  request: Request,
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

  const {
    workspace,
  } =
    await getCurrentWorkspaceAccess();

  const state =
    randomBytes(32)
      .toString("hex");

  const authorizationUrl =
    createGoogleAuthorizationUrl(
      state,
    );

  const response =
    NextResponse.redirect(
      authorizationUrl,
    );

  response.cookies.set(
    OAUTH_STATE_COOKIE,
    state,
    {
      httpOnly:
        true,

      sameSite:
        "lax",

      secure:
        process.env.NODE_ENV ===
        "production",

      maxAge:
        TEN_MINUTES,

      path:
        "/",
    },
  );

  response.cookies.set(
    OAUTH_WORKSPACE_COOKIE,
    workspace.id,
    {
      httpOnly:
        true,

      sameSite:
        "lax",

      secure:
        process.env.NODE_ENV ===
        "production",

      maxAge:
        TEN_MINUTES,

      path:
        "/",
    },
  );

  return response;
}