import { safeErrorSummary } from "@/lib/security/safe-error";
import "server-only";

import {
  TaskStatus,
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
  GOOGLE_REAUTH_MESSAGE,
  isGoogleReauthRequired,
} from "@/lib/google-oauth-error";

import {
  prisma,
} from "@/lib/prisma";

const TIME_ZONE =
  "America/Sao_Paulo";

/* =========================================
   TIPOS
========================================= */

type SyncTaskToGoogleParams = {
  taskId: string;

  workspaceId: string;

  /*
   * Necessário quando a Task ainda
   * não possui googleConnectionId.
   *
   * Nesse caso utilizamos a conexão
   * Google do usuário que realizou
   * a operação.
   */
  userId: string;
};

type DeleteTaskFromGoogleParams = {
  taskId: string;

  workspaceId: string;
};

export type TaskGoogleSyncResult =
  | {
      success: true;

      synced: true;

      action:
        | "created"
        | "updated"
        | "deleted";
    }
  | {
      success: true;

      synced: false;

      reason:
        | "not-connected"
        | "sync-disabled"
        | "task-not-found"
        | "no-google-event";
    }
  | {
      success: false;

      synced: false;

      reason:
        | "reauth-required"
        | "google-error";

      error: string;
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
      "Não foi possível determinar a data da tarefa.",
    );
  }

  return `${year}-${month}-${day}`;
}

function nextDateKey(
  dateKey: string,
): string {
  const date =
    new Date(
      `${dateKey}T00:00:00.000Z`,
    );

  date.setUTCDate(
    date.getUTCDate() + 1,
  );

  return date
    .toISOString()
    .slice(0, 10);
}

/* =========================================
   ERROS GOOGLE
========================================= */

function getGoogleStatus(
  error: unknown,
): number | null {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return null;
  }

  const candidate =
    error as {
      code?: number;

      response?: {
        status?: number;
      };
    };

  return (
    candidate.code ??
    candidate.response?.status ??
    null
  );
}

function isMissingGoogleEvent(
  error: unknown,
): boolean {
  const status =
    getGoogleStatus(
      error,
    );

  return (
    status === 404 ||
    status === 410
  );
}

/* =========================================
   CLIENT GOOGLE
========================================= */

function createCalendarClient(
  refreshTokenEncrypted: string,
) {
  const oauthClient =
    createGoogleOAuthClient();

  const refreshToken =
    decryptSecret(
      refreshTokenEncrypted,
    );

  oauthClient.setCredentials({
    refresh_token:
      refreshToken,
  });

  return google.calendar({
    version: "v3",

    auth:
      oauthClient,
  });
}

/* =========================================
   EVENTO GOOGLE
========================================= */

type TaskForGoogle =
  NonNullable<
    Awaited<
      ReturnType<
        typeof getTask
      >
    >
  >;

function buildGoogleEvent(
  task: TaskForGoogle,
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
          /*
           * Isso permite reconhecer
           * posteriormente que esse
           * evento pertence a esta
           * Task do LexFlow.
           */
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
  if (task.startsAt) {
    const start =
      task.startsAt;

    let end =
      task.endsAt;

    /*
     * Enquanto alguns formulários
     * ainda não possuem horário de
     * término, usamos duração padrão
     * de uma hora.
     */
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
   * Tarefa/prazo sem horário:
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
     * No Google Calendar o fim de
     * evento de dia inteiro é
     * exclusivo.
     */
    end: {
      date:
        nextDateKey(
          dateKey,
        ),
    },
  };
}

/* =========================================
   TASK
========================================= */

async function getTask(
  taskId: string,
  workspaceId: string,
) {
  return prisma.task.findFirst({
    where: {
      id:
        taskId,

      workspaceId,
    },
  });
}

/* =========================================
   CONEXÃO GOOGLE
========================================= */

