import "server-only";

import type {
  TaskSource,
  TaskStatus,
  TaskType,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

export type CaseAgendaTask = {
  id: string;

  title: string;

  description:
    string | null;

  type:
    TaskType;

  status:
    TaskStatus;

  source:
    TaskSource;

  startsAt:
    string | null;

  dueDate:
    string;

  location:
    string | null;
};

export type CaseAgendaData = {
  todayKey:
    string;

  tasks:
    CaseAgendaTask[];
};

type Input = {
  workspaceId:
    string;

  caseId:
    string;
};

function getTodayKey(): string {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Sao_Paulo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      },
    ).formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day",
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    throw new Error(
      "Não foi possível determinar a data atual.",
    );
  }

  return `${year}-${month}-${day}`;
}

export async function getCaseAgendaData({
  workspaceId,
  caseId,
}: Input): Promise<CaseAgendaData> {
  const tasks =
    await prisma.task.findMany({
      where: {
        workspaceId,
        caseId,

        status: {
          notIn: [
            "CONCLUIDA",
            "CANCELADA",
          ],
        },
      },

      select: {
        id:
          true,

        title:
          true,

        description:
          true,

        type:
          true,

        status:
          true,

        source:
          true,

        startsAt:
          true,

        dueDate:
          true,

        location:
          true,
      },

      orderBy: [
        {
          dueDate:
            "asc",
        },

        {
          startsAt:
            "asc",
        },
      ],

      take:
        10,
    });

  return {
    todayKey:
      getTodayKey(),

    tasks:
      tasks.map(
        (task) => ({
          id:
            task.id,

          title:
            task.title,

          description:
            task.description,

          type:
            task.type,

          status:
            task.status,

          source:
            task.source,

          startsAt:
            task.startsAt
              ? task.startsAt.toISOString()
              : null,

          dueDate:
            task.dueDate.toISOString(),

          location:
            task.location,
        }),
      ),
  };
}