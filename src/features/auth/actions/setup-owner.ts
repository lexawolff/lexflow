"use server";

import {
  UserRole,
} from "@prisma/client";

import {
  redirect,
} from "next/navigation";

import {
  prisma,
} from "@/lib/prisma";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  setupOwnerSchema,
} from "../schemas/auth-schema";

export type SetupOwnerState = {
  error:
    string | null;
};

export async function setupOwnerAction(
  _previousState:
    SetupOwnerState,

  formData:
    FormData,
): Promise<SetupOwnerState> {
  /*
   * Cadastro público fica
   * automaticamente bloqueado
   * assim que existir o primeiro
   * usuário.
   */
  const userCount =
    await prisma.user.count();

  if (userCount > 0) {
    return {
      error:
        "O LexFlow já possui um usuário administrador.",
    };
  }

  const parsed =
    setupOwnerSchema.safeParse({
      name:
        formData.get(
          "name",
        ),

      email:
        formData.get(
          "email",
        ),

      password:
        formData.get(
          "password",
        ),

      passwordConfirm:
        formData.get(
          "passwordConfirm",
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

  const {
    name,
    email,
    password,
  } =
    parsed.data;

  const admin =
    createAdminClient();

  /*
   * Primeiro criamos a identidade
   * no Supabase Auth.
   */
  const {
    data:
      authData,

    error:
      authError,
  } =
    await admin.auth.admin.createUser({
      email,

      password,

      email_confirm:
        true,

      user_metadata: {
        name,
      },
    });

  if (
    authError ||
    !authData.user
  ) {
    console.error(
      authError,
    );

    return {
      error:
        authError?.message ??
        "Não foi possível criar o usuário.",
    };
  }

  const authUserId =
    authData.user.id;

  try {
    let workspace =
      await prisma.workspace.findFirst({
        orderBy: {
          createdAt:
            "asc",
        },
      });

    if (!workspace) {
      workspace =
        await prisma.workspace.create({
          data: {
            name:
              "Roza Advocacia",

            slug:
              "roza-advocacia",
          },
        });
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.user.create({
          data: {
            /*
             * Mesmo UUID utilizado
             * pelo Supabase Auth.
             */
            id:
              authUserId,

            name,

            email,
          },
        });

        await tx.membership.create({
          data: {
            userId:
              authUserId,

            workspaceId:
              workspace.id,

            role:
              UserRole.OWNER,
          },
        });
      },
    );
  } catch (error) {
    /*
     * Se o banco do LexFlow falhar,
     * removemos também a identidade
     * criada no Auth para não deixar
     * cadastro órfão.
     */
    await admin.auth.admin.deleteUser(
      authUserId,
    );

    console.error(
      error,
    );

    return {
      error:
        "Não foi possível concluir a criação do usuário.",
    };
  }

  /*
   * Login automático após criar
   * a proprietária.
   */
  const supabase =
    await createClient();

  const {
    error:
      loginError,
  } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (loginError) {
    redirect(
      "/login",
    );
  }

  redirect(
    "/dashboard",
  );
}