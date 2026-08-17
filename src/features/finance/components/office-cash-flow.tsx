"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import type {
  ReactNode,
} from "react";

import {
  AlertTriangle,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUp,
  ArrowUpFromLine,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Equal,
  ReceiptText,
  Search,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react";

import {
  getEffectiveFinancialStatus,
  toDateInputValue,
} from "../lib/receivable-display";

import type {
  OfficeFinancialData,
  OfficePayable,
} from "../types/office-financial";

type Props = {
  data:
    OfficeFinancialData;
};

type MovementKind =
  | "INCOME"
  | "EXPENSE";

type MovementState =
  | "REALIZED"
  | "PROJECTED";

type MovementFilter =
  | "TODOS"
  | "REALIZADOS"
  | "PREVISTOS";

type CashFlowMovement = {
  id: string;

  kind:
    MovementKind;

  state:
    MovementState;

  dateKey: string;

  title: string;

  subtitle: string;

  amount: number;

  href:
    string | null;
};

type SummaryTone =
  | "income"
  | "expense"
  | "positive"
  | "negative"
  | "projection";

type MonthlyRealizedSummary = {
  monthKey: string;

  income: number;

  expense: number;

  result: number;
};

type ComparisonDirection =
  | "UP"
  | "DOWN"
  | "EQUAL";

const payableCategoryLabels: Record<
  OfficePayable["category"],
  string
> = {
  ALUGUEL:
    "Aluguel",

  SALARIO:
    "Salário",

  IMPOSTO:
    "Imposto",

  SOFTWARE:
    "Software",

  MARKETING:
    "Marketing",

  MATERIAL_ESCRITORIO:
    "Material de escritório",

  CUSTAS:
    "Custas",

  OUTRO:
    "Outro",
};

function formatMoney(
  value: number,
): string {
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

function formatSignedMoney(
  value: number,
): string {
  const formatted =
    formatMoney(
      Math.abs(
        value,
      ),
    );

  if (
    value > 0
  ) {
    return `+ ${formatted}`;
  }

  if (
    value < 0
  ) {
    return `- ${formatted}`;
  }

  return formatted;
}

function shiftMonth(
  monthKey: string,
  amount: number,
): string {
  const [
    year,
    month,
  ] =
    monthKey
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1 +
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
  ].join("-");
}

function formatMonth(
  monthKey: string,
): string {
  const [
    year,
    month,
  ] =
    monthKey
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
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
    label.slice(1)
  );
}

function formatShortMonth(
  monthKey: string,
): string {
  const [
    year,
    month,
  ] =
    monthKey
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
        12,
      ),
    );

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      month:
        "short",

      timeZone:
        "UTC",
    },
  )
    .format(date)
    .replace(".", "");
}

function formatDateKey(
  value: string,
): string {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-");

  return `${day}/${month}/${year}`;
}

function getReceivableSubtitle(
  receivable:
    OfficeFinancialData["receivables"][number],
): string {
  const process =
    receivable.caseNumber ??
    receivable.caseTitle;

  if (process) {
    return `${receivable.clientName} • ${process}`;
  }

  return receivable.clientName;
}

function matchesMovementFilter(
  movement:
    CashFlowMovement,

  filter:
    MovementFilter,
): boolean {
  if (
    filter === "TODOS"
  ) {
    return true;
  }

  if (
    filter ===
    "REALIZADOS"
  ) {
    return (
      movement.state ===
      "REALIZED"
    );
  }

  return (
    movement.state ===
    "PROJECTED"
  );
}

function getComparisonDirection(
  current: number,
  previous: number,
): ComparisonDirection {
  if (
    current > previous
  ) {
    return "UP";
  }

  if (
    current < previous
  ) {
    return "DOWN";
  }

  return "EQUAL";
}

function getPercentageChange(
  current: number,
  previous: number,
): number | null {
  if (
    previous === 0
  ) {
    return null;
  }

  return (
    ((current -
      previous) /
      Math.abs(previous)) *
    100
  );
}

