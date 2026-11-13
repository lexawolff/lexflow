"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  prisma,
} from "@/lib/prisma";

export type UpdateProfileResult =
  | {
      success: true;

      name: string;
    }
  | {
      success: false;

      error: string;
    };

export async function updateProfileAction(
  formData: FormData,
): Promise<UpdateProfileResult> {
  const currentUser =
    await requireCurrentUser();

  const nameValue =
    formData.get(
      "name",
    );

  const name =
    typeof nameValue ===
    "string"
      ? nameValue.trim()
      : "";

  if (
    name.length < 2
  ) {
    return {
      success: false,

      error:
        "Informe um nome válido.",
    };
  }

  if (
    name.length > 100
  ) {
    return {
      success: false,

      error:
        "O nome deve ter no máximo 100 caracteres.",
    };
  }

  try {
    const user =
      await prisma.user.update({
        where: {
          id:
            currentUser.id,
        },

        data: {
          name,
        },

        select: {
          name: true,
        },
      });

    revalidatePath(
      "/configuracoes",
    );

    revalidatePath(
      "/configuracoes/perfil",
    );

    revalidatePath(
      "/dashboard",
    );

    return {
      success: true,

      name:
        user.name,
    };
  } catch (error) {
    console.error(
      "Erro ao atualizar perfil:",
      error,
    );

    return {
      success: false,

      error:
        "Não foi possível atualizar o perfil.",
    };
  }
}