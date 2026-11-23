import {
  TaskStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import type {
  AgendaData,
  AgendaTask,
} from "../types/agenda";

function getSaoPauloDateKey(
  date = new Date(),
): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
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
    );

  const parts =
    formatter.formatToParts(
      date,
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day",
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

function isValidMonthKey(
  value: string,
): boolean {
  if (
    !/^\d{4}-\d{2}$/.test(
      value,
    )
  ) {
    return false;
  }

  const [
    year,
    month,
  ] =
    value
      .split("-")
      .map(Number);

  return (
    year >= 2000 &&
    year <= 2200 &&
    month >= 1 &&
    month <= 12
  );
}

function shiftDateKey(
  dateKey: string,
  amount: number,
): string {
  const [
    year,
    month,
    day,
  ] =
    dateKey
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day + amount,
        12,
      ),
    );

  return [
    date.getUTCFullYear(),

    String(
      date.getUTCMonth() + 1,
    ).padStart(
      2,
      "0",
    ),

    String(
      date.getUTCDate(),
    ).padStart(
      2,
      "0",
    ),
  ].join("-");
}

function getMonthGridRange(
  monthKey: string,
) {
  const [
    year,
    month,
  ] =
    monthKey
      .split("-")
      .map(Number);

  const firstDay =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
        12,
      ),
    );

  /*
   * JS:
   * domingo = 0
   * segunda = 1
   *
   * Nossa agenda começa
   * na segunda-feira.
   */
  const mondayOffset =
    (firstDay.getUTCDay() +
      6) %
    7;

  const firstDateKey =
    `${year}-${String(
      month,
    ).padStart(
      2,
      "0",
    )}-01`;

  const gridStartKey =
    shiftDateKey(
      firstDateKey,
      -mondayOffset,
    );

  const gridEndKey =
    shiftDateKey(
      gridStartKey,
      42,
    );

  return {
    gridStartKey,
    gridEndKey,
  };
}

function localDateStart(
  dateKey: string,
): Date {
  return new Date(
    `${dateKey}T00:00:00-03:00`,
  );
}

function serializeTask(
  task: {
    id: string;

    clientId: string | null;
    caseId: string | null;

    title: string;
    description: string | null;

    type: AgendaTask["type"];
    status: AgendaTask["status"];

    startsAt: Date | null;
    dueDate: Date;
    completedAt: Date | null;

    location: string | null;
    googleEventId: string | null;

    createdAt: Date;
    updatedAt: Date;

    client: {
      name: string;
    } | null;

    case: {
      title: string;
      number: string | null;
      administrativeNumber: string | null;
    } | null;
  },
): AgendaTask {
  return {
    id:
      task.id,

    clientId:
      task.clientId,

    clientName:
      task.client?.name ??
      null,

    caseId:
      task.caseId,

    caseTitle:
      task.case?.title ??
      null,

    caseNumber:
      task.case?.number ??
      task.case
        ?.administrativeNumber ??
      null,

    title:
      task.title,

    description:
      task.description,

    type:
      task.type,

    status:
      task.status,

    startsAt:
      task.startsAt?.toISOString() ??
      null,

    dueDate:
      task.dueDate.toISOString(),

    completedAt:
      task.completedAt?.toISOString() ??
      null,

    location:
      task.location,

    googleEventId:
      task.googleEventId,

    createdAt:
      task.createdAt.toISOString(),

    updatedAt:
      task.updatedAt.toISOString(),
  };
}

const taskSelect = {
  id: true,
  clientId: true,
  caseId: true,
  title: true,
  description: true,
  type: true,
  status: true,
  startsAt: true,
  dueDate: true,
  completedAt: true,
  location: true,
  googleEventId: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { name: true } },
  case: {
    select: {
      title: true,
      number: true,
      administrativeNumber: true,
    },
  },
} as const;