async function getConnectionForTask({
  googleConnectionId,
  workspaceId,
  userId,
}: {
  googleConnectionId:
    string | null;

  workspaceId:
    string;

  userId:
    string;
}) {
  /*
   * Se a Task já foi sincronizada,
   * continuamos utilizando a mesma
   * conta Google.
   */
  if (googleConnectionId) {
    const connection =
      await prisma.googleCalendarConnection.findFirst({
        where: {
          id:
            googleConnectionId,

          workspaceId,
        },
      });

    if (connection) {
      return connection;
    }
  }

  /*
   * Para uma Task nova utilizamos
   * a conexão do usuário atual.
   */
  return prisma.googleCalendarConnection.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });
}

/* =========================================
   CRIAR EVENTO
========================================= */

async function insertGoogleEvent({
  calendar,
  calendarId,
  task,
}: {
  calendar:
    calendar_v3.Calendar;

  calendarId:
    string;

  task:
    TaskForGoogle;
}) {
  const response =
    await calendar.events.insert({
      calendarId,

      requestBody:
        buildGoogleEvent(
          task,
        ),
    });

  const eventId =
    response.data.id;

  if (!eventId) {
    throw new Error(
      "O Google não retornou o ID do evento criado.",
    );
  }

  return eventId;
}

/* =========================================
   SINCRONIZAR TASK -> GOOGLE
========================================= */

export async function syncTaskToGoogleCalendar({
  taskId,
  workspaceId,
  userId,
}: SyncTaskToGoogleParams): Promise<TaskGoogleSyncResult> {
  try {
    const task =
      await getTask(
        taskId,
        workspaceId,
      );

    if (!task) {
      return {
        success: true,
        synced: false,
        reason:
          "task-not-found",
      };
    }

    const connection =
      await getConnectionForTask({
        googleConnectionId:
          task.googleConnectionId,

        workspaceId,

        userId,
      });

    if (!connection) {
      /*
       * Não conectar Google Agenda
       * não impede utilizar o LexFlow.
       */
      return {
        success: true,
        synced: false,
        reason:
          "not-connected",
      };
    }

    if (
      !connection.syncToGoogle
    ) {
      return {
        success: true,
        synced: false,
        reason:
          "sync-disabled",
      };
    }

    const calendar =
      createCalendarClient(
        connection
          .refreshTokenEncrypted,
      );

    /* ==========================
       TASK CANCELADA
    ========================== */

    if (
      task.status ===
      TaskStatus.CANCELADA
    ) {
      if (
        task.googleEventId
      ) {
        try {
          await calendar.events.delete({
            calendarId:
              task.googleCalendarId ??
              connection.calendarId,

            eventId:
              task.googleEventId,
          });
        } catch (error) {
          /*
           * Se o evento já tiver sido
           * excluído no Google, o
           * resultado desejado já foi
           * alcançado.
           */
          if (
            !isMissingGoogleEvent(
              error,
            )
          ) {
            throw error;
          }
        }
      }

      await prisma.task.update({
        where: {
          id:
            task.id,
        },

        data: {
          googleConnectionId:
            null,

          googleCalendarId:
            null,

          googleEventId:
            null,
        },
      });

      await prisma.googleCalendarConnection.update({
        where: {
          id:
            connection.id,
        },

        data: {
          lastSyncedAt:
            new Date(),
        },
      });

      return {
        success: true,
        synced: true,
        action:
          "deleted",
      };
    }

    /* ==========================
       ATUALIZAR EVENTO EXISTENTE
    ========================== */

    if (
      task.googleEventId &&
      task.googleConnectionId ===
        connection.id
    ) {
      try {
        const response =
          await calendar.events.patch({
            calendarId:
              task.googleCalendarId ??
              connection.calendarId,

            eventId:
              task.googleEventId,

            requestBody:
              buildGoogleEvent(
                task,
              ),
          });

        const eventId =
          response.data.id ??
          task.googleEventId;

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

            googleEventId:
              eventId,
          },
        });

        await prisma.googleCalendarConnection.update({
          where: {
            id:
              connection.id,
          },

          data: {
            lastSyncedAt:
              new Date(),
          },
        });

        return {
          success: true,
          synced: true,
          action:
            "updated",
        };
      } catch (error) {
        /*
         * Se a Task possui eventId,
         * mas o evento foi removido
         * diretamente no Google,
         * recriamos abaixo.
         */
        if (
          !isMissingGoogleEvent(
            error,
          )
        ) {
          throw error;
        }
      }
    }

    /* ==========================
       CRIAR NOVO EVENTO
    ========================== */

    const eventId =
      await insertGoogleEvent({
        calendar,

        calendarId:
          connection.calendarId,

        task,
      });

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

        googleEventId:
          eventId,
      },
    });

    await prisma.googleCalendarConnection.update({
      where: {
        id:
          connection.id,
      },

      data: {
        lastSyncedAt:
          new Date(),
      },
    });

    return {
      success: true,
      synced: true,
      action:
        "created",
    };
  } catch (error) {
    console.error(
      "Erro ao sincronizar Task com Google Agenda:",
      safeErrorSummary(error),
    );

    if (
      isGoogleReauthRequired(
        error,
      )
    ) {
      return {
        success: false,
        synced: false,
        reason:
          "reauth-required",
        error:
          GOOGLE_REAUTH_MESSAGE,
      };
    }

    return {
      success: false,
      synced: false,
      reason:
        "google-error",

      error:
        "Não foi possível sincronizar a tarefa com o Google Agenda.",
    };
  }
}

