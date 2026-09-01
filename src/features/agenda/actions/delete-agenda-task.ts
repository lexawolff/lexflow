"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  prisma,
} from "@/lib/prisma";

import {
  getDefaultWorkspace,
} from "@/lib/workspace";

import {
  deleteAgendaTaskSchema,
} from "../schemas/agenda-task-actions-schema";

import {
  deleteTaskFromGoogleCalendar,
} from "../services/sync-task-google-calendar";

export async function deleteAgendaTask(
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    deleteAgendaTaskSchema.safeParse({
      taskId:
        formData.get(
          "taskId",
        ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Dados inválidos.",
    );
  }

  const task =
    await prisma.task.findFirst({
      where: {
        id:
          parsed.data.taskId,

        workspaceId:
          workspace.id,
      },

      select: {
        id: true,

        clientId: true,

        caseId: true,

        googleEventId:
          true,

        googleConnectionId:
          true,
      },
    });

  if (!task) {
    throw new Error(
      "Compromisso não encontrado.",
    );
  }

  /*
   * Se existir evento vinculado ao
   * Google, removemos primeiro.
   *
   * Neste caso específico NÃO
   * apagamos a Task se o Google
   * responder com erro.
   *
   * Isso evita deixar um evento
   * órfão no Google que poderia
   * voltar a ser importado depois.
   */
  if (
    task.googleEventId &&
    task.googleConnectionId
  ) {
    const googleSync =
      await deleteTaskFromGoogleCalendar({
        taskId:
          task.id,

        workspaceId:
          workspace.id,
      });

    if (!googleSync.success) {
      console.error(
        "Não foi possível remover o compromisso do Google Agenda:",
        googleSync.error,
      );

      throw new Error(
        "Não foi possível excluir o compromisso porque o evento vinculado ao Google Agenda não pôde ser removido. Tente novamente ou desconecte a integração antes de excluir.",
      );
    }
  }

  /*
   * Depois que o evento Google
   * estiver resolvido, apagamos
   * definitivamente a Task.
   */
  await prisma.task.delete({
    where: {
      id:
        task.id,
    },
  });

  revalidatePath(
    "/agenda",
  );

  revalidatePath(
    "/dashboard",
  );

  if (task.clientId) {
    revalidatePath(
      `/clientes/${task.clientId}`,
    );
  }

  if (
    task.clientId &&
    task.caseId
  ) {
    revalidatePath(
      `/clientes/${task.clientId}/casos/${task.caseId}`,
    );
  }

  return {
    success: true,
  };
}