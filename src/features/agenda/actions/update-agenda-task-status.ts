"use server";

import {
  TaskStatus,
} from "@prisma/client";

import {
  revalidatePath,
} from "next/cache";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  prisma,
} from "@/lib/prisma";

import {
  getDefaultWorkspace,
} from "@/lib/workspace";

import {
  agendaTaskStatusActionSchema,
} from "../schemas/agenda-task-actions-schema";

import {
  syncTaskToGoogleCalendar,
} from "../services/sync-task-google-calendar";

function revalidateAgenda({
  clientId,
  caseId,
}: {
  clientId:
    string | null;

  caseId:
    string | null;
}) {
  revalidatePath(
    "/agenda",
  );

  revalidatePath(
    "/dashboard",
  );

  if (clientId) {
    revalidatePath(
      `/clientes/${clientId}`,
    );
  }

  if (
    clientId &&
    caseId
  ) {
    revalidatePath(
      `/clientes/${clientId}/casos/${caseId}`,
    );
  }
}

export async function updateAgendaTaskStatus(
  formData: FormData,
) {
  const user =
    await requireCurrentUser();

  const workspace =
    await getDefaultWorkspace();

  const parsed =
    agendaTaskStatusActionSchema.safeParse({
      taskId:
        formData.get(
          "taskId",
        ),

      action:
        formData.get(
          "action",
        ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Dados inválidos.",
    );
  }

  const {
    taskId,
    action,
  } =
    parsed.data;

  const task =
    await prisma.task.findFirst({
      where: {
        id:
          taskId,

        workspaceId:
          workspace.id,
      },

      select: {
        id: true,

        status: true,

        clientId: true,

        caseId: true,
      },
    });

  if (!task) {
    throw new Error(
      "Compromisso não encontrado.",
    );
  }

  if (
    action === "START"
  ) {
    await prisma.task.update({
      where: {
        id:
          task.id,
      },

      data: {
        status:
          TaskStatus.EM_ANDAMENTO,

        completedAt:
          null,
      },
    });
  }

  if (
    action === "COMPLETE"
  ) {
    await prisma.task.update({
      where: {
        id:
          task.id,
      },

      data: {
        status:
          TaskStatus.CONCLUIDA,

        completedAt:
          new Date(),
      },
    });
  }

  if (
    action === "REOPEN"
  ) {
    await prisma.task.update({
      where: {
        id:
          task.id,
      },

      data: {
        status:
          TaskStatus.PENDENTE,

        completedAt:
          null,
      },
    });
  }

  if (
    action === "CANCEL"
  ) {
    await prisma.task.update({
      where: {
        id:
          task.id,
      },

      data: {
        status:
          TaskStatus.CANCELADA,

        completedAt:
          null,
      },
    });
  }

  /*
   * START e COMPLETE mantêm
   * o compromisso no Google.
   *
   * CANCEL remove o evento.
   *
   * REOPEN volta a criar o evento
   * caso ele tenha sido removido
   * quando a Task foi cancelada.
   */
  const googleSync =
    await syncTaskToGoogleCalendar({
      taskId:
        task.id,

      workspaceId:
        workspace.id,

      userId:
        user.id,
    });

  if (!googleSync.success) {
    console.error(
      "Status atualizado no LexFlow, mas não sincronizado com Google Agenda:",
      googleSync.error,
    );
  }

  revalidateAgenda({
    clientId:
      task.clientId,

    caseId:
      task.caseId,
  });

  return {
    success: true,
  };
}