import Link from "next/link";

import {
  AlertTriangle,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
} from "lucide-react";

import {
  TaskType,
} from "@prisma/client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  CreateAgendaTaskDialog,
} from "@/features/agenda/components/create-agenda-task-dialog";

import type {
  AgendaClientOption,
} from "@/features/agenda/types/agenda";

import type {
  ClientDetails,
} from "../types";

type DateLike =
  | Date
  | string;

type ClientTask = {
  id: string;

  title: string;

  type: TaskType;

  startsAt:
    | DateLike
    | null;

  dueDate:
    DateLike;

  location:
    string | null;

  caseId:
    string | null;

  case:
    | {
        id: string;

        title: string;

        number:
          string | null;

        administrativeNumber:
          string | null;
      }
    | null;
};

type UpcomingClientEventsProps = {
  clientId: string;

  clientName: string;

  cases:
    ClientDetails["cases"];

  tasks:
    ClientTask[];
};

const TIME_ZONE =
  "America/Sao_Paulo";

const TASK_LABELS: Record<
  TaskType,
  string
> = {
  PRAZO_PROCESSUAL:
    "Prazo processual",

  PRORROGACAO_BENEFICIO:
    "Prorrogação de benefício",

  AUDIENCIA:
    "Audiência",

  PERICIA:
    "Perícia",

  ATENDIMENTO:
    "Atendimento",

  DOCUMENTO_PENDENTE:
    "Documento pendente",

  CONTATO_CLIENTE:
    "Contato com cliente",

  RPV:
    "RPV / Precatório",

  OUTRO:
    "Outro",
};

function getTodayKey(): string {
  return new Intl.DateTimeFormat(
    "en-CA",
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
  ).format(
    new Date(),
  );
}

function getDateKey(
  value:
    DateLike,
): string {
  if (
    typeof value ===
    "string"
  ) {
    return value.slice(
      0,
      10,
    );
  }

  return new Intl.DateTimeFormat(
    "en-CA",
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
  ).format(
    value,
  );
}

function formatDateKey(
  value:
    DateLike,
): string {
  const dateKey =
    getDateKey(
      value,
    );

  const [
    year,
    month,
    day,
  ] =
    dateKey.split(
      "-",
    );

  return `${day}/${month}/${year}`;
}

function formatTime(
  value:
    DateLike,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,

      timeZone:
        TIME_ZONE,
    },
  ).format(
    new Date(
      value,
    ),
  );
}

function TaskRow({
  task,
  clientId,
  overdue = false,
}: {
  task:
    ClientTask;

  clientId:
    string;

  overdue?:
    boolean;
}) {
  const processIdentification =
    task.case?.number ??
    task.case
      ?.administrativeNumber ??
    null;

  return (
    <div
      className={
        overdue
          ? "rounded-xl border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-900 dark:bg-rose-950/10"
          : "rounded-xl border bg-muted/20 p-4"
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            overdue
              ? "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              : "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          }
        >
          {overdue ? (
            <AlertTriangle className="size-4" />
          ) : (
            <CalendarDays className="size-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <p className="font-medium">
                {
                  task.title
                }
              </p>

              <p
                className={
                  overdue
                    ? "mt-1 text-xs font-medium text-rose-700 dark:text-rose-300"
                    : "mt-1 text-xs font-medium text-muted-foreground"
                }
              >
                {
                  TASK_LABELS[
                    task.type
                  ]
                }
              </p>
            </div>

            {overdue ? (
              <span className="w-fit rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                Vencido
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />

              {formatDateKey(
                task.dueDate,
              )}

              {task.startsAt
                ? ` às ${formatTime(
                    task.startsAt,
                  )}`
                : ""}
            </span>

            {task.location ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />

                {
                  task.location
                }
              </span>
            ) : null}
          </div>

          {task.case ? (
            <div className="mt-3 border-t pt-3">
              <Link
                href={`/clientes/${clientId}/casos/${task.case.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {
                  task.case.title
                }

                {processIdentification
                  ? ` • ${processIdentification}`
                  : ""}

                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          ) : (
            <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
              Compromisso geral do cliente
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function UpcomingClientEvents({
  clientId,
  clientName,
  cases,
  tasks,
}: UpcomingClientEventsProps) {
  const todayKey =
    getTodayKey();

  const agendaClients:
    AgendaClientOption[] =
    [
      {
        id:
          clientId,

        name:
          clientName,

        cases:
          cases.map(
            (
              clientCase,
            ) => ({
              id:
                clientCase.id,

              title:
                clientCase.title,

              number:
                clientCase.number,
            }),
          ),
      },
    ];

  const overdueTasks =
    tasks.filter(
      (task) =>
        getDateKey(
          task.dueDate,
        ) <
        todayKey,
    );

  const upcomingTasks =
    tasks.filter(
      (task) =>
        getDateKey(
          task.dueDate,
        ) >=
        todayKey,
    );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>
              Agenda do cliente
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Prazos e compromissos ativos vinculados ao cliente e aos seus casos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/agenda"
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Ver agenda completa
            </Link>

            <CreateAgendaTaskDialog
              clients={
                agendaClients
              }
              todayKey={
                todayKey
              }
              initialClientId={
                clientId
              }
              lockClient
              triggerLabel="Novo compromisso"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-5 sm:p-6">
        {tasks.length ===
        0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <CalendarDays className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">
              Nenhuma pendência na agenda
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Este cliente não possui prazos ou compromissos ativos.
            </p>
          </div>
        ) : (
          <>
            {overdueTasks.length >
            0 ? (
              <section className="space-y-3">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="size-4" />

                    Atenção
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {overdueTasks.length} pendência(s) vencida(s).
                  </p>
                </div>

                <div className="space-y-3">
                  {overdueTasks
                    .slice(
                      0,
                      5,
                    )
                    .map(
                      (
                        task,
                      ) => (
                        <TaskRow
                          key={
                            task.id
                          }
                          task={
                            task
                          }
                          clientId={
                            clientId
                          }
                          overdue
                        />
                      ),
                    )}
                </div>
              </section>
            ) : null}

            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">
                  Próximos compromissos
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Próximas atividades previstas para este cliente.
                </p>
              </div>

              {upcomingTasks.length >
              0 ? (
                <div className="space-y-3">
                  {upcomingTasks
                    .slice(
                      0,
                      5,
                    )
                    .map(
                      (
                        task,
                      ) => (
                        <TaskRow
                          key={
                            task.id
                          }
                          task={
                            task
                          }
                          clientId={
                            clientId
                          }
                        />
                      ),
                    )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum compromisso futuro cadastrado.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}