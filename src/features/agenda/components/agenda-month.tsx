"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import type {
  ReactNode,
} from "react";

import type {
  TaskStatus,
  TaskType,
} from "@prisma/client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileClock,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  UsersRound,
} from "lucide-react";

import type {
  AgendaData,
  AgendaTask,
} from "../types/agenda";

import {
  AgendaTaskDetailsDialog,
} from "./agenda-task-details-dialog";

import {
  CreateAgendaTaskDialog,
} from "./create-agenda-task-dialog";

type Props = {
  data:
    AgendaData;

  showCompleted:
    boolean;

  defaultStatusFilter:
    string;

  itemsPerDay:
    number;

  showAttention:
    boolean;

  canCreateAgenda:
    boolean;

  canEditAgenda:
    boolean;

  canDeleteAgenda:
    boolean;
};

type TypeFilter =
  | "TODOS"
  | TaskType;

type StatusFilter =
  | "TODOS"
  | "PENDENTE"
  | "EM_ANDAMENTO"
  | "ATRASADA"
  | "CONCLUIDA"
  | "CANCELADA";

const weekDays = [
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
  "Dom",
];

const typeLabels:
  Record<
    TaskType,
    string
  > = {
  PRAZO_PROCESSUAL:
    "Prazo",

  PRORROGACAO_BENEFICIO:
    "Prorrogação",

  AUDIENCIA:
    "Audiência",

  PERICIA:
    "Perícia",

  ATENDIMENTO:
    "Atendimento",

  DOCUMENTO_PENDENTE:
    "Documento",

  CONTATO_CLIENTE:
    "Contato",

  RPV:
    "RPV",

  OUTRO:
    "Outro",
};

function shiftMonth(
  monthKey:
    string,

  amount:
    number,
): string {
  const [
    year,
    month,
  ] =
    monthKey
      .split("-")
      .map(
        Number,
      );

  const date =
    new Date(
      Date.UTC(
        year,
        month -
        1 +
        amount,
        1,
        12,
      ),
    );

  return [
    date.getUTCFullYear(),

    String(
      date.getUTCMonth() +
      1,
    ).padStart(
      2,
      "0",
    ),
  ].join(
    "-",
  );
}

function shiftDate(
  dateKey:
    string,

  amount:
    number,
): string {
  const [
    year,
    month,
    day,
  ] =
    dateKey
      .split("-")
      .map(
        Number,
      );

  const date =
    new Date(
      Date.UTC(
        year,
        month -
        1,
        day +
        amount,
        12,
      ),
    );

  return [
    date.getUTCFullYear(),

    String(
      date.getUTCMonth() +
      1,
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
  ].join(
    "-",
  );
}

function getMonthGridDates(
  monthKey:
    string,
): string[] {
  const [
    year,
    month,
  ] =
    monthKey
      .split("-")
      .map(
        Number,
      );

  const firstDate =
    new Date(
      Date.UTC(
        year,
        month -
        1,
        1,
        12,
      ),
    );

  const mondayOffset =
    (
      firstDate.getUTCDay() +
      6
    ) %
    7;

  const firstDateKey =
    `${year}-${String(
      month,
    ).padStart(
      2,
      "0",
    )}-01`;

  const start =
    shiftDate(
      firstDateKey,
      -mondayOffset,
    );

  return Array.from(
    {
      length:
        42,
    },

    (
      _,
      index,
    ) =>
      shiftDate(
        start,
        index,
      ),
  );
}

function formatMonth(
  monthKey:
    string,
): string {
  const [
    year,
    month,
  ] =
    monthKey
      .split("-")
      .map(
        Number,
      );

  const date =
    new Date(
      Date.UTC(
        year,
        month -
        1,
        1,
        12,
      ),
    );

  const label =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        month:
          "long",

        year:
          "numeric",

        timeZone:
          "UTC",
      },
    ).format(
      date,
    );

  return (
    label.charAt(
      0,
    ).toUpperCase() +
    label.slice(
      1,
    )
  );
}

function getSaoPauloDateKey(
  value:
    string,
): string {
  const date =
    new Date(
      value,
    );

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
      (
        part,
      ) =>
        part.type ===
        "year",
    )?.value;

  const month =
    parts.find(
      (
        part,
      ) =>
        part.type ===
        "month",
    )?.value;

  const day =
    parts.find(
      (
        part,
      ) =>
        part.type ===
        "day",
    )?.value;

  return `${year}-${month}-${day}`;
}