/* =========================================
   EXCLUIR TASK -> GOOGLE
========================================= */

export async function deleteTaskFromGoogleCalendar({
  taskId,
  workspaceId,
}: DeleteTaskFromGoogleParams): Promise<TaskGoogleSyncResult> {
  try {
    const task =
      await getTask(
        taskId,
        workspaceId,
      );

    if (!task) {
      return {
        success: true,
        synced: false,
        reason:
          "task-not-found",
      };
    }

    if (
      !task.googleEventId ||
      !task.googleConnectionId
    ) {
      return {
        success: true,
        synced: false,
        reason:
          "no-google-event",
      };
    }

    const connection =
      await prisma.googleCalendarConnection.findFirst({
        where: {
          id:
            task.googleConnectionId,

          workspaceId,
        },
      });

    if (!connection) {
      return {
        success: true,
        synced: false,
        reason:
          "not-connected",
      };
    }

    if (
      !connection.syncToGoogle
    ) {
      return {
        success: true,
        synced: false,
        reason:
          "sync-disabled",
      };
    }

    const calendar =
      createCalendarClient(
        connection
          .refreshTokenEncrypted,
      );

    try {
      await calendar.events.delete({
        calendarId:
          task.googleCalendarId ??
          connection.calendarId,

        eventId:
          task.googleEventId,
      });
    } catch (error) {
      if (
        !isMissingGoogleEvent(
          error,
        )
      ) {
        throw error;
      }
    }

    await prisma.googleCalendarConnection.update({
      where: {
        id:
          connection.id,
      },

      data: {
        lastSyncedAt:
          new Date(),
      },
    });

    return {
      success: true,
      synced: true,
      action:
        "deleted",
    };
  } catch (error) {
    console.error(
      "Erro ao excluir evento do Google Agenda:",
      safeErrorSummary(error),
    );

    if (
      isGoogleReauthRequired(
        error,
      )
    ) {
      return {
        success: false,
        synced: false,
        reason:
          "reauth-required",
        error:
          GOOGLE_REAUTH_MESSAGE,
      };
    }

    return {
      success: false,
      synced: false,
      reason:
        "google-error",

      error:
        "Não foi possível excluir o evento do Google Agenda.",
    };
  }
}