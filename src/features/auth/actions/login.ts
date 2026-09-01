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
    await supabase.auth.signOut();

    return {
      error:
        "Este usuário não possui acesso ao LexFlow.",
    };
  }

  redirect(
    "/dashboard",
  );
}