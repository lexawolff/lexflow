"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  getCurrentWorkspaceAccess,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

export type UpdatePreferencesResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

const validStatuses =
  new Set([
    "TODOS",
    "PENDENTE",
    "EM_ANDAMENTO",
    "ATRASADA",
    "CANCELADA",
  ]);

const validItemsPerDay =
  new Set([
    2,
    4,
    6,
  ]);

export async function updatePreferencesAction(
  formData: FormData,
): Promise<UpdatePreferencesResult> {
  const {
    membership,
  } =
    await getCurrentWorkspaceAccess();

  const agendaShowCompleted =
    formData.get(
      "agendaShowCompleted",
    ) === "on";

  const agendaShowAttention =
    formData.get(
      "agendaShowAttention",
    ) === "on";

  const statusValue =
    formData.get(
      "agendaDefaultStatus",
    );

  const agendaDefaultStatus =
    typeof statusValue ===
      "string" &&
    validStatuses.has(
      statusValue,
    )
      ? statusValue
      : "TODOS";

  const itemsValue =
    Number(
      formData.get(
        "agendaItemsPerDay",
      ),
    );

  const agendaItemsPerDay =
    validItemsPerDay.has(
      itemsValue,
    )
      ? itemsValue
      : 4;

  try {
    await prisma.membership.update({
      where: {
        id:
          membership.id,
      },

      data: {
        agendaShowCompleted,

        agendaDefaultStatus,

        agendaItemsPerDay,

        agendaShowAttention,
      },
    });

    revalidatePath(
      "/agenda",
    );

    revalidatePath(
      "/configuracoes",
    );

    revalidatePath(
      "/configuracoes/preferencias",
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Erro ao atualizar preferências:",
      error,
    );

    return {
      success: false,

      error:
        "Não foi possível salvar suas preferências.",
    };
  }
}