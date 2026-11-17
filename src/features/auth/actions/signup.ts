"use server";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getAppOrigin,
} from "../lib/app-origin";

import {
  authErrorMessage,
} from "../lib/auth-error-message";

import {
  isSignupEnabled,
  provisionSignupAccount,
} from "../lib/signup";

import {
  LEGAL_VERSION,
} from "@/features/legal/legal-info";

import {
  requestPasswordResetSchema,
  signUpSchema,
} from "../schemas/auth-schema";

export type SignUpState = {
  error: string | null;
  // E-mail para o qual a confirmação foi enviada ("" = não mostrar).
  sentTo: string | null;
};

const SIGNUP_CLOSED_MESSAGE =
  "O cadastro de novos escritórios não está disponível no momento.";

function signupErrorMessage(
  error: { code?: string; status?: number },
): string {
  if (
    error.code === "user_already_exists" ||
    error.code === "email_exists"
  ) {
    return "Este e-mail já tem uma conta no LexFlow. Entre pela tela de login ou use \"Esqueci minha senha\".";
  }

  if (error.code === "signup_disabled") {
    return SIGNUP_CLOSED_MESSAGE;
  }

  return authErrorMessage(
    error,
    "Não foi possível criar a conta. Tente novamente.",
  );
}

/*
 * Cria a identidade no Supabase Auth e envia o e-mail de confirmação.
 * O escritório só é criado depois da confirmação (provisionSignupAccount),
 * para que cadastros abandonados ou com e-mail de terceiros não deixem
 * escritórios vazios no banco.
 */
export async function signUpAction(
  _previousState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  if (!isSignupEnabled()) {
    return {
      error: SIGNUP_CLOSED_MESSAGE,
      sentTo: null,
    };
  }

  // Campo invisível para pessoas: robôs costumam preenchê-lo.
  const trap = formData.get("website");

  if (typeof trap === "string" && trap.trim()) {
    return {
      error: null,
      sentTo: "",
    };
  }

  const parsed = signUpSchema.safeParse({
    officeName: formData.get("officeName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    acceptTerms: formData.get("acceptTerms") ?? undefined,
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Dados inválidos.",
      sentTo: null,
    };
  }

  const {
    officeName,
    name,
    email,
    password,
  } = parsed.data;

  const supabase = await createClient();
  const origin = await getAppOrigin();

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        data: {
          name,
          signup_office_name: officeName,
          // Aceite registrado pelo servidor, não pelo navegador.
          terms_version: LEGAL_VERSION,
          terms_accepted_at: new Date().toISOString(),
        },
      },
    });

  if (error) {
    console.error(
      "Falha no cadastro de escritório:",
      error.code ?? error.status ?? "sem código",
    );

    return {
      error: signupErrorMessage(error),
      sentTo: null,
    };
  }

  /*
   * Se a confirmação de e-mail estiver desligada no Supabase, a sessão
   * já vem aberta: criamos o escritório agora.
   */
  if (data.session && data.user) {
    const result = await provisionSignupAccount(data.user);

    if (result === "not-eligible") {
      await supabase.auth.signOut();

      return {
        error: "Não foi possível concluir o cadastro. Tente novamente.",
        sentTo: null,
      };
    }

    redirect("/dashboard");
  }

  // Mesma resposta para e-mail novo ou já cadastrado (o Supabase não
  // revela qual é o caso quando a confirmação está ligada).
  return {
    error: null,
    sentTo: email,
  };
}

export type ResendConfirmationState = {
  message: string | null;
  error: string | null;
};

export async function resendSignupConfirmationAction(
  _previousState: ResendConfirmationState,
  formData: FormData,
): Promise<ResendConfirmationState> {
  if (!isSignupEnabled()) {
    return { message: null, error: SIGNUP_CLOSED_MESSAGE };
  }

  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { message: null, error: "Informe um e-mail válido." };
  }

  const supabase = await createClient();
  const origin = await getAppOrigin();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    console.error(
      "Falha ao reenviar confirmação de cadastro:",
      error.code ?? error.status ?? "sem código",
    );

    if (
      error.status === 429 ||
      error.code === "over_email_send_rate_limit" ||
      error.code === "over_request_rate_limit"
    ) {
      return { message: null, error: authErrorMessage(error, "") };
    }
  }

  return {
    message: "Se o cadastro ainda não foi confirmado, enviamos um novo link. Confira também a caixa de spam.",
    error: null,
  };
}
