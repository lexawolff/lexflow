import Link from "next/link";

import {
  TaskSource,
  TaskStatus,
  TaskType,
} from "@prisma/client";

import {
  CalendarClock,
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
} from "lucide-react";

import {
  CreateAgendaTaskDialog,
} from "@/features/agenda/components/create-agenda-task-dialog";

import type {
  AgendaClientOption,
} from "@/features/agenda/types/agenda";

import type {
  CaseAgendaTask,
} from "../services/get-case-agenda-data";

type Props = {
  clientId:
  string;

  clientName:
  string;

  caseId:
  string;

  caseTitle:
  string;

  caseNumber:
  string | null;

  todayKey:
  string;

  tasks:
  CaseAgendaTask[];

  canCreate:
  boolean;
};

const TIME_ZONE =
  "America/Sao_Paulo";

function getTypeLabel(
  type:
    TaskType,
): string {
  switch (
  type
  ) {
    case TaskType.PRAZO_PROCESSUAL:
      return "Prazo processual";

    case TaskType.AUDIENCIA:
      return "Audiência";

    case TaskType.PERICIA:
      return "Perícia";

    case TaskType.ATENDIMENTO:
      return "Atendimento";

    case TaskType.PRORROGACAO_BENEFICIO:
      return "Prorrogação de benefício";

    case TaskType.DOCUMENTO_PENDENTE:
      return "Documento pendente";

    case TaskType.CONTATO_CLIENTE:
      return "Contato com cliente";

    case TaskType.RPV:
      return "RPV / Precatório";

    default:
      return "Outro";
  }
}

