import "server-only";

import {
  TaskSource,
  TaskStatus,
  TaskType,
} from "@prisma/client";

import {
  google,
  type calendar_v3,
} from "googleapis";

import {
  decryptSecret,
} from "@/lib/crypto";

import {
  createGoogleOAuthClient,
} from "@/lib/google-calendar";

import {
  prisma,
} from "@/lib/prisma";

const TIME_ZONE =
  "America/Sao_Paulo";

const IMPORT_PAST_DAYS =
  30;

const IMPORT_FUTURE_YEARS =
  2;

type GoogleConnection = {
  id: string;
  workspaceId: string;
  userId: string;

  calendarId: string;

  refreshTokenEncrypted:
    string;

  syncToken:
    string | null;

  syncFromGoogle:
    boolean;

  syncToGoogle:
    boolean;
};

export type GoogleCalendarSyncResult = {
  imported:
    number;

  updated:
    number;

  cancelled:
    number;

  exported:
    number;

  skippedRecurring:
    number;
};

/* =========================================
   DATAS
========================================= */

function getDateKeyInSaoPaulo(
  value: Date,
): string {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          TIME_ZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      },
    ).formatToParts(
      value,
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
      "Não foi possível determinar a data.",
    );
  }

  return `${year}-${month}-${day}`;
}

function dateFromKey(
  value: string,
): Date {
  return new Date(
    `${value}T12:00:00.000Z`,
  );
}

function shiftDateKey(
  value: string,
  days: number,
): string {
  const date =
    new Date(
      `${value}T00:00:00.000Z`,
    );

  date.setUTCDate(
    date.getUTCDate() +
      days,
  );

  return date
    .toISOString()
    .slice(
      0,
      10,
    );
}

function getImportWindow() {
  const todayKey =
    getDateKeyInSaoPaulo(
      new Date(),
    );

  const today =
    dateFromKey(
      todayKey,
    );

  const from =
    new Date(
      today,
    );

  from.setUTCDate(
    from.getUTCDate() -
      IMPORT_PAST_DAYS,
  );

  const until =
    new Date(
      today,
    );

  until.setUTCFullYear(
    until.getUTCFullYear() +
      IMPORT_FUTURE_YEARS,
  );

  return {
    from,
    until,
  };
}

function isInsideImportWindow(
  dueDate: Date,
): boolean {
  const {
    from,
    until,
  } =
    getImportWindow();

  return (
    dueDate >= from &&
    dueDate <= until
  );
}

/* =========================================
   GOOGLE CLIENT
========================================= */

function getCalendarClient(
  connection:
    GoogleConnection,
) {
  const oauthClient =
    createGoogleOAuthClient();

  const refreshToken =
    decryptSecret(
      connection
        .refreshTokenEncrypted,
    );

  oauthClient.setCredentials({
    refresh_token:
      refreshToken,
  });

  return google.calendar({
    version:
      "v3",

    auth:
      oauthClient,
  });
}

/* =========================================
   GOOGLE EVENT -> DATAS DA TASK
========================================= */

function getTaskDatesFromGoogleEvent(
  event:
    calendar_v3.Schema$Event,
) {
  const googleStart =
    event.start;

  if (
    googleStart
      ?.dateTime
  ) {
    const startsAt =
      new Date(
        googleStart.dateTime,
      );

    if (
      Number.isNaN(
        startsAt.getTime(),
      )
    ) {
      return null;
    }

    const endsAt =
      event.end
        ?.dateTime
        ? new Date(
            event.end
              .dateTime,
          )
        : null;

    const dateKey =
      getDateKeyInSaoPaulo(
        startsAt,
      );

    return {
      startsAt,

      endsAt:
        endsAt &&
        !Number.isNaN(
          endsAt.getTime(),
        )
          ? endsAt
          : null,

      dueDate:
        dateFromKey(
          dateKey,
        ),
    };
  }

  if (
    googleStart
      ?.date
  ) {
    return {
      startsAt:
        null,

      endsAt:
        null,

      dueDate:
        dateFromKey(
          googleStart.date,
        ),
    };
  }

  return null;
}

/* =========================================
   LOCALIZAR TASK DO EVENTO GOOGLE
========================================= */