function getTaskDateKey(
  task:
    AgendaTask,
): string {
  return getSaoPauloDateKey(
    task.startsAt ??
    task.dueDate,
  );
}

function getDueDateKey(
  task:
    AgendaTask,
): string {
  return getSaoPauloDateKey(
    task.dueDate,
  );
}

function getTaskTime(
  task:
    AgendaTask,
): string | null {
  if (
    !task.startsAt
  ) {
    return null;
  }

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
        "America/Sao_Paulo",
    },
  ).format(
    new Date(
      task.startsAt,
    ),
  );
}

function getEffectiveStatus(
  task:
    AgendaTask,

  todayKey:
    string,
): TaskStatus {
  if (
    task.status ===
    "CONCLUIDA" ||
    task.status ===
    "CANCELADA"
  ) {
    return task.status;
  }

  if (
    getDueDateKey(
      task,
    ) <
    todayKey
  ) {
    return "ATRASADA";
  }

  return task.status;
}

function matchesStatus(
  task:
    AgendaTask,

  filter:
    StatusFilter,

  todayKey:
    string,
): boolean {
  if (
    filter ===
    "TODOS"
  ) {
    return (
      getEffectiveStatus(
        task,
        todayKey,
      ) !==
      "CANCELADA"
    );
  }

  return (
    getEffectiveStatus(
      task,
      todayKey,
    ) ===
    filter
  );
}

function getDayNumber(
  dateKey:
    string,
): number {
  return Number(
    dateKey.slice(
      8,
      10,
    ),
  );
}

function getLongDateLabel(
  dateKey:
    string,
): string {
  const [
    year,
    month,
    day,
  ] =
    dateKey
      .split("-")
      .map(
        Number,
      );

  const label =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        weekday:
          "long",

        day:
          "2-digit",

        month:
          "long",

        timeZone:
          "UTC",
      },
    ).format(
      new Date(
        Date.UTC(
          year,
          month -
          1,
          day,
          12,
        ),
      ),
    );

  return (
    label.charAt(
      0,
    ).toUpperCase() +
    label.slice(
      1,
    )
  );
}