function getMonthlyRealizedSummary({
  data,
  monthKey,
}: {
  data:
    OfficeFinancialData;

  monthKey: string;
}): MonthlyRealizedSummary {
  let income = 0;
  let expense = 0;

  for (
    const receivable of
    data.receivables
  ) {
    if (
      receivable.status ===
      "CANCELADO"
    ) {
      continue;
    }

    const receivedAt =
      toDateInputValue(
        receivable.receivedAt,
      );

    if (
      receivable.paidAmount >
        0 &&
      receivedAt.startsWith(
        monthKey,
      )
    ) {
      income +=
        receivable.paidAmount;
    }
  }

  for (
    const payable of
    data.payables
  ) {
    if (
      payable.status ===
      "CANCELADO"
    ) {
      continue;
    }

    const paidAt =
      toDateInputValue(
        payable.paidAt,
      );

    if (
      paidAt.startsWith(
        monthKey,
      )
    ) {
      expense +=
        payable.amount;
    }
  }

  return {
    monthKey,

    income,

    expense,

    result:
      income -
      expense,
  };
}

export function OfficeCashFlow({
  data,
}: Props) {
  const currentMonth =
    data.todayKey.slice(
      0,
      7,
    );

  const [
    monthKey,
    setMonthKey,
  ] =
    useState(
      currentMonth,
    );

  const [
    movementFilter,
    setMovementFilter,
  ] =
    useState<MovementFilter>(
      "TODOS",
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  /*
   * ==========================
   * HISTÓRICO DE 6 MESES
   * ==========================
   */

  const monthlyHistory =
    useMemo(() => {
      const result:
        MonthlyRealizedSummary[] =
          [];

      for (
        let offset = -5;
        offset <= 0;
        offset++
      ) {
        const historyMonth =
          shiftMonth(
            monthKey,
            offset,
          );

        result.push(
          getMonthlyRealizedSummary(
            {
              data,
              monthKey:
                historyMonth,
            },
          ),
        );
      }

      return result;
    }, [
      data,
      monthKey,
    ]);

  const selectedRealized =
    monthlyHistory[
      monthlyHistory.length -
        1
    ] ?? {
      monthKey,
      income: 0,
      expense: 0,
      result: 0,
    };

  const previousRealized =
    monthlyHistory[
      monthlyHistory.length -
        2
    ] ?? {
      monthKey:
        shiftMonth(
          monthKey,
          -1,
        ),

      income: 0,
      expense: 0,
      result: 0,
    };

  /*
   * ==========================
   * MOVIMENTAÇÕES DO MÊS
   * ==========================
   */

  const movements =
    useMemo(() => {
      const result:
        CashFlowMovement[] =
          [];

      for (
        const receivable of
        data.receivables
      ) {
        const status =
          getEffectiveFinancialStatus(
            receivable.status,
            receivable.dueDate,
          );

        if (
          status ===
          "CANCELADO"
        ) {
          continue;
        }

        const receivedAt =
          toDateInputValue(
            receivable.receivedAt,
          );

        if (
          receivable.paidAmount >
            0 &&
          receivedAt.startsWith(
            monthKey,
          )
        ) {
          result.push({
            id:
              `receivable-realized-${receivable.id}`,

            kind:
              "INCOME",

            state:
              "REALIZED",

            dateKey:
              receivedAt,

            title:
              receivable.description,

            subtitle:
              getReceivableSubtitle(
                receivable,
              ),

            amount:
              receivable.paidAmount,

            href:
              `/clientes/${receivable.clientId}`,
          });
        }

        const remaining =
          Math.max(
            receivable.totalAmount -
              receivable.paidAmount,
            0,
          );

        const dueDate =
          toDateInputValue(
            receivable.dueDate,
          );

        if (
          remaining > 0 &&
          dueDate.startsWith(
            monthKey,
          )
        ) {
          result.push({
            id:
              `receivable-projected-${receivable.id}`,

            kind:
              "INCOME",

            state:
              "PROJECTED",

            dateKey:
              dueDate,

            title:
              receivable.description,

            subtitle:
              getReceivableSubtitle(
                receivable,
              ),

            amount:
              remaining,

            href:
              `/clientes/${receivable.clientId}`,
          });
        }
      }

      for (
        const payable of
        data.payables
      ) {
        const status =
          getEffectiveFinancialStatus(
            payable.status,
            payable.dueDate,
          );

        if (
          status ===
          "CANCELADO"
        ) {
          continue;
        }

        const paidAt =
          toDateInputValue(
            payable.paidAt,
          );

        if (
          paidAt.startsWith(
            monthKey,
          )
        ) {
          result.push({
            id:
              `payable-realized-${payable.id}`,

            kind:
              "EXPENSE",

            state:
              "REALIZED",

            dateKey:
              paidAt,

            title:
              payable.description,

            subtitle:
              payableCategoryLabels[
                payable.category
              ],

            amount:
              payable.amount,

            href:
              null,
          });
        }

        const dueDate =
          toDateInputValue(
            payable.dueDate,
          );

        if (
          status !==
            "PAGO" &&
          dueDate.startsWith(
            monthKey,
          )
        ) {
          result.push({
            id:
              `payable-projected-${payable.id}`,

            kind:
              "EXPENSE",

            state:
              "PROJECTED",

            dateKey:
              dueDate,

            title:
              payable.description,

            subtitle:
              payableCategoryLabels[
                payable.category
              ],

            amount:
              payable.amount,

            href:
              null,
          });
        }
      }

      return result.sort(
        (
          first,
          second,
        ) => {
          const dateComparison =
            first.dateKey.localeCompare(
              second.dateKey,
            );

          if (
            dateComparison !==
            0
          ) {
            return dateComparison;
          }

          if (
            first.state ===
              second.state
          ) {
            return 0;
          }

          return first.state ===
            "REALIZED"
            ? -1
            : 1;
        },
      );
    }, [
      data.payables,
      data.receivables,
      monthKey,
    ]);

  /*
   * ==========================
   * TOTAIS DO MÊS
   * ==========================
   */

  let realizedIncome =
    0;

  let realizedExpense =
    0;

  let projectedIncome =
    0;

  let projectedExpense =
    0;

  for (
    const movement of
    movements
  ) {
    if (
      movement.state ===
        "REALIZED" &&
      movement.kind ===
        "INCOME"
    ) {
      realizedIncome +=
        movement.amount;
    }

    if (
      movement.state ===
        "REALIZED" &&
      movement.kind ===
        "EXPENSE"
    ) {
      realizedExpense +=
        movement.amount;
    }

    if (
      movement.state ===
        "PROJECTED" &&
      movement.kind ===
        "INCOME"
    ) {
      projectedIncome +=
        movement.amount;
    }

    if (
      movement.state ===
        "PROJECTED" &&
      movement.kind ===
        "EXPENSE"
    ) {
      projectedExpense +=
        movement.amount;
    }
  }

  const realizedResult =
    realizedIncome -
    realizedExpense;

  const projectedTotalIncome =
    realizedIncome +
    projectedIncome;

  const projectedTotalExpense =
    realizedExpense +
    projectedExpense;

  const estimatedResult =
    projectedTotalIncome -
    projectedTotalExpense;

  /*
   * ==========================
   * PENDÊNCIAS ANTERIORES
   * ==========================
   */

  const monthStart =
    `${monthKey}-01`;

  let previousReceivables =
    0;

  let previousReceivablesCount =
    0;

  let previousPayables =
    0;

  let previousPayablesCount =
    0;

  for (
    const receivable of
    data.receivables
  ) {
    const status =
      getEffectiveFinancialStatus(
        receivable.status,
        receivable.dueDate,
      );

    if (
      status ===
        "PAGO" ||
      status ===
        "CANCELADO"
    ) {
      continue;
    }

    const dueDate =
      toDateInputValue(
        receivable.dueDate,
      );

    const remaining =
      Math.max(
        receivable.totalAmount -
          receivable.paidAmount,
        0,
      );

    if (
      dueDate &&
      dueDate <
        monthStart &&
      remaining > 0
    ) {
      previousReceivables +=
        remaining;

      previousReceivablesCount +=
        1;
    }
  }

  for (
    const payable of
    data.payables
  ) {
    const status =
      getEffectiveFinancialStatus(
        payable.status,
        payable.dueDate,
      );

    if (
      status ===
        "PAGO" ||
      status ===
        "CANCELADO"
    ) {
      continue;
    }

    const dueDate =
      toDateInputValue(
        payable.dueDate,
      );

    if (
      dueDate &&
      dueDate <
        monthStart
    ) {
      previousPayables +=
        payable.amount;

      previousPayablesCount +=
        1;
    }
  }

  /*
   * ==========================
   * BUSCA
   * ==========================
   */

  const normalizedSearch =
    search
      .trim()
      .toLocaleLowerCase(
        "pt-BR",
      );

  const filteredMovements =
    useMemo(
      () =>
        movements.filter(
          (movement) => {
            if (
              !matchesMovementFilter(
                movement,
                movementFilter,
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
              movement.title,
              movement.subtitle,
            ]
              .join(" ")
              .toLocaleLowerCase(
                "pt-BR",
              )
              .includes(
                normalizedSearch,
              );
          },
        ),
      [
        movements,
        movementFilter,
        normalizedSearch,
      ],
    );

  const groupedMovements =
    useMemo(() => {
      const groups =
        new Map<
          string,
          CashFlowMovement[]
        >();

      for (
        const movement of
        filteredMovements
      ) {
        const existing =
          groups.get(
            movement.dateKey,
          );

        if (existing) {
          existing.push(
            movement,
          );
        } else {
          groups.set(
            movement.dateKey,
            [
              movement,
            ],
          );
        }
      }

      return Array.from(
        groups.entries(),
      );
    }, [
      filteredMovements,
    ]);

  const isCurrentMonth =
    monthKey ===
    currentMonth;

  const isPastMonth =
    monthKey <
    currentMonth;

  return (
    <div className="space-y-8">
      {/* ==========================
          CABEÇALHO
      ========================== */}

      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <ArrowRightLeft className="size-5" />
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              Fluxo de caixa
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe entradas,
              saídas, evolução mensal
              e resultado financeiro.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() =>
              setMonthKey(
                (
                  current,
                ) =>
                  shiftMonth(
                    current,
                    -1,
                  ),
              )
            }
            className="flex size-10 items-center justify-center rounded-lg border bg-background transition hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </button>

          <div className="flex h-10 min-w-44 items-center justify-center rounded-lg border bg-card px-4 text-sm font-semibold">
            {formatMonth(
              monthKey,
            )}
          </div>

          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() =>
              setMonthKey(
                (
                  current,
                ) =>
                  shiftMonth(
                    current,
                    1,
                  ),
              )
            }
            className="flex size-10 items-center justify-center rounded-lg border bg-background transition hover:bg-muted"
          >
            <ArrowRight className="size-4" />
          </button>

          {!isCurrentMonth ? (
            <button
              type="button"
              onClick={() =>
                setMonthKey(
                  currentMonth,
                )
              }
              className="h-10 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted"
            >
              Este mês
            </button>
          ) : null}
        </div>
      </section>

      {/* ==========================
          INDICADORES
      ========================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Entradas realizadas"
          value={
            realizedIncome
          }
          description="Valores efetivamente recebidos no período"
          icon={
            <ArrowDownToLine className="size-5" />
          }
          tone="income"
        />

        <SummaryCard
          title="Saídas realizadas"
          value={
            realizedExpense
          }
          description="Despesas efetivamente pagas no período"
          icon={
            <ArrowUpFromLine className="size-5" />
          }
          tone="expense"
        />

        <SummaryCard
          title="Resultado realizado"
          value={
            realizedResult
          }
          description="Entradas menos saídas efetivamente realizadas"
          icon={
            realizedResult >=
            0 ? (
              <TrendingUp className="size-5" />
            ) : (
              <TrendingDown className="size-5" />
            )
          }
          tone={
            realizedResult >=
            0
              ? "positive"
              : "negative"
          }
          signed
        />

        <SummaryCard
          title={
            isPastMonth
              ? "Resultado potencial"
              : "Resultado estimado"
          }
          value={
            estimatedResult
          }
          description={
            isPastMonth
              ? "Realizado somado aos valores daquele mês que permanecem em aberto"
              : "Realizado mais valores ainda previstos no mês"
          }
          icon={
            estimatedResult >=
            0 ? (
              <TrendingUp className="size-5" />
            ) : (
              <TrendingDown className="size-5" />
            )
          }
          tone={
            estimatedResult >=
            0
              ? "projection"
              : "negative"
          }
          signed
        />
      </section>

      {/* ==========================
          EVOLUÇÃO
      ========================== */}

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-muted/20 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
              <TrendingUp className="size-5" />
            </div>

            <div>
              <h3 className="font-semibold">
                Evolução financeira
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Comparativo das
                entradas e saídas
                efetivamente realizadas
                nos últimos seis meses.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <CashFlowChart
            history={
              monthlyHistory
            }
            selectedMonth={
              monthKey
            }
          />

          <div className="mt-6 border-t pt-5">
            <div className="mb-4">
              <h4 className="font-semibold">
                Comparação com o mês
                anterior
              </h4>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatMonth(
                  monthKey,
                )}{" "}
                em relação a{" "}
                {formatMonth(
                  shiftMonth(
                    monthKey,
                    -1,
                  ),
                )}
                .
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ComparisonCard
                title="Entradas"
                current={
                  selectedRealized.income
                }
                previous={
                  previousRealized.income
                }
                positiveWhenHigher
              />

              <ComparisonCard
                title="Saídas"
                current={
                  selectedRealized.expense
                }
                previous={
                  previousRealized.expense
                }
                positiveWhenHigher={
                  false
                }
              />

              <ComparisonCard
                title="Resultado"
                current={
                  selectedRealized.result
                }
                previous={
                  previousRealized.result
                }
                positiveWhenHigher
                signed
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==========================
          COMPOSIÇÃO
      ========================== */}

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-muted/20 p-5">
          <h3 className="font-semibold">
            Composição do mês
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Separe o que já foi
            realizado do que ainda
            está previsto ou permanece
            em aberto.
          </p>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-2">
          <FlowCompositionCard
            title="Entradas"
            icon={
              <ArrowDownToLine className="size-5" />
            }
            tone="income"
            realized={
              realizedIncome
            }
            projected={
              projectedIncome
            }
            projectedLabel={
              isPastMonth
                ? "Ainda em aberto"
                : "Ainda previstas"
            }
            total={
              projectedTotalIncome
            }
          />

          <FlowCompositionCard
            title="Saídas"
            icon={
              <ArrowUpFromLine className="size-5" />
            }
            tone="expense"
            realized={
              realizedExpense
            }
            projected={
              projectedExpense
            }
            projectedLabel={
              isPastMonth
                ? "Ainda em aberto"
                : "Ainda previstas"
            }
            total={
              projectedTotalExpense
            }
          />
        </div>

        <div className="border-t p-5">
          <div
            className={`rounded-xl border p-5 ${
              estimatedResult >=
              0
                ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"
                : "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  {isPastMonth
                    ? "Resultado potencial do período"
                    : "Resultado estimado do período"}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {isPastMonth
                    ? "Considera o que foi realizado e os valores daquele período que ainda permanecem em aberto."
                    : "Considera movimentações realizadas e valores ainda previstos no mês."}
                </p>
              </div>

              <p
                className={`shrink-0 text-2xl font-bold ${
                  estimatedResult >=
                  0
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {formatSignedMoney(
                  estimatedResult,
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================
          PENDÊNCIAS ANTERIORES
      ========================== */}

      {(previousReceivablesCount >
        0 ||
        previousPayablesCount >
          0) ? (
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10">
          <div className="flex items-start gap-3 border-b border-amber-200/70 p-5 dark:border-amber-900">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <AlertTriangle className="size-5" />
            </div>

            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                Pendências anteriores
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Valores ainda abertos
                com vencimento anterior
                ao mês selecionado.
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <PreviousPendingCard
              title="Recebimentos anteriores"
              value={
                previousReceivables
              }
              count={
                previousReceivablesCount
              }
              singular="cobrança vencida"
              plural="cobranças vencidas"
              kind="income"
            />

            <PreviousPendingCard
              title="Despesas anteriores"
              value={
                previousPayables
              }
              count={
                previousPayablesCount
              }
              singular="conta vencida"
              plural="contas vencidas"
              kind="expense"
            />
          </div>
        </section>
      ) : null}

      {/* ==========================
          MOVIMENTAÇÕES
      ========================== */}

      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <CalendarDays className="size-5" />
          </div>

          <div>
            <h3 className="text-lg font-semibold">
              Movimentações do mês
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Entradas e saídas
              organizadas pela data
              em que ocorreram ou
              estavam previstas.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border bg-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Buscar movimentação, cliente ou categoria..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <MovementFilterButton
              active={
                movementFilter ===
                "TODOS"
              }
              onClick={() =>
                setMovementFilter(
                  "TODOS",
                )
              }
            >
              Todos
            </MovementFilterButton>

            <MovementFilterButton
              active={
                movementFilter ===
                "REALIZADOS"
              }
              onClick={() =>
                setMovementFilter(
                  "REALIZADOS",
                )
              }
            >
              Realizados
            </MovementFilterButton>

            <MovementFilterButton
              active={
                movementFilter ===
                "PREVISTOS"
              }
              onClick={() =>
                setMovementFilter(
                  "PREVISTOS",
                )
              }
            >
              Previstos
            </MovementFilterButton>
          </div>
        </div>

        {filteredMovements.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ArrowRightLeft className="size-5" />
            </div>

            <p className="mt-3 font-medium">
              Nenhuma movimentação
              encontrada.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Não há entradas ou
              saídas correspondentes
              aos filtros deste mês.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedMovements.map(
              ([
                dateKey,
                dayMovements,
              ]) => (
                <MovementDay
                  key={
                    dateKey
                  }
                  dateKey={
                    dateKey
                  }
                  movements={
                    dayMovements
                  }
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/*
 * ==========================
 * GRÁFICO
 * ==========================
 */

function CashFlowChart({
  history,
  selectedMonth,
}: {
  history:
    MonthlyRealizedSummary[];

  selectedMonth:
    string;
}) {
  const maximumValue =
    Math.max(
      1,

      ...history.flatMap(
        (month) => [
          month.income,
          month.expense,
        ],
      ),
    );

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-500" />

          <span className="text-muted-foreground">
            Entradas
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-rose-500" />

          <span className="text-muted-foreground">
            Saídas
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[620px] grid-cols-6 gap-3">
          {history.map(
            (month) => {
              const incomeHeight =
                month.income >
                0
                  ? Math.max(
                      8,
                      (month.income /
                        maximumValue) *
                        100,
                    )
                  : 0;

              const expenseHeight =
                month.expense >
                0
                  ? Math.max(
                      8,
                      (month.expense /
                        maximumValue) *
                        100,
                    )
                  : 0;

              const isSelected =
                month.monthKey ===
                selectedMonth;

              return (
                <div
                  key={
                    month.monthKey
                  }
                  className={`rounded-xl p-3 ${
                    isSelected
                      ? "bg-blue-50/60 ring-1 ring-blue-200 dark:bg-blue-950/20 dark:ring-blue-900"
                      : "bg-muted/20"
                  }`}
                >
                  <div className="flex h-44 items-end justify-center gap-2">
                    <div className="flex h-full w-8 items-end">
                      <div
                        title={`Entradas: ${formatMoney(
                          month.income,
                        )}`}
                        className="w-full rounded-t-md bg-emerald-500 transition-all"
                        style={{
                          height:
                            `${incomeHeight}%`,
                        }}
                      />
                    </div>

                    <div className="flex h-full w-8 items-end">
                      <div
                        title={`Saídas: ${formatMoney(
                          month.expense,
                        )}`}
                        className="w-full rounded-t-md bg-rose-500 transition-all"
                        style={{
                          height:
                            `${expenseHeight}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-center">
                    <p
                      className={`text-sm font-semibold ${
                        isSelected
                          ? "text-blue-700 dark:text-blue-300"
                          : ""
                      }`}
                    >
                      {formatShortMonth(
                        month.monthKey,
                      )}
                    </p>

                    <p
                      className={`mt-1 text-xs font-semibold ${
                        month.result >
                        0
                          ? "text-emerald-700 dark:text-emerald-300"
                          : month.result <
                              0
                            ? "text-red-700 dark:text-red-300"
                            : "text-muted-foreground"
                      }`}
                    >
                      {formatSignedMoney(
                        month.result,
                      )}
                    </p>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}

/*
 * ==========================
 * COMPARAÇÃO
 * ==========================
 */

function ComparisonCard({
  title,
  current,
  previous,
  positiveWhenHigher,
  signed = false,
}: {
  title: string;

  current: number;

  previous: number;

  positiveWhenHigher:
    boolean;

  signed?: boolean;
}) {
  const direction =
    getComparisonDirection(
      current,
      previous,
    );

  const percentage =
    getPercentageChange(
      current,
      previous,
    );

  const difference =
    current -
    previous;

  const isImprovement =
    direction ===
    "EQUAL"
      ? null
      : positiveWhenHigher
        ? direction ===
          "UP"
        : direction ===
          "DOWN";

  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-xs font-medium text-muted-foreground">
        {title}
      </p>

      <p className="mt-2 text-lg font-bold">
        {signed
          ? formatSignedMoney(
              current,
            )
          : formatMoney(
              current,
            )}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <ComparisonIcon
          direction={
            direction
          }
          isImprovement={
            isImprovement
          }
        />

        <div>
          <p
            className={`text-xs font-semibold ${
              isImprovement ===
              true
                ? "text-emerald-700 dark:text-emerald-300"
                : isImprovement ===
                    false
                  ? "text-red-700 dark:text-red-300"
                  : "text-muted-foreground"
            }`}
          >
            {percentage ===
            null
              ? difference ===
                0
                ? "Sem alteração"
                : "Sem base comparável"
              : `${Math.abs(
                  percentage,
                ).toLocaleString(
                  "pt-BR",
                  {
                    maximumFractionDigits:
                      1,
                  },
                )}% ${
                  direction ===
                  "UP"
                    ? "maior"
                    : direction ===
                        "DOWN"
                      ? "menor"
                      : "igual"
                }`}
          </p>

          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Mês anterior:{" "}
            {signed
              ? formatSignedMoney(
                  previous,
                )
              : formatMoney(
                  previous,
                )}
          </p>
        </div>
      </div>
    </div>
  );
}

function ComparisonIcon({
  direction,
  isImprovement,
}: {
  direction:
    ComparisonDirection;

  isImprovement:
    boolean | null;
}) {
  if (
    direction ===
    "EQUAL"
  ) {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Equal className="size-4" />
      </div>
    );
  }

  const className =
    isImprovement
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
      : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";

  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${className}`}
    >
      {direction ===
      "UP" ? (
        <ArrowUp className="size-4" />
      ) : (
        <ArrowDown className="size-4" />
      )}
    </div>
  );
}

/*
 * ==========================
 * RESUMO
 * ==========================
 */

function SummaryCard({
  title,
  value,
  description,
  icon,
  tone,
  signed = false,
}: {
  title: string;

  value: number;

  description: string;

  icon: ReactNode;

  tone:
    SummaryTone;

  signed?: boolean;
}) {
  const styles =
    getSummaryStyles(
      tone,
    );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 ${styles.container}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`}
      />

      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-sm font-semibold ${styles.title}`}
        >
          {title}
        </p>

        <div
          className={`flex size-10 items-center justify-center rounded-xl ${styles.icon}`}
        >
          {icon}
        </div>
      </div>

      <p
        className={`mt-5 text-2xl font-bold tracking-tight ${styles.value}`}
      >
        {signed
          ? formatSignedMoney(
              value,
            )
          : formatMoney(
              value,
            )}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/*
 * ==========================
 * COMPOSIÇÃO
 * ==========================
 */

function FlowCompositionCard({
  title,
  icon,
  tone,
  realized,
  projected,
  projectedLabel,
  total,
}: {
  title: string;

  icon:
    ReactNode;

  tone:
    | "income"
    | "expense";

  realized: number;

  projected: number;

  projectedLabel:
    string;

  total: number;
}) {
  const isIncome =
    tone ===
    "income";

  return (
    <div
      className={`rounded-xl border p-4 ${
        isIncome
          ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/10"
          : "border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-9 items-center justify-center rounded-lg ${
            isIncome
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300"
          }`}
        >
          {icon}
        </div>

        <h4 className="font-semibold">
          {title}
        </h4>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Realizadas
          </p>

          <p className="mt-1 text-lg font-semibold">
            {formatMoney(
              realized,
            )}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            {projectedLabel}
          </p>

          <p className="mt-1 text-lg font-semibold">
            {formatMoney(
              projected,
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-medium text-muted-foreground">
            Total do período
          </span>

          <span
            className={`font-bold ${
              isIncome
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-rose-700 dark:text-rose-300"
            }`}
          >
            {formatMoney(
              total,
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/*
 * ==========================
 * PENDÊNCIAS
 * ==========================
 */

function PreviousPendingCard({
  title,
  value,
  count,
  singular,
  plural,
  kind,
}: {
  title: string;

  value: number;

  count: number;

  singular: string;

  plural: string;

  kind:
    | "income"
    | "expense";
}) {
  const isIncome =
    kind ===
    "income";

  return (
    <div className="rounded-xl border bg-background/70 p-4">
      <div className="flex items-center gap-2">
        {isIncome ? (
          <ArrowDownToLine className="size-4 text-emerald-700 dark:text-emerald-300" />
        ) : (
          <ArrowUpFromLine className="size-4 text-rose-700 dark:text-rose-300" />
        )}

        <p className="text-sm font-medium">
          {title}
        </p>
      </div>

      <p
        className={`mt-3 text-xl font-bold ${
          isIncome
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-rose-700 dark:text-rose-300"
        }`}
      >
        {formatMoney(
          value,
        )}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {count}{" "}
        {count === 1
          ? singular
          : plural}
      </p>
    </div>
  );
}

/*
 * ==========================
 * MOVIMENTAÇÕES
 * ==========================
 */

function MovementFilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;

  onClick:
    () => void;

  children:
    ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
          : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function MovementDay({
  dateKey,
  movements,
}: {
  dateKey: string;

  movements:
    CashFlowMovement[];
}) {
  let income = 0;
  let expense = 0;

  for (
    const movement of
    movements
  ) {
    if (
      movement.kind ===
      "INCOME"
    ) {
      income +=
        movement.amount;
    } else {
      expense +=
        movement.amount;
    }
  }

  const result =
    income -
    expense;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-3 border-b bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />

          <p className="text-sm font-semibold">
            {formatDateKey(
              dateKey,
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          {income > 0 ? (
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              +{" "}
              {formatMoney(
                income,
              )}
            </span>
          ) : null}

          {expense > 0 ? (
            <span className="font-medium text-rose-700 dark:text-rose-300">
              -{" "}
              {formatMoney(
                expense,
              )}
            </span>
          ) : null}

          <span
            className={`font-semibold ${
              result >= 0
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            Resultado:{" "}
            {formatSignedMoney(
              result,
            )}
          </span>
        </div>
      </div>

      <div className="divide-y">
        {movements.map(
          (movement) => (
            <MovementRow
              key={
                movement.id
              }
              movement={
                movement
              }
            />
          ),
        )}
      </div>
    </div>
  );
}

function MovementRow({
  movement,
}: {
  movement:
    CashFlowMovement;
}) {
  const isIncome =
    movement.kind ===
    "INCOME";

  const isRealized =
    movement.state ===
    "REALIZED";

  return (
    <div className="flex items-start justify-between gap-4 p-4 transition hover:bg-muted/20">
      <div className="flex min-w-0 gap-3">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            isIncome
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
          }`}
        >
          {isIncome ? (
            <ArrowDownToLine className="size-4" />
          ) : (
            <ArrowUpFromLine className="size-4" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              {
                movement.title
              }
            </p>

            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                isRealized
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
              }`}
            >
              {isRealized
                ? "Realizado"
                : "Previsto"}
            </span>
          </div>

          {movement.href ? (
            <Link
              href={
                movement.href
              }
              className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground hover:underline"
            >
              <UserRound className="size-3" />

              {
                movement.subtitle
              }
            </Link>
          ) : (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ReceiptText className="size-3" />

              {
                movement.subtitle
              }
            </p>
          )}

          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            {isRealized ? (
              <CheckCircle2 className="size-3" />
            ) : (
              <Clock3 className="size-3" />
            )}

            {isRealized
              ? "Movimentação realizada"
              : "Movimentação prevista"}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`font-bold ${
            isIncome
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-rose-700 dark:text-rose-300"
          }`}
        >
          {isIncome
            ? "+"
            : "-"}{" "}
          {formatMoney(
            movement.amount,
          )}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {isIncome
            ? "entrada"
            : "saída"}
        </p>
      </div>
    </div>
  );
}

/*
 * ==========================
 * CORES
 * ==========================
 */

function getSummaryStyles(
  tone:
    SummaryTone,
) {
  switch (tone) {
    case "income":
      return {
        container:
          "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/15",

        accent:
          "bg-emerald-500",

        title:
          "text-emerald-800 dark:text-emerald-300",

        value:
          "text-emerald-800 dark:text-emerald-200",

        icon:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      };

    case "expense":
      return {
        container:
          "border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/15",

        accent:
          "bg-rose-500",

        title:
          "text-rose-800 dark:text-rose-300",

        value:
          "text-rose-800 dark:text-rose-200",

        icon:
          "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
      };

    case "positive":
      return {
        container:
          "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/15",

        accent:
          "bg-emerald-500",

        title:
          "text-emerald-800 dark:text-emerald-300",

        value:
          "text-emerald-700 dark:text-emerald-300",

        icon:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      };

    case "negative":
      return {
        container:
          "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/15",

        accent:
          "bg-red-500",

        title:
          "text-red-800 dark:text-red-300",

        value:
          "text-red-700 dark:text-red-300",

        icon:
          "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300",
      };

    case "projection":
      return {
        container:
          "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/15",

        accent:
          "bg-blue-500",

        title:
          "text-blue-800 dark:text-blue-300",

        value:
          "text-blue-800 dark:text-blue-200",

        icon:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
      };
  }
}