async function findTaskForGoogleEvent(
  connection:
    GoogleConnection,

  event:
    calendar_v3.Schema$Event,
) {
  if (!event.id) {
    return null;
  }

  const privateProperties =
    event
      .extendedProperties
      ?.private;

  const taggedWorkspaceId =
    privateProperties
      ?.lexflowWorkspaceId;

  const taggedTaskId =
    privateProperties
      ?.lexflowTaskId;

  /*
   * Se o evento tiver sido criado
   * pelo LexFlow, conseguimos
   * localizar diretamente a Task.
   */
  if (
    taggedTaskId &&
    taggedWorkspaceId ===
      connection.workspaceId
  ) {
    const taggedTask =
      await prisma.task.findFirst({
        where: {
          id:
            taggedTaskId,

          workspaceId:
            connection.workspaceId,
        },
      });

    if (taggedTask) {
      return taggedTask;
    }
  }

  /*
   * Também tentamos localizar
   * pela conexão + eventId.
   */
  return prisma.task.findFirst({
    where: {
      workspaceId:
        connection.workspaceId,

      googleConnectionId:
        connection.id,

      googleEventId:
        event.id,
    },
  });
}

/* =========================================
   GOOGLE -> LEXFLOW
========================================= */

async function applyGoogleEvent(
  connection:
    GoogleConnection,

  event:
    calendar_v3.Schema$Event,
): Promise<{
  imported:
    number;

  updated:
    number;

  cancelled:
    number;

  skippedRecurring:
    number;
}> {
  if (!event.id) {
    return {
      imported: 0,
      updated: 0,
      cancelled: 0,
      skippedRecurring: 0,
    };
  }

  const existingTask =
    await findTaskForGoogleEvent(
      connection,
      event,
    );

  /* ==========================
     EVENTO EXCLUÍDO NO GOOGLE
  ========================== */

  if (
    event.status ===
    "cancelled"
  ) {
    if (
      existingTask &&
      existingTask.status !==
        TaskStatus.CANCELADA
    ) {
      await prisma.task.update({
        where: {
          id:
            existingTask.id,
        },

        data: {
          status:
            TaskStatus.CANCELADA,

          completedAt:
            null,
        },
      });

      return {
        imported: 0,
        updated: 0,
        cancelled: 1,
        skippedRecurring: 0,
      };
    }

    return {
      imported: 0,
      updated: 0,
      cancelled: 0,
      skippedRecurring: 0,
    };
  }

  /* ==========================
     EVENTOS ESPECIAIS
  ========================== */

  /*
   * Nesta primeira versão
   * ignoramos aniversário,
   * working location,
   * focus time etc.
   */
  if (
    event.eventType &&
    event.eventType !==
      "default"
  ) {
    return {
      imported: 0,
      updated: 0,
      cancelled: 0,
      skippedRecurring: 0,
    };
  }

  /* ==========================
     RECORRÊNCIA
  ========================== */

  /*
   * Task ainda não possui
   * regra de recorrência.
   *
   * Por isso não transformamos
   * uma reunião semanal do Google
   * em uma única Task incorreta.
   */
  if (
    event.recurrence &&
    event.recurrence.length >
      0
  ) {
    return {
      imported: 0,
      updated: 0,
      cancelled: 0,
      skippedRecurring: 1,
    };
  }

  const dates =
    getTaskDatesFromGoogleEvent(
      event,
    );

  if (!dates) {
    return {
      imported: 0,
      updated: 0,
      cancelled: 0,
      skippedRecurring: 0,
    };
  }

  const title =
    event.summary?.trim() ||
    "Compromisso do Google Agenda";

  const description =
    event.description?.trim() ||
    null;

  const location =
    event.location?.trim() ||
    null;

  /* ==========================
     ATUALIZA TASK EXISTENTE
  ========================== */

  if (existingTask) {
    await prisma.task.update({
      where: {
        id:
          existingTask.id,
      },

      data: {
        title,

        description,

        location,

        startsAt:
          dates.startsAt,

        endsAt:
          dates.endsAt,

        dueDate:
          dates.dueDate,

        googleConnectionId:
          connection.id,

        googleCalendarId:
          connection.calendarId,

        googleEventId:
          event.id,

        /*
         * Se nasceu no Google,
         * uma eventual restauração
         * do evento reabre a tarefa.
         *
         * Se nasceu no LexFlow,
         * preservamos o status
         * interno.
         */
        status:
          existingTask.source ===
            TaskSource.GOOGLE_CALENDAR &&
          existingTask.status ===
            TaskStatus.CANCELADA
            ? TaskStatus.PENDENTE
            : existingTask.status,
      },
    });

    return {
      imported: 0,
      updated: 1,
      cancelled: 0,
      skippedRecurring: 0,
    };
  }

  /* ==========================
     NOVO EVENTO EXTERNO
  ========================== */

  if (
    !isInsideImportWindow(
      dates.dueDate,
    )
  ) {
    return {
      imported: 0,
      updated: 0,
      cancelled: 0,
      skippedRecurring: 0,
    };
  }

  await prisma.task.create({
    data: {
      workspaceId:
        connection.workspaceId,

      title,

      description,

      location,

      type:
        TaskType.OUTRO,

      status:
        TaskStatus.PENDENTE,

      source:
        TaskSource.GOOGLE_CALENDAR,

      startsAt:
        dates.startsAt,

      endsAt:
        dates.endsAt,

      dueDate:
        dates.dueDate,

      googleConnectionId:
        connection.id,

      googleCalendarId:
        connection.calendarId,

      googleEventId:
        event.id,
    },
  });

  return {
    imported: 1,
    updated: 0,
    cancelled: 0,
    skippedRecurring: 0,
  };
}

