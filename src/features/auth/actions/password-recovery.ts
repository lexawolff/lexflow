"use server";

import {
  headers,
} from "next/headers";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  authErrorMessage,
} from "../lib/auth-error-message";

import {
  newPasswordFormSchema,
  requestPasswordResetSchema,
} from "../schemas/auth-schema";

export type RequestPasswordResetState = {
  error: string | null;
  sent: boolean;
};

export type UpdatePasswordState = {
  error: string | null;
};

async function getAppOrigin(): Promise<string> {
  const headerList = await headers();

  const origin = headerList.get("origin");

  if (origin) {
    return origin;
  }

  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "localhost:3000";

  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

/*
 * "Esqueci minha senha": o Supabase envia o e-mail com o link.
 * O link volta para /auth/callback, que abre a sessão e leva a
 * /redefinir-senha. O Supabase só aceita o redirectTo se ele estiver
 * em Authentication > URL Configuration > Redirect URLs.
 */
export async function requestPasswordResetAction(
  _previousState: RequestPasswordResetState,
  formData: FormData,
): Promise<RequestPasswordResetState> {
  const parsed =
    requestPasswordResetSchema.safeParse({
      email: formData.get("email"),
    });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Informe um e-mail válido.",
      sent: false,
    };
  }

  const supabase = await createClient();
  const origin = await getAppOrigin();

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
      },
    );

  if (error) {
    console.error(
      "Falha ao solicitar redefinição de senha:",
      error.code ?? error.status ?? "sem código",
    );

    // Limite de envio é o único erro mostrado; os demais não revelam
    // se o e-mail existe.
    if (
      error.status === 429 ||
      error.code === "over_email_send_rate_limit" ||
      error.code === "over_request_rate_limit"
    ) {
      return {
        error: authErrorMessage(error, ""),
        sent: false,
      };
    }
  }

  // Mesma resposta para e-mail cadastrado ou não.
  return {
    error: null,
    sent: true,
  };
}

/*
 * Define a nova senha usando a sessão aberta pelo link do e-mail.
 */
export async function updatePasswordAction(
  _previousState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const parsed =
    newPasswordFormSchema.safeParse({
      password: formData.get("password"),
      passwordConfirm: formData.get("passwordConfirm"),
    });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Dados inválidos.",
    };
  }

  const supabase = await createClient();

  const {
    data: userData,
  } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      error: "O link expirou. Solicite uma nova redefinição de senha.",
    };
  }

  const { error } =
    await supabase.auth.updateUser({
      password: parsed.data.password,
    });

  if (error) {
    console.error(
      "Falha ao redefinir senha:",
      error.code ?? error.status ?? "sem código",
    );

    return {
      error: authErrorMessage(
        error,
        "Não foi possível redefinir a senha. Solicite um novo link.",
      ),
    };
  }

  redirect("/dashboard");
}