export function AgendaMonth({
  data,
  showCompleted,
  defaultStatusFilter,
  itemsPerDay,
  showAttention,
  canCreateAgenda,
  canEditAgenda,
  canDeleteAgenda,
}: Props) {
  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>(
      "TODOS",
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      defaultStatusFilter as StatusFilter,
    );

  const [
    selectedTask,
    setSelectedTask,
  ] =
    useState<AgendaTask | null>(
      null,
    );

  const [
    taskDialogOpen,
    setTaskDialogOpen,
  ] =
    useState(
      false,
    );

  function openTask(
    task:
      AgendaTask,
  ) {
    setSelectedTask(
      task,
    );

    setTaskDialogOpen(
      true,
    );
  }

  function clearFilters() {
    setSearch(
      "",
    );

    setTypeFilter(
      "TODOS",
    );

    setStatusFilter(
      "TODOS",
    );
  }

  const gridDates =
    useMemo(
      () =>
        getMonthGridDates(
          data.monthKey,
        ),
      [
        data.monthKey,
      ],
    );

  const normalizedSearch =
    search
      .trim()
      .toLocaleLowerCase(
        "pt-BR",
      );

  const filteredTasks =
    useMemo(
      () =>
        data.tasks.filter(
          (
            task,
          ) => {
            if (
              !showCompleted &&
              task.status ===
                "CONCLUIDA"
            ) {
              return false;
            }

            if (
              typeFilter !==
              "TODOS" &&
              task.type !==
              typeFilter
            ) {
              return false;
            }

            if (
              !matchesStatus(
                task,
                statusFilter,
                data.todayKey,
              )
            ) {
              return false;
            }

            if (
              !normalizedSearch
            ) {
              return true;
            }

            return [
              task.title,
              task.description ??
              "",
              task.clientName ??
              "",
              task.caseTitle ??
              "",
              task.caseNumber ??
              "",
              task.location ??
              "",
            ]
              .join(
                " ",
              )
              .toLocaleLowerCase(
                "pt-BR",
              )
              .includes(
                normalizedSearch,
              );
          },
        ),
      [
        data.tasks,
        data.todayKey,
        normalizedSearch,
        showCompleted,
        statusFilter,
        typeFilter,
      ],
    );

  const tasksByDate =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            AgendaTask[]
          >();

        for (
          const task of
          filteredTasks
        ) {
          const dateKey =
            getTaskDateKey(
              task,
            );

          const existing =
            map.get(
              dateKey,
            );

          if (
            existing
          ) {
            existing.push(
              task,
            );
          } else {
            map.set(
              dateKey,
              [
                task,
              ],
            );
          }
        }

        return map;
      },
      [
        filteredTasks,
      ],
    );

  const selectedMonthTasks =
    data.tasks.filter(
      (
        task,
      ) =>
        getTaskDateKey(
          task,
        ).startsWith(
          data.monthKey,
        ),
    );

  const selectedMonthActiveTasks =
    selectedMonthTasks.filter(
      (
        task,
      ) =>
        task.status !==
        "CANCELADA",
    );

  const pendingCount =
    selectedMonthActiveTasks.filter(
      (
        task,
      ) => {
        const status =
          getEffectiveStatus(
            task,
            data.todayKey,
          );

        return (
          status ===
          "PENDENTE" ||
          status ===
          "EM_ANDAMENTO" ||
          status ===
          "ATRASADA"
        );
      },
    ).length;

  const deadlinesCount =
    selectedMonthActiveTasks.filter(
      (
        task,
      ) =>
        task.type ===
        "PRAZO_PROCESSUAL",
    ).length;

  const appointmentsCount =
    selectedMonthActiveTasks.filter(
      (
        task,
      ) =>
        task.type ===
        "AUDIENCIA" ||
        task.type ===
        "PERICIA" ||
        task.type ===
        "ATENDIMENTO",
    ).length;

  const completedCount =
    selectedMonthActiveTasks.filter(
      (
        task,
      ) =>
        task.status ===
        "CONCLUIDA",
    ).length;

  // Vem do servidor: o mês em exibição pode não incluir hoje.
  const todayTasks =
    data.todayTasks
      .filter(
        (task) =>
          showCompleted ||
          task.status !== "CONCLUIDA",
      )
      .sort(sortTasks);

  const overdueTasks =
    data.overdueTasks;

  const currentMonth =
    data.todayKey.slice(
      0,
      7,
    );

  const hasFilters =
    Boolean(
      search.trim() ||
      typeFilter !==
      "TODOS" ||
      statusFilter !==
      "TODOS",
    );

  return (
    <>
      <div className="space-y-6">
        {/* ==========================
            CABEÇALHO
        ========================== */}

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <CalendarDays className="size-6" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Organização do escritório
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Agenda
                </h1>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Centralize prazos, audiências,
                  perícias, atendimentos e demais
                  tarefas do escritório.
                </p>
              </div>
            </div>

            {canCreateAgenda ? (
              <div className="shrink-0">
                <CreateAgendaTaskDialog
                  clients={
                    data.clients
                  }
                  todayKey={
                    data.todayKey
                  }
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t bg-muted/10 px-5 py-3 text-xs text-muted-foreground sm:px-6">
            <span>
              Mês em exibição:{" "}
              <strong className="font-medium text-foreground">
                {
                  formatMonth(
                    data.monthKey,
                  )
                }
              </strong>
            </span>

            <span className="hidden sm:inline">
              •
            </span>

            <span>
              {
                selectedMonthActiveTasks.length
              }{" "}
              {selectedMonthActiveTasks.length ===
                1
                ? "item cadastrado"
                : "itens cadastrados"}
            </span>
          </div>
        </section>

        {/* ==========================
            INDICADORES
        ========================== */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Pendentes"
            value={
              pendingCount
            }
            description="Tarefas ainda abertas no mês"
            icon={
              <Clock3 className="size-5" />
            }
            tone="amber"
          />

          <SummaryCard
            title="Prazos"
            value={
              deadlinesCount
            }
            description="Prazos processuais no período"
            icon={
              <FileClock className="size-5" />
            }
            tone="rose"
          />

          <SummaryCard
            title="Compromissos"
            value={
              appointmentsCount
            }
            description="Audiências, perícias e atendimentos"
            icon={
              <UsersRound className="size-5" />
            }
            tone="blue"
          />

          <SummaryCard
            title="Concluídas"
            value={
              completedCount
            }
            description="Tarefas encerradas no mês"
            icon={
              <CheckCircle2 className="size-5" />
            }
            tone="emerald"
          />
        </section>

        {/* ==========================
            ATENÇÃO
        ========================== */}

        {showAttention &&
        (
          overdueTasks.length >
            0 ||
          todayTasks.length >
            0
        ) ? (
          <section className="grid gap-4 xl:grid-cols-2">
            <AttentionCard
              title="Atrasadas"
              description="Tarefas com vencimento anterior a hoje."
              icon={
                <AlertTriangle className="size-5" />
              }
              tasks={
                overdueTasks
              }
            totalCount={
              data.overdueCount
            }
              todayKey={
                data.todayKey
              }
              tone="danger"
              onTaskClick={
                openTask
              }
            />

            <AttentionCard
              title="Hoje"
              description={
                getLongDateLabel(
                  data.todayKey,
                )
              }
              icon={
                <CalendarDays className="size-5" />
              }
              tasks={
                todayTasks
              }
              todayKey={
                data.todayKey
              }
              tone="today"
              onTaskClick={
                openTask
              }
            />
          </section>
        ) : null}

        {/* ==========================
            CALENDÁRIO
        ========================== */}

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* NAVEGAÇÃO DO MÊS */}

          <div className="flex flex-col gap-4 border-b bg-muted/20 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/agenda?month=${shiftMonth(
                  data.monthKey,
                  -1,
                )}`}
                aria-label="Mês anterior"
                className="flex size-9 items-center justify-center rounded-xl border bg-background transition hover:bg-muted"
              >
                <ChevronLeft className="size-4" />
              </Link>

              <div className="min-w-44 px-2 text-center">
                <p className="font-semibold">
                  {
                    formatMonth(
                      data.monthKey,
                    )
                  }
                </p>
              </div>

              <Link
                href={`/agenda?month=${shiftMonth(
                  data.monthKey,
                  1,
                )}`}
                aria-label="Próximo mês"
                className="flex size-9 items-center justify-center rounded-xl border bg-background transition hover:bg-muted"
              >
                <ChevronRight className="size-4" />
              </Link>

              {data.monthKey !==
                currentMonth ? (
                <Link
                  href="/agenda"
                  className="ml-1 inline-flex h-9 items-center rounded-xl border bg-background px-3 text-sm font-medium transition hover:bg-muted"
                >
                  Hoje
                </Link>
              ) : null}
            </div>

            {/* LEGENDA */}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <Legend
                label="Prazo"
                className="bg-rose-500"
              />

              <Legend
                label="Audiência"
                className="bg-violet-500"
              />

              <Legend
                label="Perícia"
                className="bg-blue-500"
              />

              <Legend
                label="Atendimento"
                className="bg-cyan-500"
              />

              <Legend
                label="RPV"
                className="bg-violet-500"
              />

              <Legend
                label="Outras"
                className="bg-slate-400"
              />
            </div>
          </div>

          {/* ==========================
              FILTROS
          ========================== */}

          <div className="border-b px-4 py-4 sm:px-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Filter className="size-4" />
                </div>

                <div>
                  <p className="text-sm font-medium">
                    Filtrar agenda
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Refine os itens exibidos no calendário.
                  </p>
                </div>
              </div>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium transition hover:bg-muted"
                >
                  <RotateCcw className="size-3.5" />

                  Limpar filtros
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  type="search"
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Buscar tarefa, cliente, caso ou local..."
                  className="h-10 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <select
                value={
                  typeFilter
                }
                onChange={(
                  event,
                ) =>
                  setTypeFilter(
                    event.target
                      .value as TypeFilter,
                  )
                }
                className="h-10 rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="TODOS">
                  Todos os tipos
                </option>

                {Object.entries(
                  typeLabels,
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={
                        value
                      }
                      value={
                        value
                      }
                    >
                      {
                        label
                      }
                    </option>
                  ),
                )}
              </select>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event,
                ) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter,
                  )
                }
                className="h-10 rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="TODOS">
                  Todas as situações
                </option>

                <option value="PENDENTE">
                  Pendentes
                </option>

                <option value="EM_ANDAMENTO">
                  Em andamento
                </option>

                <option value="ATRASADA">
                  Atrasadas
                </option>

                <option value="CANCELADA">
                  Canceladas
                </option>
              </select>
            </div>

            {hasFilters ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Filter className="size-3.5" />

                <span>
                  {
                    filteredTasks.length
                  }{" "}
                  {filteredTasks.length ===
                    1
                    ? "item corresponde"
                    : "itens correspondem"}{" "}
                  aos filtros atuais.
                </span>
              </div>
            ) : null}
          </div>

          {/* ==========================
              GRADE
          ========================== */}

          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              {/* DIAS DA SEMANA */}

              <div className="grid grid-cols-7 border-b bg-muted/10">
                {weekDays.map(
                  (
                    day,
                  ) => (
                    <div
                      key={
                        day
                      }
                      className="border-r px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground last:border-r-0"
                    >
                      {
                        day
                      }
                    </div>
                  ),
                )}
              </div>

              {/* DIAS */}

              <div className="grid grid-cols-7">
                {gridDates.map(
                  (
                    dateKey,
                    index,
                  ) => {
                    const tasks =
                      (
                        tasksByDate.get(
                          dateKey,
                        ) ??
                        []
                      ).sort(
                        sortTasks,
                      );

                    const isSelectedMonth =
                      dateKey.startsWith(
                        data.monthKey,
                      );

                    const isToday =
                      dateKey ===
                      data.todayKey;

                    return (
                      <CalendarDay
                        key={
                          dateKey
                        }
                        dayNumber={
                          getDayNumber(
                            dateKey,
                          )
                        }
                        tasks={
                          tasks
                        }
                        todayKey={
                          data.todayKey
                        }
                        isSelectedMonth={
                          isSelectedMonth
                        }
                        isToday={
                          isToday
                        }
                        isLastColumn={
                          (
                            index +
                            1
                          ) %
                          7 ===
                          0
                        }
                        itemsPerDay={
                          itemsPerDay
                        }
                        onTaskClick={
                          openTask
                        }
                      />
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <AgendaTaskDetailsDialog
        task={
          selectedTask
        }
        clients={
          data.clients
        }
        open={
          taskDialogOpen
        }
        onOpenChange={
          setTaskDialogOpen
        }
        canEditAgenda={
          canEditAgenda
        }
        canDeleteAgenda={
          canDeleteAgenda
        }
      />
    </>
  );
}

function CalendarDay({
  dayNumber,
  tasks,
  todayKey,
  isSelectedMonth,
  isToday,
  isLastColumn,
  itemsPerDay,
  onTaskClick,
}: {
  dayNumber:
  number;

  tasks:
  AgendaTask[];

  todayKey:
  string;

  isSelectedMonth:
  boolean;

  isToday:
  boolean;

  isLastColumn:
    boolean;

  itemsPerDay:
    number;

  onTaskClick:
  (
    task:
      AgendaTask,
  ) => void;
}) {
  return (
    <div
      className={`min-h-40 border-b p-2.5 ${isLastColumn
          ? ""
          : "border-r"
        } ${isSelectedMonth
          ? isToday
            ? "bg-blue-50/20 dark:bg-blue-950/10"
            : "bg-card"
          : "bg-muted/20"
        }`}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span
          className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${isToday
              ? "bg-primary text-primary-foreground shadow-sm"
              : isSelectedMonth
                ? "text-foreground"
                : "text-muted-foreground/60"
            }`}
        >
          {
            dayNumber
          }
        </span>

        {tasks.length >
          0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {
              tasks.length
            }
          </span>
        ) : null}
      </div>

      <div className="space-y-1.5">
        {tasks
          .slice(
            0,
            itemsPerDay,
          )
          .map(
            (
              task,
            ) => (
              <CalendarTask
                key={
                  task.id
                }
                task={
                  task
                }
                todayKey={
                  todayKey
                }
                onClick={() =>
                  onTaskClick(
                    task,
                  )
                }
              />
            ),
          )}

        {tasks.length >
          itemsPerDay ? (
          <p className="px-1 pt-0.5 text-[11px] font-medium text-muted-foreground">
            +{" "}
            {
              tasks.length -
              itemsPerDay
            }{" "}
            compromissos
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CalendarTask({
  task,
  todayKey,
  onClick,
}: {
  task:
  AgendaTask;

  todayKey:
  string;

  onClick:
  () => void;
}) {
  const styles =
    getTaskStyle(
      task.type,
    );

  const status =
    getEffectiveStatus(
      task,
      todayKey,
    );

  const time =
    getTaskTime(
      task,
    );

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      title={[
        task.title,
        task.clientName,
        task.location,
      ]
        .filter(
          Boolean,
        )
        .join(
          " • ",
        )}
      className={`relative block w-full overflow-hidden rounded-lg border px-2 py-1.5 text-left text-[11px] shadow-sm transition hover:-translate-y-px hover:shadow ${styles.container
        } ${status ===
          "CONCLUIDA" ||
          status ===
          "CANCELADA"
          ? "opacity-60"
          : ""
        }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-0.5 ${styles.accent}`}
      />

      <div className="pl-1">
        <div className="flex items-center gap-1">
          {time ? (
            <span className="shrink-0 font-semibold">
              {
                time
              }
            </span>
          ) : null}

          <p
            className={`truncate font-semibold ${status ===
                "CONCLUIDA" ||
                status ===
                "CANCELADA"
                ? "line-through"
                : ""
              }`}
          >
            {
              task.title
            }
          </p>
        </div>

        {task.clientName ? (
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {
              task.clientName
            }
          </p>
        ) : null}

        {status ===
          "ATRASADA" ? (
          <p className="mt-0.5 font-semibold text-rose-700 dark:text-rose-300">
            Atrasada
          </p>
        ) : null}

        {status ===
          "CANCELADA" ? (
          <p className="mt-0.5 font-semibold text-muted-foreground">
            Cancelada
          </p>
        ) : null}
      </div>
    </button>
  );
}

function AttentionCard({
  title,
  description,
  icon,
  tasks,
  totalCount,
  todayKey,
  tone,
  onTaskClick,
}: {
  title:
  string;

  description:
  string;

  icon:
  ReactNode;

  tasks:
  AgendaTask[];

  totalCount?:
  number;

  todayKey:
  string;

  tone:
  | "danger"
  | "today";

  onTaskClick:
  (
    task:
      AgendaTask,
  ) => void;
}) {
  const danger =
    tone ===
    "danger";

  // A lista mostra até 5; o total pode vir maior que a lista recebida.
  const count =
    totalCount ?? tasks.length;

  const hiddenCount =
    count - Math.min(tasks.length, 5);

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-card shadow-sm ${danger
          ? "border-rose-200 dark:border-rose-900"
          : "border-blue-200 dark:border-blue-900"
        }`}
    >
      <div
        className={`border-b px-5 py-4 ${danger
            ? "border-rose-100 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/10"
            : "border-blue-100 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/10"
          }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${danger
                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
              }`}
          >
            {
              icon
            }
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">
                {
                  title
                }
              </h3>

              <span
                className={`inline-flex min-w-6 items-center justify-center rounded-full border bg-background px-2 py-0.5 text-xs font-medium ${danger
                    ? "border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300"
                    : "border-blue-200 text-blue-700 dark:border-blue-900 dark:text-blue-300"
                  }`}
              >
                {count}
              </span>
            </div>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {
                description
              }
            </p>
          </div>
        </div>
      </div>

      {tasks.length ===
        0 ? (
        <div className="px-5 py-6 text-sm text-muted-foreground">
          Nenhum item.
        </div>
      ) : (
        <div className="divide-y">
          {tasks
            .slice(
              0,
              5,
            )
            .map(
              (
                task,
              ) => (
                <AttentionTask
                  key={
                    task.id
                  }
                  task={
                    task
                  }
                  todayKey={
                    todayKey
                  }
                  onClick={() =>
                    onTaskClick(
                      task,
                    )
                  }
                />
              ),
            )}
        </div>
      )}

      {hiddenCount > 0 ? (
        <div className="border-t bg-muted/10 px-5 py-3 text-xs text-muted-foreground">
          Mais{" "}
          {
            hiddenCount
          }{" "}
          {hiddenCount ===
            1
            ? "item"
            : "itens"}{" "}
          nesta categoria.
        </div>
      ) : null}
    </div>
  );
}

function AttentionTask({
  task,
  todayKey,
  onClick,
}: {
  task:
  AgendaTask;

  todayKey:
  string;

  onClick:
  () => void;
}) {
  const time =
    getTaskTime(
      task,
    );

  const status =
    getEffectiveStatus(
      task,
      todayKey,
    );

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-muted/30"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-words font-medium">
            {
              task.title
            }
          </p>

          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {
              typeLabels[
              task.type
              ]
            }
          </span>
        </div>

        {(
          task.clientName ||
          task.caseTitle
        ) ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {
              task.clientName
            }

            {task.caseTitle
              ? ` • ${task.caseTitle}`
              : ""}
          </p>
        ) : null}

        {task.location ? (
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />

            {
              task.location
            }
          </p>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        {time ? (
          <p className="font-semibold">
            {
              time
            }
          </p>
        ) : null}

        {status ===
          "ATRASADA" ? (
          <p className="mt-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {
              getDueDateKey(
                task,
              )
                .split(
                  "-",
                )
                .reverse()
                .join(
                  "/",
                )
            }
          </p>
        ) : null}
      </div>
    </button>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title:
  string;

  value:
  number;

  description:
  string;

  icon:
  ReactNode;

  tone:
  | "amber"
  | "rose"
  | "blue"
  | "emerald";
}) {
  const styles = {
    amber: {
      container:
        "border-amber-200 bg-amber-50/20 dark:border-amber-900 dark:bg-amber-950/10",

      accent:
        "bg-amber-400 dark:bg-amber-700",

      text:
        "text-amber-900 dark:text-amber-200",

      icon:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    },

    rose: {
      container:
        "border-rose-200 bg-rose-50/20 dark:border-rose-900 dark:bg-rose-950/10",

      accent:
        "bg-rose-500 dark:bg-rose-700",

      text:
        "text-rose-900 dark:text-rose-200",

      icon:
        "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    },

    blue: {
      container:
        "border-blue-200 bg-blue-50/20 dark:border-blue-900 dark:bg-blue-950/10",

      accent:
        "bg-blue-400 dark:bg-blue-700",

      text:
        "text-blue-900 dark:text-blue-200",

      icon:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    },

    emerald: {
      container:
        "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900 dark:bg-emerald-950/10",

      accent:
        "bg-emerald-400 dark:bg-emerald-700",

      text:
        "text-emerald-900 dark:text-emerald-200",

      icon:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
  }[
    tone
  ];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles.container}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {
              title
            }
          </p>

          <p
            className={`mt-2 text-3xl font-bold tracking-tight ${styles.text}`}
          >
            {
              value
            }
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {
              description
            }
          </p>
        </div>

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          {
            icon
          }
        </div>
      </div>
    </div>
  );
}

function Legend({
  label,
  className,
}: {
  label:
  string;

  className:
  string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`size-2 rounded-full ${className}`}
      />

      {
        label
      }
    </span>
  );
}

function sortTasks(
  first:
    AgendaTask,

  second:
    AgendaTask,
): number {
  if (
    first.startsAt &&
    second.startsAt
  ) {
    return (
      new Date(
        first.startsAt,
      ).getTime() -
      new Date(
        second.startsAt,
      ).getTime()
    );
  }

  if (
    first.startsAt
  ) {
    return -1;
  }

  if (
    second.startsAt
  ) {
    return 1;
  }

  return first.title.localeCompare(
    second.title,
    "pt-BR",
  );
}

function getTaskStyle(
  type:
    TaskType,
) {
  switch (
  type
  ) {
    case "PRAZO_PROCESSUAL":
      return {
        container:
          "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20",

        accent:
          "bg-rose-500",
      };

    case "AUDIENCIA":
      return {
        container:
          "border-violet-200 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/20",

        accent:
          "bg-violet-500",
      };

    case "PERICIA":
      return {
        container:
          "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20",

        accent:
          "bg-blue-500",
      };

    case "ATENDIMENTO":
      return {
        container:
          "border-cyan-200 bg-cyan-50/70 dark:border-cyan-900 dark:bg-cyan-950/20",

        accent:
          "bg-cyan-500",
      };

    case "PRORROGACAO_BENEFICIO":
      return {
        container:
          "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20",

        accent:
          "bg-amber-500",
      };

    case "DOCUMENTO_PENDENTE":
      return {
        container:
          "border-orange-200 bg-orange-50/70 dark:border-orange-900 dark:bg-orange-950/20",

        accent:
          "bg-orange-500",
      };

    case "CONTATO_CLIENTE":
      return {
        container:
          "border-sky-200 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/20",

        accent:
          "bg-sky-500",
      };

    case "RPV":
      return {
        container:
          "border-violet-200 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/20",

        accent:
          "bg-violet-500",
      };

    default:
      return {
        container:
          "border-border bg-muted/30",

        accent:
          "bg-slate-400",
      };
  }
}