/* =========================================
   BUSCAR ALTERAÇÕES DO GOOGLE
========================================= */

function isSyncTokenExpired(
  error: unknown,
): boolean {
  if (
    typeof error !==
      "object" ||
    error === null
  ) {
    return false;
  }

  const candidate =
    error as {
      code?: number;

      response?: {
        status?:
          number;
      };
    };

  return (
    candidate.code === 410 ||
    candidate.response
      ?.status === 410
  );
}

async function pullGoogleChanges(
  connection:
    GoogleConnection,

  calendar:
    calendar_v3.Calendar,

  syncToken:
    string | null,
) {
  let pageToken:
    string | undefined;

  let nextSyncToken:
    string | null =
      null;

  let imported =
    0;

  let updated =
    0;

  let cancelled =
    0;

  let skippedRecurring =
    0;

  do {
    const response =
      await calendar.events.list({
        calendarId:
          connection.calendarId,

        /*
         * Não expandimos recorrências
         * nesta primeira versão.
         */
        singleEvents:
          false,

        showDeleted:
          true,

        maxResults:
          2500,

        pageToken,

        syncToken:
          syncToken ??
          undefined,
      });

    const events =
      response.data.items ??
      [];

    for (
      const event
      of events
    ) {
      const result =
        await applyGoogleEvent(
          connection,
          event,
        );

      imported +=
        result.imported;

      updated +=
        result.updated;

      cancelled +=
        result.cancelled;

      skippedRecurring +=
        result.skippedRecurring;
    }

    pageToken =
      response.data
        .nextPageToken ??
      undefined;

    if (
      response.data
        .nextSyncToken
    ) {
      nextSyncToken =
        response.data
          .nextSyncToken;
    }
  } while (
    pageToken
  );

  return {
    imported,
    updated,
    cancelled,
    skippedRecurring,
    nextSyncToken,
  };
}

/* =========================================
   TASK -> GOOGLE EVENT
========================================= */

type LexFlowTaskForGoogle =
  Awaited<
    ReturnType<
      typeof getLexFlowTasksForGoogle
    >
  >[number];

function buildGoogleEvent(
  task:
    LexFlowTaskForGoogle,
): calendar_v3.Schema$Event {
  const base:
    calendar_v3.Schema$Event =
    {
      summary:
        task.title,

      description:
        task.description ??
        undefined,

      location:
        task.location ??
        undefined,

      extendedProperties: {
        private: {
          lexflowTaskId:
            task.id,

          lexflowWorkspaceId:
            task.workspaceId,
        },
      },
    };

  /*
   * Compromisso com horário.
   */
  if (
    task.startsAt
  ) {
    const start =
      task.startsAt;

    let end =
      task.endsAt;

    if (
      !end ||
      end <= start
    ) {
      end =
        new Date(
          start.getTime() +
            60 *
              60 *
              1000,
        );
    }

    return {
      ...base,

      start: {
        dateTime:
          start.toISOString(),

        timeZone:
          TIME_ZONE,
      },

      end: {
        dateTime:
          end.toISOString(),

        timeZone:
          TIME_ZONE,
      },
    };
  }

  /*
   * Prazo/tarefa sem horário:
   * evento de dia inteiro.
   */
  const dateKey =
    getDateKeyInSaoPaulo(
      task.dueDate,
    );

  return {
    ...base,

    start: {
      date:
        dateKey,
    },

    /*
     * No Google o final de
     * evento de dia inteiro
     * é exclusivo.
     */
    end: {
      date:
        shiftDateKey(
          dateKey,
          1,
        ),
    },
  };
}

