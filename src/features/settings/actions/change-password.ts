"use server";

import {
  createClient as createSupabaseJsClient,
} from "@supabase/supabase-js";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  authErrorMessage,
} from "@/features/auth/lib/auth-error-message";

import {
  changePasswordSchema,
} from "@/features/auth/schemas/auth-schema";

export type ChangePasswordResult =
  | { success: true }
  | { success: false; error: string };

/*
 * Troca de senha por quem está logado. Exige a senha atual, para que
 * uma sessão esquecida aberta não permita trocar a senha da conta.
 */
export async function changePasswordAction(
  formData: FormData,
): Promise<ChangePasswordResult> {
  const user = await requireCurrentUser();

  const parsed =
    changePasswordSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      password: formData.get("password"),
      passwordConfirm: formData.get("passwordConfirm"),
    });

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Dados inválidos.",
    };
  }

  /*
   * Confere a senha atual com um cliente descartável, sem cookies:
   * a verificação não substitui a sessão do navegador.
   */
  const verifier =
    createSupabaseJsClient(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

  const { error: verifyError } =
    await verifier.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.currentPassword,
    });

  if (verifyError) {
    return {
      success: false,
      error:
        verifyError.status === 429
          ? authErrorMessage(verifyError, "")
          : "Senha atual incorreta.",
    };
  }

  // "local": encerra só a sessão de verificação, não a do navegador.
  await verifier.auth
    .signOut({ scope: "local" })
    .catch(() => undefined);

  const supabase = await createClient();

  const { error } =
    await supabase.auth.updateUser({
      password: parsed.data.password,
    });

  if (error) {
    console.error(
      "Falha ao alterar senha:",
      error.code ?? error.status ?? "sem código",
    );

    return {
      success: false,
      error: authErrorMessage(
        error,
        "Não foi possível alterar a senha. Tente novamente.",
      ),
    };
  }

  return { success: true };
}