export async function getAgendaData(
  requestedMonth?: string,
): Promise<AgendaData> {
  const workspace =
    await getDefaultWorkspace();

  const todayKey =
    getSaoPauloDateKey();

  const currentMonth =
    todayKey.slice(
      0,
      7,
    );

  const monthKey =
    requestedMonth &&
    isValidMonthKey(
      requestedMonth,
    )
      ? requestedMonth
      : currentMonth;

  const {
    gridStartKey,
    gridEndKey,
  } =
    getMonthGridRange(
      monthKey,
    );

  const gridStart =
    localDateStart(
      gridStartKey,
    );

  const gridEnd =
    localDateStart(
      gridEndKey,
    );

  const todayStart =
    localDateStart(
      todayKey,
    );

  const tomorrowStart =
    localDateStart(
      shiftDateKey(todayKey, 1),
    );

  const overdueWhere = {
    workspaceId: workspace.id,
    status: {
      notIn: [
        TaskStatus.CONCLUIDA,
        TaskStatus.CANCELADA,
      ],
    },
    dueDate: {
      lt: todayStart,
    },
  };

  const [
    tasks,
    overdueTasks,
    clients,
    overdueCount,
    todayTasks,
  ] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          workspaceId:
            workspace.id,

          OR: [
            {
              startsAt: {
                gte:
                  gridStart,

                lt:
                  gridEnd,
              },
            },

            {
              startsAt:
                null,

              dueDate: {
                gte:
                  gridStart,

                lt:
                  gridEnd,
              },
            },
          ],
        },

        select: {
          id: true,

          clientId: true,
          caseId: true,

          title: true,
          description: true,

          type: true,
          status: true,

          startsAt: true,
          dueDate: true,
          completedAt: true,

          location: true,
          googleEventId:
            true,

          createdAt: true,
          updatedAt: true,

          client: {
            select: {
              name: true,
            },
          },

          case: {
            select: {
              title: true,
              number: true,

              administrativeNumber:
                true,
            },
          },
        },

        orderBy: [
          {
            startsAt:
              "asc",
          },

          {
            dueDate:
              "asc",
          },
        ],
      }),

      prisma.task.findMany({
        where: {
          workspaceId:
            workspace.id,

          status: {
            notIn: [
              TaskStatus.CONCLUIDA,
              TaskStatus.CANCELADA,
            ],
          },

          dueDate: {
            lt:
              todayStart,
          },
        },

        select: {
          id: true,

          clientId: true,
          caseId: true,

          title: true,
          description: true,

          type: true,
          status: true,

          startsAt: true,
          dueDate: true,
          completedAt: true,

          location: true,
          googleEventId:
            true,

          createdAt: true,
          updatedAt: true,

          client: {
            select: {
              name: true,
            },
          },

          case: {
            select: {
              title: true,
              number: true,

              administrativeNumber:
                true,
            },
          },
        },

        orderBy: {
          dueDate:
            "asc",
        },

        take: 8,
      }),

      prisma.client.findMany({
        where: {
          workspaceId:
            workspace.id,
        },

        select: {
          id: true,
          name: true,

          cases: {
            select: {
              id: true,

              title: true,

              number: true,

              administrativeNumber:
                true,
            },

            orderBy: {
              createdAt:
                "desc",
            },
          },
        },

        orderBy: {
          name:
            "asc",
        },
      }),

      prisma.task.count({
        where: overdueWhere,
      }),

      prisma.task.findMany({
        where: {
          workspaceId: workspace.id,
          status: {
            not: TaskStatus.CANCELADA,
          },
          OR: [
            {
              startsAt: {
                gte: todayStart,
                lt: tomorrowStart,
              },
            },
            {
              startsAt: null,
              dueDate: {
                gte: todayStart,
                lt: tomorrowStart,
              },
            },
          ],
        },
        select: taskSelect,
        orderBy: [
          { startsAt: "asc" },
          { dueDate: "asc" },
        ],
      }),
    ]);

  return {
    todayKey,

    monthKey,

    tasks:
      tasks.map(
        serializeTask,
      ),

    overdueTasks:
      overdueTasks.map(
        serializeTask,
      ),

    overdueCount,

    todayTasks:
      todayTasks.map(
        serializeTask,
      ),

    clients:
      clients.map(
        (client) => ({
          id:
            client.id,

          name:
            client.name,

          cases:
            client.cases.map(
              (clientCase) => ({
                id:
                  clientCase.id,

                title:
                  clientCase.title,

                number:
                  clientCase.number ??
                  clientCase
                    .administrativeNumber ??
                  null,
              }),
            ),
        }),
      ),
  };
}