async function getLexFlowTasksForGoogle(
  connection:
    GoogleConnection,
) {
  const {
    from,
    until,
  } =
    getImportWindow();

  return prisma.task.findMany({
    where: {
      workspaceId:
        connection.workspaceId,

      source:
        TaskSource.LEXFLOW,

      status: {
        not:
          TaskStatus.CANCELADA,
      },

      dueDate: {
        gte:
          from,

        lte:
          until,
      },
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
  });
}

/* =========================================
   PUBLICAR UMA TASK
========================================= */

async function publishTaskToGoogle(
  connection:
    GoogleConnection,

  calendar:
    calendar_v3.Calendar,

  task:
    LexFlowTaskForGoogle,
) {
  const requestBody =
    buildGoogleEvent(
      task,
    );

  let googleEventId =
    task.googleEventId;

  if (
    googleEventId &&
    task.googleConnectionId ===
      connection.id
  ) {
    try {
      const response =
        await calendar.events.patch({
          calendarId:
            connection.calendarId,

          eventId:
            googleEventId,

          requestBody,
        });

      googleEventId =
        response.data.id ??
        googleEventId;
    } catch (error) {
      const candidate =
        error as {
          code?: number;

          response?: {
            status?:
              number;
          };
        };

      const notFound =
        candidate.code ===
          404 ||
        candidate.response
          ?.status === 404;

      if (!notFound) {
        throw error;
      }

      /*
       * Caso o evento tenha sido
       * removido no Google e não
       * exista mais, recriamos.
       */
      const response =
        await calendar.events.insert({
          calendarId:
            connection.calendarId,

          requestBody,
        });

      googleEventId =
        response.data.id ??
        null;
    }
  } else {
    const response =
      await calendar.events.insert({
        calendarId:
          connection.calendarId,

        requestBody,
      });

    googleEventId =
      response.data.id ??
      null;
  }

  if (!googleEventId) {
    throw new Error(
      `O Google não retornou o ID do evento da tarefa "${task.title}".`,
    );
  }

  await prisma.task.update({
    where: {
      id:
        task.id,
    },

    data: {
      googleConnectionId:
        connection.id,

      googleCalendarId:
        connection.calendarId,

      googleEventId,
    },
  });
}

/* =========================================
   LEXFLOW -> GOOGLE
========================================= */

async function pushLexFlowTasks(
  connection:
    GoogleConnection,

  calendar:
    calendar_v3.Calendar,
) {
  const tasks =
    await getLexFlowTasksForGoogle(
      connection,
    );

  let exported =
    0;

  for (
    const task
    of tasks
  ) {
    await publishTaskToGoogle(
      connection,
      calendar,
      task,
    );

    exported += 1;
  }

  return exported;
}

/* =========================================
   SINCRONIZAÇÃO COMPLETA
========================================= */

export async function syncGoogleCalendar(
  connection:
    GoogleConnection,
): Promise<GoogleCalendarSyncResult> {
  const calendar =
    getCalendarClient(
      connection,
    );

  let imported =
    0;

  let updated =
    0;

  let cancelled =
    0;

  let skippedRecurring =
    0;

  let nextSyncToken =
    connection.syncToken;

  /* ==========================
     GOOGLE -> LEXFLOW
  ========================== */

  if (
    connection.syncFromGoogle
  ) {
    try {
      const result =
        await pullGoogleChanges(
          connection,
          calendar,
          connection.syncToken,
        );

      imported =
        result.imported;

      updated =
        result.updated;

      cancelled =
        result.cancelled;

      skippedRecurring =
        result.skippedRecurring;

      nextSyncToken =
        result.nextSyncToken;
    } catch (error) {
      /*
       * O Google exige nova
       * sincronização completa
       * quando o syncToken expira.
       */
      if (
        connection.syncToken &&
        isSyncTokenExpired(
          error,
        )
      ) {
        const result =
          await pullGoogleChanges(
            connection,
            calendar,
            null,
          );

        imported =
          result.imported;

        updated =
          result.updated;

        cancelled =
          result.cancelled;

        skippedRecurring =
          result.skippedRecurring;

        nextSyncToken =
          result.nextSyncToken;
      } else {
        throw error;
      }
    }
  }

  /* ==========================
     LEXFLOW -> GOOGLE
  ========================== */

  let exported =
    0;

  if (
    connection.syncToGoogle
  ) {
    exported =
      await pushLexFlowTasks(
        connection,
        calendar,
      );
  }

  await prisma.googleCalendarConnection.update({
    where: {
      id:
        connection.id,
    },

    data: {
      syncToken:
        nextSyncToken,

      lastSyncedAt:
        new Date(),
    },
  });

  return {
    imported,
    updated,
    cancelled,
    exported,
    skippedRecurring,
  };
}