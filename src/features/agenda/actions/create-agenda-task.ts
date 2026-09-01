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

  /*
   * Meio-dia UTC evita que
   * a data "ande" ao ser
   * exibida no Brasil.
   */
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

export async function createAgendaTask(
  formData: FormData,
) {
  const user =
    await requireCurrentUser();

  const workspace =
    await getDefaultWorkspace();

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

    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Dados inválidos.",
    );
  }

  const data =
    parsed.data;

  let clientId =
    data.clientId;

  /*
   * Se houver processo,
   * o cliente verdadeiro
   * vem do próprio processo.
   *
   * Assim evitamos:
   * cliente A + processo B.
   */
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
   * Primeiro salvamos no LexFlow.
   *
   * A Task é nossa fonte de verdade.
   * O Google nunca deve impedir o
   * cadastro do compromisso.
   */
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

  /*
   * Depois tentamos enviar
   * imediatamente ao Google.
   *
   * Se o Google falhar, a Task
   * permanece salva normalmente.
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

  /*
   * A ficha individual do processo
   * fica dentro da rota do cliente.
   */
  if (
    clientId &&
    data.caseId
  ) {
    revalidatePath(
      `/clientes/${clientId}/casos/${data.caseId}`,
    );
  }

  return {
    success: true,
  };
}