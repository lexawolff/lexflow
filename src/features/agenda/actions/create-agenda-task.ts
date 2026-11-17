"use server";

import {
  ActionError,
} from "@/lib/actions/action-error";

import {
  runAction,
} from "@/lib/actions/run-action";

import {
  TaskStatus,
} from "@prisma/client";

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
  createAgendaTaskSchema,
} from "../schemas/create-agenda-task-schema";

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

async function createAgendaTaskImpl(
  formData: FormData,
) {
  const {
    user,
    workspace,
  } =
    await requireWorkspacePermission(
      "AGENDA_CREATE",
    );

  const parsed =
    createAgendaTaskSchema.safeParse({
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
    console.error(
      parsed.error.flatten(),
    );

    throw new ActionError(
      parsed.error.issues[0]
        ?.message ??
        "Dados inválidos.",
    );
  }

  const data =
    parsed.data;

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

  const task =
    await prisma.task.create({
      data: {
        workspaceId:
          workspace.id,

        clientId,

        caseId:
          data.caseId,

        title:
          data.title,

        description:
          data.description,

        type:
          data.type,

        status:
          TaskStatus.PENDENTE,

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
        task.id,

      workspaceId:
        workspace.id,

      userId:
        user.id,
    });

  if (!googleSync.success) {
    console.error(
      "Compromisso criado no LexFlow, mas não sincronizado com Google Agenda:",
      googleSync.error,
    );
  }

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

  if (data.caseId) {
    revalidatePath(
      `/casos/${data.caseId}`,
    );
  }

  return {
    success: true,
  };
}

export async function createAgendaTask(
  ...args: Parameters<typeof createAgendaTaskImpl>
) {
  return runAction(
    () =>
      createAgendaTaskImpl(
        ...args,
      ),
  );
}
