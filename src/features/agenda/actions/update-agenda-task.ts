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

  if (caseId) {
    revalidatePath(
      `/casos/${caseId}`,
    );
  }
}

async function updateAgendaTaskImpl(
  formData: FormData,
) {
  const {
    user,
    workspace,
  } =
    await requireWorkspacePermission(
      "AGENDA_EDIT",
    );

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
    throw new ActionError(
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
    throw new ActionError(
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
      throw new ActionError(
        "Caso não encontrado.",
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
      throw new ActionError(
        "Cliente não encontrado.",
      );
    }
  }

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

export async function updateAgendaTask(
  ...args: Parameters<typeof updateAgendaTaskImpl>
) {
  return runAction(
    () =>
      updateAgendaTaskImpl(
        ...args,
      ),
  );
}
