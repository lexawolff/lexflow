"use server";

import {
  encryptSecret,
} from "@/lib/crypto";

import {
  redirect,
} from "next/navigation";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

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
  isDevConfirmationLinkEnabled,
  isSignupEnabled,
  provisionSignupAccount,
  refreshSessionAfterSignup,
  SIGNUP_REJECTED_MESSAGE,
} from "../lib/signup";

import {
  LEGAL_VERSION,
} from "@/features/legal/legal-info";

import {
  requestPasswordResetSchema,
  signUpSchema,
} from "../schemas/auth-schema";

import {
  getSignUpFieldErrors,
  SIGN_UP_FIELDS,
  type SignUpFieldErrors,
} from "../lib/signup-validation";

export type SignUpState = {
  error: string | null;
  // E-mail para o qual a confirmação foi enviada ("" = não mostrar).
  sentTo: string | null;
  // Erros ligados a um campo específico do formulário.
  fieldErrors?: SignUpFieldErrors;
  // Só em desenvolvimento: confirma o cadastro sem depender de e-mail.
  devConfirmationUrl?: string;
};

const SIGNUP_CLOSED_MESSAGE =
  "O cadastro de novos escritórios não está disponível no momento.";

function textField(
  formData: FormData,
  name: string,
): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

function signupFieldError(
  error: { code?: string },
  message: string,
): SignUpFieldErrors | undefined {
  if (
    error.code === "user_already_exists" ||
    error.code === "email_exists"
  ) {
    return { email: message };
  }

  if (
    error.code === "weak_password" ||
    error.code === "same_password"
  ) {
    return { password: message };
  }

  return undefined;
}

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

function signUpFailure(
  error: { code?: string; status?: number },
): SignUpState {
  console.error(
    "Falha no cadastro de escritório:",
    error.code ?? error.status ?? "sem código",
  );

  const message = signupErrorMessage(error);

  return {
    error: message,
    sentTo: null,
    fieldErrors: signupFieldError(error, message),
  };
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

  const values = {
    officeName: textField(formData, "officeName"),
    taxId: textField(formData, "taxId"),
    city: textField(formData, "city"),
    state: textField(formData, "state"),
    name: textField(formData, "name"),
    whatsapp: textField(formData, "whatsapp"),
    oabNumber: textField(formData, "oabNumber"),
    oabState: textField(formData, "oabState"),
    email: textField(formData, "email"),
    password: textField(formData, "password"),
    passwordConfirm: textField(formData, "passwordConfirm"),
    acceptTerms: formData.get("acceptTerms") ?? undefined,
  };

  const fieldErrors = getSignUpFieldErrors(values);

  const firstError = SIGN_UP_FIELDS
    .map((field) => fieldErrors[field])
    .find(Boolean);

  if (firstError) {
    return {
      error: firstError,
      sentTo: null,
      fieldErrors,
    };
  }

  const parsed = signUpSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Dados inválidos.",
      sentTo: null,
    };
  }

  const {
    officeName,
    taxId,
    city,
    state,
    name,
    whatsapp,
    oabNumber,
    oabState,
    email,
    password,
  } = parsed.data;

  const supabase = await createClient();
  const origin = await getAppOrigin();

  const metadata = {
    name,
    signup_office_name: officeName,
    // Fica aqui só até a confirmação do e-mail, sempre cifrado.
    signup_tax_id: encryptSecret(taxId),
    // Opcionais; também são apagados depois da confirmação.
    signup_whatsapp: whatsapp,
    signup_city: city,
    signup_state: state,
    signup_oab_number: oabNumber,
    signup_oab_state: oabState,
    // Aceite registrado pelo servidor, não pelo navegador.
    terms_version: LEGAL_VERSION,
    terms_accepted_at: new Date().toISOString(),
  };

  if (isDevConfirmationLinkEnabled()) {
    const { data, error } =
      await createAdminClient().auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: { data: metadata },
      });

    if (error) {
      return signUpFailure(error);
    }

    const params = new URLSearchParams({
      token_hash: data.properties.hashed_token,
      type: data.properties.verification_type,
      next: "/dashboard",
    });

    return {
      error: null,
      sentTo: email,
      devConfirmationUrl: `${origin}/auth/callback?${params}`,
    };
  }

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        data: metadata,
      },
    });

  if (error) {
    return signUpFailure(error);
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

    if (result === "rejected") {
      await supabase.auth.signOut({ scope: "local" });

      return {
        error: SIGNUP_REJECTED_MESSAGE,
        sentTo: null,
      };
    }

    if (result === "created") {
      await refreshSessionAfterSignup(supabase);
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
