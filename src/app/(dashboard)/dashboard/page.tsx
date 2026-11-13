import Link from "next/link";

import type {
  ReactNode,
} from "react";

import {
  CalendarClock,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  ListTodo,
  ReceiptText,
  TriangleAlert,
  WalletCards,
} from "lucide-react";

import {
  FinancialStatus,
  RpvStatus,
  TaskStatus,
  WorkItemStatus,
  WorkPlanningPeriod,
} from "@prisma/client";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  prisma,
} from "@/lib/prisma";

import {
  getCurrentWorkspaceAccess,
  hasPermission,
} from "@/lib/permissions";

const TIME_ZONE =
  "America/Sao_Paulo";

const DAY_IN_MS =
  24 * 60 * 60 * 1000;

function getSaoPauloDateKey(
  date = new Date(),
) {
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
      date,
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

function shiftDateKey(
  dateKey: string,
  amount: number,
) {
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
  ].join("-");
}

function localDateStart(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T00:00:00-03:00`,
  );
}

function getCalendarDayValue(
  dateKey: string,
) {
  const [
    year,
    month,
    day,
  ] =
    dateKey
      .split("-")
      .map(Number);

  return Date.UTC(
    year,
    month - 1,
    day,
  );
}

function getDayDifference(
  dateKey: string,
  todayKey: string,
) {
  return Math.round(
    (
      getCalendarDayValue(
        dateKey,
      ) -
      getCalendarDayValue(
        todayKey,
      )
    ) /
    DAY_IN_MS,
  );
}

function getFirstName(
  name: string,
) {
  return (
    name
      .trim()
      .split(/\s+/)[0] ||
    name
  );
}

function getGreeting() {
  const hourPart =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          TIME_ZONE,

        hour:
          "2-digit",

        hourCycle:
          "h23",
      },
    )
      .formatToParts(
        new Date(),
      )
      .find(
        (part) =>
          part.type ===
          "hour",
      )
      ?.value;

  const hour =
    Number(
      hourPart ??
      "12",
    );

  if (hour < 12) {
    return "Bom dia";
  }

  if (hour < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}

function getCurrentDateLabel() {
  const label =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone:
          TIME_ZONE,

        weekday:
          "long",

        day:
          "2-digit",

        month:
          "long",

        year:
          "numeric",
      },
    ).format(
      new Date(),
    );

  return (
    label.charAt(0).toUpperCase() +
    label.slice(1)
  );
}

function formatMoney(
  value: number,
) {
  return value.toLocaleString(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    },
  );
}

function formatTime(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        TIME_ZONE,

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,
    },
  ).format(
    value,
  );
}

function formatShortDate(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        TIME_ZONE,

      day:
        "2-digit",

      month:
        "2-digit",
    },
  ).format(
    value,
  );
}

function getDeadlineInfo(
  dueDate: Date | null,
  todayKey: string,
) {
  if (!dueDate) {
    return {
      label:
        "Sem prazo formal",

      className:
        "text-muted-foreground",
    };
  }

  const dueDateKey =
    getSaoPauloDateKey(
      dueDate,
    );

  const difference =
    getDayDifference(
      dueDateKey,
      todayKey,
    );

  if (difference < 0) {
    const days =
      Math.abs(
        difference,
      );

    return {
      label:
        `Atrasado há ${days} ${days === 1
          ? "dia"
          : "dias"
        }`,

      className:
        "font-medium text-destructive",
    };
  }

  if (difference === 0) {
    return {
      label:
        "Vence hoje",

      className:
        "font-medium text-destructive",
    };
  }

  if (difference === 1) {
    return {
      label:
        "Vence amanhã",

      className:
        "font-medium text-amber-700 dark:text-amber-300",
    };
  }

  return {
    label:
      `Vence em ${difference} dias`,

    className:
      difference <= 7
        ? "font-medium text-amber-700 dark:text-amber-300"
        : "text-muted-foreground",
  };
}

function getAgendaDateLabel(
  task: {
    startsAt:
    Date | null;

    dueDate:
    Date;
  },
  todayKey: string,
) {
  const date =
    task.startsAt ??
    task.dueDate;

  const dateKey =
    getSaoPauloDateKey(
      date,
    );

  const difference =
    getDayDifference(
      dateKey,
      todayKey,
    );

  const dayLabel =
    difference === 0
      ? "Hoje"
      : difference === 1
        ? "Amanhã"
        : formatShortDate(
          date,
        );

  if (task.startsAt) {
    return `${dayLabel}, ${formatTime(
      task.startsAt,
    )}`;
  }

  return dayLabel;
}

function getWorkPeriodRank(
  period: WorkPlanningPeriod,
) {
  switch (period) {
    case WorkPlanningPeriod.ESTA_SEMANA:
      return 0;

    case WorkPlanningPeriod.ESTE_MES:
      return 1;

    case WorkPlanningPeriod.DEPOIS:
      return 2;
  }
}

export default async function DashboardPage() {
  const {
    user,
    workspace,
    membership,
  } =
    await getCurrentWorkspaceAccess();

  const canViewAgenda =
    hasPermission(
      membership.role,
      "AGENDA_VIEW",
    );

  const canViewWork =
    hasPermission(
      membership.role,
      "WORK_VIEW",
    );

  const canViewFinance =
    hasPermission(
      membership.role,
      "FINANCE_VIEW",
    );

  const todayKey =
    getSaoPauloDateKey();

  const tomorrowKey =
    shiftDateKey(
      todayKey,
      1,
    );

  const eightDaysKey =
    shiftDateKey(
      todayKey,
      8,
    );

  const todayStart =
    localDateStart(
      todayKey,
    );

  const tomorrowStart =
    localDateStart(
      tomorrowKey,
    );

  const eightDaysStart =
    localDateStart(
      eightDaysKey,
    );

  const [
    overdueAgendaCount,
    todayAgendaCount,
    upcomingAgenda,
    workItemsResult,
    openReceivables,
    openPayables,
    activeRpvsCount,
  ] =
    await Promise.all([
      canViewAgenda
        ? prisma.task.count({
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
        })
        : Promise.resolve(
          0,
        ),

      canViewAgenda
        ? prisma.task.count({
          where: {
            workspaceId:
              workspace.id,

            status: {
              notIn: [
                TaskStatus.CONCLUIDA,
                TaskStatus.CANCELADA,
              ],
            },

            OR: [
              {
                startsAt: {
                  gte:
                    todayStart,

                  lt:
                    tomorrowStart,
                },
              },

              {
                startsAt:
                  null,

                dueDate: {
                  gte:
                    todayStart,

                  lt:
                    tomorrowStart,
                },
              },
            ],
          },
        })
        : Promise.resolve(
          0,
        ),

      canViewAgenda
        ? prisma.task.findMany({
          where: {
            workspaceId:
              workspace.id,

            status: {
              notIn: [
                TaskStatus.CONCLUIDA,
                TaskStatus.CANCELADA,
              ],
            },

            OR: [
              {
                startsAt: {
                  gte:
                    todayStart,

                  lt:
                    eightDaysStart,
                },
              },

              {
                startsAt:
                  null,

                dueDate: {
                  gte:
                    todayStart,

                  lt:
                    eightDaysStart,
                },
              },
            ],
          },

          select: {
            id:
              true,

            clientId:
              true,

            caseId:
              true,

            title:
              true,

            startsAt:
              true,

            dueDate:
              true,

            client: {
              select: {
                id:
                  true,

                name:
                  true,
              },
            },

            case: {
              select: {
                id:
                  true,

                title:
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

          take:
            6,
        })
        : Promise.resolve(
          [],
        ),

      canViewWork
        ? prisma.workItem.findMany({
          where: {
            workspaceId:
              workspace.id,

            assignedToMembershipId:
              membership.id,

            status: {
              not:
                WorkItemStatus.CONCLUIDA,
            },
          },

          select: {
            id:
              true,

            title:
              true,

            status:
              true,

            period:
              true,

            position:
              true,

            dueDate:
              true,

            createdAt:
              true,

            client: {
              select: {
                id:
                  true,

                name:
                  true,
              },
            },

            case: {
              select: {
                id:
                  true,

                title:
                  true,
              },
            },
          },

          orderBy: [
            {
              position:
                "asc",
            },

            {
              createdAt:
                "asc",
            },
          ],
        })
        : Promise.resolve(
          [],
        ),

      canViewFinance
        ? prisma.receivable.findMany({
          where: {
            workspaceId:
              workspace.id,

            status: {
              notIn: [
                FinancialStatus.PAGO,
                FinancialStatus.CANCELADO,
              ],
            },
          },

          select: {
            totalAmount:
              true,

            paidAmount:
              true,
          },
        })
        : Promise.resolve(
          [],
        ),

      canViewFinance
        ? prisma.payable.findMany({
          where: {
            workspaceId:
              workspace.id,

            status: {
              notIn: [
                FinancialStatus.PAGO,
                FinancialStatus.CANCELADO,
              ],
            },
          },

          select: {
            amount:
              true,
          },
        })
        : Promise.resolve(
          [],
        ),

      canViewFinance
        ? prisma.rpv.count({
          where: {
            workspaceId:
              workspace.id,

            status: {
              notIn: [
                RpvStatus.PAGA,
                RpvStatus.CANCELADA,
              ],
            },
          },
        })
        : Promise.resolve(
          0,
        ),
    ]);

  const workItems =
    [...workItemsResult]
      .sort(
        (
          first,
          second,
        ) => {
          const periodDifference =
            getWorkPeriodRank(
              first.period,
            ) -
            getWorkPeriodRank(
              second.period,
            );

          if (
            periodDifference !==
            0
          ) {
            return periodDifference;
          }

          if (
            first.position !==
            second.position
          ) {
            return (
              first.position -
              second.position
            );
          }

          return (
            first.createdAt.getTime() -
            second.createdAt.getTime()
          );
        },
      );

  const topWorkItems =
    workItems.slice(
      0,
      5,
    );

  const totalToReceive =
    openReceivables.reduce(
      (
        total,
        receivable,
      ) =>
        total +
        Math.max(
          Number(
            receivable.totalAmount,
          ) -
          Number(
            receivable.paidAmount,
          ),
          0,
        ),
      0,
    );

  const totalToPay =
    openPayables.reduce(
      (
        total,
        payable,
      ) =>
        total +
        Number(
          payable.amount,
        ),
      0,
    );

  const firstName =
    getFirstName(
      user.name,
    );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ==========================
            CABEÇALHO
        ========================== */}

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <LayoutDashboard className="size-6" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {workspace.name}
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {getGreeting()},{" "}
                  {firstName}.
                </h1>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {getCurrentDateLabel()}
                </p>
              </div>
            </div>

            <p className="max-w-md text-sm leading-6 text-muted-foreground lg:text-right">
              O que exige sua atenção e quais são
              as próximas prioridades do
              escritório.
            </p>
          </div>
        </section>

        {/* ==========================
            ATENÇÃO
        ========================== */}

        {(canViewAgenda ||
          canViewWork) ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">
                Atenção
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Situação operacional neste momento.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {canViewAgenda ? (
                <SummaryCard
                  title="Atrasados"
                  value={
                    overdueAgendaCount
                  }
                  description={
                    overdueAgendaCount ===
                      1
                      ? "1 compromisso ou prazo exige atenção"
                      : `${overdueAgendaCount} compromissos ou prazos exigem atenção`
                  }
                  icon={
                    <TriangleAlert className="size-5" />
                  }
                  tone={
                    overdueAgendaCount >
                      0
                      ? "danger"
                      : "neutral"
                  }
                  href="/agenda"
                />
              ) : null}

              {canViewAgenda ? (
                <SummaryCard
                  title="Hoje"
                  value={
                    todayAgendaCount
                  }
                  description={
                    todayAgendaCount ===
                      1
                      ? "1 item previsto para hoje"
                      : `${todayAgendaCount} itens previstos para hoje`
                  }
                  icon={
                    <CalendarDays className="size-5" />
                  }
                  tone="blue"
                  href="/agenda"
                />
              ) : null}

              {canViewWork ? (
                <SummaryCard
                  title="Minha fila"
                  value={
                    workItems.length
                  }
                  description={
                    workItems.length ===
                      1
                      ? "1 trabalho pendente"
                      : `${workItems.length} trabalhos pendentes`
                  }
                  icon={
                    <ListTodo className="size-5" />
                  }
                  tone="violet"
                  href="/trabalho"
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ==========================
            TRABALHO + AGENDA
        ========================== */}

        {(canViewWork ||
          canViewAgenda) ? (
          <section className="grid gap-6 xl:grid-cols-2">
            {canViewWork ? (
              <DashboardSection
                title="Meu trabalho"
                description="Suas primeiras prioridades na fila."
                icon={
                  <ListTodo className="size-5" />
                }
                href="/trabalho"
                linkLabel="Ver minha fila"
                tone="violet"
              >
                {topWorkItems.length ===
                  0 ? (
                  <EmptyState>
                    Sua fila de trabalho está
                    vazia.
                  </EmptyState>
                ) : (
                  <div className="divide-y">
                    {topWorkItems.map(
                      (
                        item,
                        index,
                      ) => {
                        const deadline =
                          getDeadlineInfo(
                            item.dueDate,
                            todayKey,
                          );

                        const href =
                          item.case &&
                            item.client
                            ? `/clientes/${item.client.id}/casos/${item.case.id}`
                            : item.client
                              ? `/clientes/${item.client.id}`
                              : "/trabalho";

                        return (
                          <Link
                            key={
                              item.id
                            }
                            href={
                              href
                            }
                            className="flex items-start gap-3 px-4 py-4 transition hover:bg-muted/30 sm:px-5"
                          >
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                              {index +
                                1}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="font-semibold">
                                  {item.client
                                    ?.name ??
                                    item.title}
                                </p>

                                {item.status ===
                                  WorkItemStatus.EM_ANDAMENTO ? (
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                    Em andamento
                                  </span>
                                ) : null}
                              </div>

                              {item.client ? (
                                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                  {
                                    item.title
                                  }
                                </p>
                              ) : null}

                              {item.case ? (
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {
                                    item.case
                                      .title
                                  }
                                </p>
                              ) : null}

                              <p
                                className={`mt-2 text-xs ${deadline.className}`}
                              >
                                {
                                  deadline.label
                                }
                              </p>
                            </div>

                            <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                          </Link>
                        );
                      },
                    )}
                  </div>
                )}
              </DashboardSection>
            ) : null}

            {canViewAgenda ? (
              <DashboardSection
                title="Próximos compromissos"
                description="Agenda dos próximos sete dias."
                icon={
                  <CalendarClock className="size-5" />
                }
                href="/agenda"
                linkLabel="Ver agenda"
                tone="blue"
              >
                {upcomingAgenda.length ===
                  0 ? (
                  <EmptyState>
                    Nenhum compromisso ou prazo
                    nos próximos sete dias.
                  </EmptyState>
                ) : (
                  <div className="divide-y">
                    {upcomingAgenda.map(
                      (task) => {
                        const href =
                          task.caseId &&
                            task.clientId
                            ? `/clientes/${task.clientId}/casos/${task.caseId}`
                            : task.clientId
                              ? `/clientes/${task.clientId}`
                              : "/agenda";

                        return (
                          <Link
                            key={
                              task.id
                            }
                            href={
                              href
                            }
                            className="flex items-start gap-3 px-4 py-4 transition hover:bg-muted/30 sm:px-5"
                          >
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                              {task.startsAt ? (
                                <Clock3 className="size-4" />
                              ) : (
                                <CalendarDays className="size-4" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">
                                {
                                  task.title
                                }
                              </p>

                              {task.client ? (
                                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                  {
                                    task.client
                                      .name
                                  }

                                  {task.case
                                    ? ` · ${task.case.title}`
                                    : ""}
                                </p>
                              ) : null}

                              <p className="mt-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                                {getAgendaDateLabel(
                                  task,
                                  todayKey,
                                )}
                              </p>
                            </div>

                            <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                          </Link>
                        );
                      },
                    )}
                  </div>
                )}
              </DashboardSection>
            ) : null}
          </section>
        ) : null}

        {/* ==========================
            FINANCEIRO
        ========================== */}

        {canViewFinance ? (
          <DashboardSection
            title="Financeiro"
            description="Resumo dos valores ainda em aberto."
            icon={
              <CircleDollarSign className="size-5" />
            }
            href="/financeiro"
            linkLabel="Ver financeiro"
            tone="emerald"
          >
            <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
              <FinancialCard
                title="A receber"
                value={formatMoney(
                  totalToReceive,
                )}
                description={
                  openReceivables.length ===
                    1
                    ? "1 cobrança em aberto"
                    : `${openReceivables.length} cobranças em aberto`
                }
                icon={
                  <WalletCards className="size-4" />
                }
                tone="income"
              />

              <FinancialCard
                title="A pagar"
                value={formatMoney(
                  totalToPay,
                )}
                description={
                  openPayables.length ===
                    1
                    ? "1 conta em aberto"
                    : `${openPayables.length} contas em aberto`
                }
                icon={
                  <ReceiptText className="size-4" />
                }
                tone="expense"
              />

              <FinancialCard
                title="RPVs e precatórios"
                value={String(
                  activeRpvsCount,
                )}
                description={
                  activeRpvsCount ===
                    1
                    ? "1 requisição em andamento"
                    : `${activeRpvsCount} requisições em andamento`
                }
                icon={
                  <CircleDollarSign className="size-4" />
                }
                tone="rpv"
              />
            </div>
          </DashboardSection>
        ) : null}
      </div>
    </AppShell>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  tone,
  href,
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
  | "danger"
  | "blue"
  | "violet"
  | "neutral";

  href:
  string;
}) {
  const styles = {
    danger: {
      border:
        "border-red-200 dark:border-red-900",

      icon:
        "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",

      value:
        "text-red-700 dark:text-red-300",
    },

    blue: {
      border:
        "border-blue-200 dark:border-blue-900",

      icon:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",

      value:
        "text-blue-700 dark:text-blue-300",
    },

    violet: {
      border:
        "border-violet-200 dark:border-violet-900",

      icon:
        "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",

      value:
        "text-violet-700 dark:text-violet-300",
    },

    neutral: {
      border:
        "border-border",

      icon:
        "bg-muted text-muted-foreground",

      value:
        "text-foreground",
    },
  }[tone];

  return (
    <Link
      href={
        href
      }
      className={`rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${styles.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <p
            className={`mt-2 text-3xl font-bold tracking-tight ${styles.value}`}
          >
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          {icon}
        </div>
      </div>
    </Link>
  );
}