function getTypeClasses(
  type:
    TaskType,
): string {
  switch (
  type
  ) {
    case TaskType.PRAZO_PROCESSUAL:
      return "border-rose-200 bg-rose-50/60 text-rose-700 dark:border-rose-900 dark:bg-rose-950/15 dark:text-rose-300";

    case TaskType.AUDIENCIA:
      return "border-violet-200 bg-violet-50/60 text-violet-700 dark:border-violet-900 dark:bg-violet-950/15 dark:text-violet-300";

    case TaskType.PERICIA:
      return "border-blue-200 bg-blue-50/60 text-blue-700 dark:border-blue-900 dark:bg-blue-950/15 dark:text-blue-300";

    case TaskType.ATENDIMENTO:
      return "border-cyan-200 bg-cyan-50/60 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/15 dark:text-cyan-300";

    case TaskType.PRORROGACAO_BENEFICIO:
      return "border-amber-200 bg-amber-50/60 text-amber-700 dark:border-amber-900 dark:bg-amber-950/15 dark:text-amber-300";

    case TaskType.DOCUMENTO_PENDENTE:
      return "border-orange-200 bg-orange-50/60 text-orange-700 dark:border-orange-900 dark:bg-orange-950/15 dark:text-orange-300";

    case TaskType.CONTATO_CLIENTE:
      return "border-sky-200 bg-sky-50/60 text-sky-700 dark:border-sky-900 dark:bg-sky-950/15 dark:text-sky-300";

    case TaskType.RPV:
      return "border-violet-200 bg-violet-50/60 text-violet-700 dark:border-violet-900 dark:bg-violet-950/15 dark:text-violet-300";

    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

function getEffectiveStatus(
  task:
    CaseAgendaTask,

  todayKey:
    string,
): TaskStatus {
  const dueKey =
    task.dueDate.slice(
      0,
      10,
    );

  if (
    dueKey <
    todayKey &&
    task.status !==
    TaskStatus.CONCLUIDA &&
    task.status !==
    TaskStatus.CANCELADA
  ) {
    return TaskStatus.ATRASADA;
  }

  return task.status;
}

function getStatusLabel(
  status:
    TaskStatus,
): string {
  switch (
  status
  ) {
    case TaskStatus.EM_ANDAMENTO:
      return "Em andamento";

    case TaskStatus.CONCLUIDA:
      return "Concluída";

    case TaskStatus.CANCELADA:
      return "Cancelada";

    case TaskStatus.ATRASADA:
      return "Atrasada";

    default:
      return "Pendente";
  }
}

function getStatusClasses(
  status:
    TaskStatus,
): string {
  switch (
  status
  ) {
    case TaskStatus.ATRASADA:
      return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";

    case TaskStatus.EM_ANDAMENTO:
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";

    case TaskStatus.CONCLUIDA:
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";

    case TaskStatus.CANCELADA:
      return "bg-muted text-muted-foreground";

    default:
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
}

function getTaskAccentClasses(
  status:
    TaskStatus,
): string {
  switch (
  status
  ) {
    case TaskStatus.ATRASADA:
      return "border-l-rose-500";

    case TaskStatus.EM_ANDAMENTO:
      return "border-l-blue-500";

    case TaskStatus.CONCLUIDA:
      return "border-l-emerald-500";

    case TaskStatus.CANCELADA:
      return "border-l-muted-foreground/30";

    default:
      return "border-l-amber-400";
  }
}

function formatDate(
  value:
    string,
): string {
  const dateKey =
    value.slice(
      0,
      10,
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
    string,
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

export function CaseAgendaSection({
  clientId,
  clientName,
  caseId,
  caseTitle,
  caseNumber,
  todayKey,
  tasks,
  canCreate,
}: Props) {
  const clients:
    AgendaClientOption[] =
    [
      {
        id:
          clientId,

        name:
          clientName,

        cases: [
          {
            id:
              caseId,

            title:
              caseTitle,

            number:
              caseNumber,
          },
        ],
      },
    ];

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-200 bg-card shadow-sm dark:border-blue-900">
      {/* ==========================
          CABEÇALHO
      ========================== */}

      <div className="flex flex-col gap-4 border-b border-blue-100 bg-blue-50/30 px-5 py-4 dark:border-blue-900 dark:bg-blue-950/10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            <CalendarClock className="size-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">
                Compromissos e prazos
              </h2>

              {tasks.length >
                0 ? (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-blue-200 bg-background px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-900 dark:text-blue-300">
                  {
                    tasks.length
                  }
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
              Prazos, perícias, audiências e demais atividades vinculadas a este caso.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {canCreate ? (
            <CreateAgendaTaskDialog
              clients={
                clients
              }
              todayKey={
                todayKey
              }
              initialClientId={
                clientId
              }
              initialCaseId={
                caseId
              }
              lockClient
              lockCase
              triggerLabel="Adicionar compromisso"
            />
          ) : null}
        </div>
      </div>

      {/* ==========================
          CONTEÚDO
      ========================== */}

      <div className="p-4 sm:p-5">
        {tasks.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/10 px-6 py-10 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
              <CalendarDays className="size-5" />
            </div>

            <h3 className="mt-4 font-semibold">
              Nenhum compromisso pendente
            </h3>

            <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
              Quando você cadastrar um prazo,
              perícia, audiência ou outra tarefa
              deste caso, ela aparecerá aqui e
              também na Agenda do LexFlow.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map(
              (
                task,
              ) => {
                const effectiveStatus =
                  getEffectiveStatus(
                    task,
                    todayKey,
                  );

                const monthKey =
                  task.dueDate.slice(
                    0,
                    7,
                  );

                return (
                  <article
                    key={
                      task.id
                    }
                    className={`rounded-2xl border border-l-4 bg-background px-4 py-4 transition hover:bg-muted/20 hover:shadow-sm sm:px-5 ${getTaskAccentClasses(
                      effectiveStatus,
                    )}`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        {/* BADGES */}

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${getTypeClasses(
                              task.type,
                            )}`}
                          >
                            {
                              getTypeLabel(
                                task.type,
                              )
                            }
                          </span>

                          <span
                            className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${getStatusClasses(
                              effectiveStatus,
                            )}`}
                          >
                            {
                              getStatusLabel(
                                effectiveStatus,
                              )
                            }
                          </span>

                          {task.source ===
                            TaskSource.GOOGLE_CALENDAR ? (
                            <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                              Google Agenda
                            </span>
                          ) : null}
                        </div>

                        {/* TÍTULO */}

                        <h3 className="mt-2.5 break-words font-semibold">
                          {
                            task.title
                          }
                        </h3>

                        {/* DATA / HORA / LOCAL */}

                        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-4" />

                            {
                              formatDate(
                                task.dueDate,
                              )
                            }
                          </span>

                          {task.startsAt ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="size-4" />

                              {
                                formatTime(
                                  task.startsAt,
                                )
                              }
                            </span>
                          ) : null}

                          {task.location ? (
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <MapPin className="size-4 shrink-0" />

                              <span className="break-words">
                                {
                                  task.location
                                }
                              </span>
                            </span>
                          ) : null}
                        </div>

                        {task.description ? (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {
                              task.description
                            }
                          </p>
                        ) : null}
                      </div>

                      <Link
                        href={`/agenda?month=${monthKey}`}
                        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary transition hover:underline"
                      >
                        Abrir na agenda

                        <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </div>

      {/* ==========================
          RODAPÉ
      ========================== */}

      {tasks.length >
        0 ? (
        <div className="border-t bg-muted/10 px-5 py-3.5 sm:px-6">
          <Link
            href="/agenda"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:underline"
          >
            Ver agenda completa

            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}