"use server";

import {
  redirect,
} from "next/navigation";

import {
  prisma,
} from "@/lib/prisma";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  provisionSignupAccount,
} from "../lib/signup";

import {
  loginSchema,
} from "../schemas/auth-schema";

export type LoginState = {
  error:
    string | null;
};

export async function loginAction(
  _previousState:
    LoginState,

  formData:
    FormData,
): Promise<LoginState> {
  const parsed =
    loginSchema.safeParse({
      email:
        formData.get(
          "email",
        ),

      password:
        formData.get(
          "password",
        ),
    });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]
          ?.message ??
        "Dados inválidos.",
    };
  }

  const supabase =
    await createClient();

  const {
    data,
    error,
  } =
    await supabase.auth.signInWithPassword({
      email:
        parsed.data.email,

      password:
        parsed.data.password,
    });

  if (
    error?.code ===
    "email_not_confirmed"
  ) {
    return {
      error:
        "Confirme seu e-mail antes de entrar: abra o link que enviamos no cadastro. Se não encontrar, confira a caixa de spam.",
    };
  }

  if (
    error ||
    !data.user
  ) {
    return {
      error:
        "E-mail ou senha inválidos.",
    };
  }

  /*
   * A identidade também precisa
   * existir no LexFlow.
   */
  const user =
    await prisma.user.findUnique({
      where: {
        id:
          data.user.id,
      },

      select: {
        id: true,
      },
    });

  if (!user) {
    /*
     * Cadastro público confirmado em outro
     * aparelho: o escritório é criado agora,
     * no primeiro acesso.
     */
    let provisioned = false;

    try {
      provisioned =
        (await provisionSignupAccount(
          data.user,
        )) !== "not-eligible";
    } catch {
      console.error(
        "Falha ao criar escritório no primeiro acesso.",
      );
    }

    if (!provisioned) {
      await supabase.auth.signOut();

      return {
        error:
          "Este usuário não possui acesso ao LexFlow.",
      };
    }
  }

  redirect(
    "/dashboard",
  );
}