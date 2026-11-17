"use server";

import {
  ActionError,
} from "@/lib/actions/action-error";

import {
  runAction,
} from "@/lib/actions/run-action";

import {
  revalidatePath,
} from "next/cache";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  deleteAgendaTaskSchema,
} from "../schemas/agenda-task-actions-schema";

import {
  deleteTaskFromGoogleCalendar,
} from "../services/sync-task-google-calendar";

async function deleteAgendaTaskImpl(
  formData: FormData,
) {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "AGENDA_DELETE",
    );

  const parsed =
    deleteAgendaTaskSchema.safeParse({
      taskId:
        formData.get(
          "taskId",
        ),
    });

  if (!parsed.success) {
    throw new ActionError(
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
    throw new ActionError(
      "Compromisso não encontrado.",
    );
  }

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

      throw new ActionError(
        "Não foi possível excluir o compromisso porque o evento vinculado ao Google Agenda não pôde ser removido. Tente novamente ou desconecte a integração antes de excluir.",
      );
    }
  }

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

  if (task.caseId) {
    revalidatePath(
      `/casos/${task.caseId}`,
    );
  }

  return {
    success: true,
  };
}

export async function deleteAgendaTask(
  ...args: Parameters<typeof deleteAgendaTaskImpl>
) {
  return runAction(
    () =>
      deleteAgendaTaskImpl(
        ...args,
      ),
  );
}