function DashboardSection({
  title,
  description,
  icon,
  href,
  linkLabel,
  tone,
  children,
}: {
  title:
  string;

  description:
  string;

  icon:
  ReactNode;

  href:
  string;

  linkLabel:
  string;

  tone:
  | "blue"
  | "violet"
  | "emerald";

  children:
  ReactNode;
}) {
  const styles = {
    blue: {
      header:
        "bg-blue-50/40 dark:bg-blue-950/10",

      icon:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    },

    violet: {
      header:
        "bg-violet-50/40 dark:bg-violet-950/10",

      icon:
        "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    },

    emerald: {
      header:
        "bg-emerald-50/40 dark:bg-emerald-950/10",

      icon:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
  }[tone];

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div
        className={`flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${styles.header}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
          >
            {icon}
          </div>

          <div>
            <h2 className="font-semibold">
              {title}
            </h2>

            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <Link
          href={
            href
          }
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          {linkLabel}

          <ChevronRight className="size-4" />
        </Link>
      </div>

      {children}
    </section>
  );
}

function FinancialCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title:
  string;

  value:
  string;

  description:
  string;

  icon:
  ReactNode;

  tone:
  | "income"
  | "expense"
  | "rpv";
}) {
  const styles = {
    income:
      "bg-emerald-50/60 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300",

    expense:
      "bg-rose-50/60 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300",

    rpv:
      "bg-violet-50/60 text-violet-700 dark:bg-violet-950/20 dark:text-violet-300",
  }[tone];

  return (
    <div className="rounded-2xl border bg-background p-4">
      <div
        className={`flex size-9 items-center justify-center rounded-xl ${styles}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs font-medium text-muted-foreground">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  children,
}: {
  children:
  ReactNode;
}) {
  return (
    <div className="px-5 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}