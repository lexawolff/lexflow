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

import {
  getDefaultWorkspace,
} from "@/lib/workspace";

import {
  updateAgendaTaskSchema,
} from "../schemas/agenda-task-actions-schema";

import {
  syncTaskToGoogleCalendar,
} from "../services/sync-task-google-calendar";

function buildDateOnly(
  dateKey: string,
): Date {
  const [
    year,
    month,
    day,
  ] =
    dateKey
      .split("-")
      .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12,
    ),
  );
}

function buildStartsAt(
  dateKey: string,
  time: string | null,
): Date | null {
  if (!time) {
    return null;
  }

  return new Date(
    `${dateKey}T${time}:00-03:00`,
  );
}

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

export async function updateAgendaTask(
  formData: FormData,
) {
  const user =
    await requireCurrentUser();

  const workspace =
    await getDefaultWorkspace();

  const parsed =
    updateAgendaTaskSchema.safeParse({
      taskId:
        formData.get(
          "taskId",
        ),

      title:
        formData.get(
          "title",
        ),

      type:
        formData.get(
          "type",
        ),

      date:
        formData.get(
          "date",
        ),

      time:
        formData.get(
          "time",
        ),

      clientId:
        formData.get(
          "clientId",
        ),

      caseId:
        formData.get(
          "caseId",
        ),

      location:
        formData.get(
          "location",
        ),

      description:
        formData.get(
          "description",
        ),
    });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Dados inválidos.",
    );
  }

  const data =
    parsed.data;

  const existing =
    await prisma.task.findFirst({
      where: {
        id:
          data.taskId,

        workspaceId:
          workspace.id,
      },

      select: {
        id: true,

        clientId: true,

        caseId: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Compromisso não encontrado.",
    );
  }

  let clientId =
    data.clientId;

  if (data.caseId) {
    const clientCase =
      await prisma.case.findFirst({
        where: {
          id:
            data.caseId,

          workspaceId:
            workspace.id,
        },

        select: {
          id: true,
          clientId: true,
        },
      });

    if (!clientCase) {
      throw new Error(
        "Processo não encontrado.",
      );
    }

    clientId =
      clientCase.clientId;
  } else if (
    clientId
  ) {
    const client =
      await prisma.client.findFirst({
        where: {
          id:
            clientId,

          workspaceId:
            workspace.id,
        },

        select: {
          id: true,
        },
      });

    if (!client) {
      throw new Error(
        "Cliente não encontrado.",
      );
    }
  }

  /*
   * Atualizamos primeiro a fonte
   * de verdade: a Task do LexFlow.
   */
  await prisma.task.update({
    where: {
      id:
        existing.id,
    },

    data: {
      clientId,

      caseId:
        data.caseId,

      title:
        data.title,

      description:
        data.description,

      type:
        data.type,

      startsAt:
        buildStartsAt(
          data.date,
          data.time,
        ),

      dueDate:
        buildDateOnly(
          data.date,
        ),

      location:
        data.location,
    },
  });

  /*
   * Depois sincronizamos.
   *
   * Se a Task já possuir
   * googleEventId, o serviço
   * atualiza o MESMO evento.
   */
  const googleSync =
    await syncTaskToGoogleCalendar({
      taskId:
        existing.id,

      workspaceId:
        workspace.id,

      userId:
        user.id,
    });

  if (!googleSync.success) {
    console.error(
      "Compromisso atualizado no LexFlow, mas não sincronizado com Google Agenda:",
      googleSync.error,
    );
  }

  /*
   * Revalidamos tanto o vínculo
   * antigo quanto o novo.
   *
   * Isso é importante caso o
   * compromisso seja transferido
   * para outro cliente/processo.
   */
  revalidateAgenda({
    clientId:
      existing.clientId,

    caseId:
      existing.caseId,
  });

  revalidateAgenda({
    clientId,

    caseId:
      data.caseId,
  });

  return {
    success: true,
  };
}