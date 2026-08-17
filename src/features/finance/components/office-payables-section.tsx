"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import type {
  FinancialStatus,
  PayableCategory,
} from "@prisma/client";

import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";

import {
  formatReceivableDate,
  getDateTimestamp,
  getEffectiveFinancialStatus,
  toDateInputValue,
} from "../lib/receivable-display";

import type {
  OfficePayable,
} from "../types/office-financial";

import {
  CreatePayableDialog,
} from "./create-payable-dialog";

import {
  PayableActionsMenu,
  type EditablePayable,
} from "./payable-actions-menu";

type Props = {
  payables:
    OfficePayable[];

  todayKey: string;
};

type StatusFilter =
  | "TODOS"
  | "PENDENTE"
  | "ATRASADO"
  | "PAGO"
  | "CANCELADO";

type PeriodFilter =
  | "TODOS"
  | "ESTE_MES"
  | "PROXIMOS_30_DIAS";

type CategoryFilter =
  | "TODAS"
  | PayableCategory;

type SummaryTone =
  | "payable"
  | "overdue"
  | "paid"
  | "forecast";

type AttentionTone =
  | "danger"
  | "upcoming";

const categoryLabels: Record<
  PayableCategory,
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

const paymentMethodLabels: Record<
  string,
  string
> = {
  PIX:
    "PIX",

  DINHEIRO:
    "Dinheiro",

  CARTAO:
    "Cartão",

  TRANSFERENCIA:
    "Transferência",

  DEPOSITO:
    "Depósito",

  BOLETO:
    "Boleto",

  DEBITO_AUTOMATICO:
    "Débito automático",

  OUTRO:
    "Outro",
};

function formatMoney(
  value: number,
): string {
  return value.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

function parseDateKey(
  value: string,
): number {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  return Date.UTC(
    year,
    month - 1,
    day,
    12,
  );
}

function matchesStatus(
  payable:
    OfficePayable,

  filter:
    StatusFilter,
): boolean {
  if (
    filter === "TODOS"
  ) {
    return true;
  }

  const status =
    getEffectiveFinancialStatus(
      payable.status,
      payable.dueDate,
    );

  if (
    filter === "PENDENTE"
  ) {
    return (
      status === "PENDENTE" ||
      status === "PARCIAL"
    );
  }

  return status === filter;
}

function matchesPeriod(
  payable:
    OfficePayable,

  filter:
    PeriodFilter,

  todayKey:
    string,
): boolean {
  if (
    filter === "TODOS"
  ) {
    return true;
  }

  const dueDateKey =
    toDateInputValue(
      payable.dueDate,
    );

  if (!dueDateKey) {
    return false;
  }

  if (
    filter === "ESTE_MES"
  ) {
    return (
      dueDateKey.slice(
        0,
        7,
      ) ===
      todayKey.slice(
        0,
        7,
      )
    );
  }

  const dueTimestamp =
    getDateTimestamp(
      payable.dueDate,
    );

  if (
    dueTimestamp === null
  ) {
    return false;
  }

  const todayTimestamp =
    parseDateKey(
      todayKey,
    );

  const thirtyDays =
    todayTimestamp +
    30 *
      24 *
      60 *
      60 *
      1000;

  return (
    dueTimestamp >=
      todayTimestamp &&
    dueTimestamp <=
      thirtyDays
  );
}

function getStatusPriority(
  status:
    FinancialStatus,
): number {
  switch (status) {
    case "ATRASADO":
      return 0;

    case "PENDENTE":
    case "PARCIAL":
      return 1;

    case "PAGO":
      return 2;

    case "CANCELADO":
      return 3;
  }
}

export function OfficePayablesSection({
  payables,
  todayKey,
}: Props) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "TODOS",
    );

  const [
    periodFilter,
    setPeriodFilter,
  ] =
    useState<PeriodFilter>(
      "TODOS",
    );

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState<CategoryFilter>(
      "TODAS",
    );

  /*
   * ==========================
   * RESUMO
   * ==========================
   */

  const currentMonth =
    todayKey.slice(
      0,
      7,
    );

  let totalToPay = 0;

  let totalOverdue = 0;

  let paidThisMonth = 0;

  let expectedThisMonth = 0;

  let toPayCount = 0;

  let overdueCount = 0;

  let paidThisMonthCount = 0;

  let expectedThisMonthCount = 0;

  for (
    const payable of
    payables
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

    if (
      status !== "PAGO"
    ) {
      totalToPay +=
        payable.amount;

      toPayCount += 1;
    }

    if (
      status ===
      "ATRASADO"
    ) {
      totalOverdue +=
        payable.amount;

      overdueCount += 1;
    }

    const paidAt =
      toDateInputValue(
        payable.paidAt,
      );

    if (
      status === "PAGO" &&
      paidAt.startsWith(
        currentMonth,
      )
    ) {
      paidThisMonth +=
        payable.amount;

      paidThisMonthCount +=
        1;
    }

    const dueDate =
      toDateInputValue(
        payable.dueDate,
      );

    if (
      status !== "PAGO" &&
      dueDate.startsWith(
        currentMonth,
      )
    ) {
      expectedThisMonth +=
        payable.amount;

      expectedThisMonthCount +=
        1;
    }
  }

  /*
   * ==========================
   * ATENÇÃO
   * ==========================
   */

  const todayTimestamp =
    parseDateKey(
      todayKey,
    );

  const nextSevenDays =
    todayTimestamp +
    7 *
      24 *
      60 *
      60 *
      1000;

  const overduePayables =
    payables
      .filter(
        (payable) =>
          getEffectiveFinancialStatus(
            payable.status,
            payable.dueDate,
          ) ===
          "ATRASADO",
      )
      .sort(
        (
          first,
          second,
        ) =>
          (getDateTimestamp(
            first.dueDate,
          ) ?? 0) -
          (getDateTimestamp(
            second.dueDate,
          ) ?? 0),
      )
      .slice(0, 5);

  const upcomingPayables =
    payables
      .filter(
        (payable) => {
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
            return false;
          }

          const dueTimestamp =
            getDateTimestamp(
              payable.dueDate,
            );

          if (
            dueTimestamp ===
            null
          ) {
            return false;
          }

          return (
            dueTimestamp >=
              todayTimestamp &&
            dueTimestamp <=
              nextSevenDays
          );
        },
      )
      .sort(
        (
          first,
          second,
        ) =>
          (getDateTimestamp(
            first.dueDate,
          ) ?? 0) -
          (getDateTimestamp(
            second.dueDate,
          ) ?? 0),
      )
      .slice(0, 5);

  /*
   * ==========================
   * FILTROS
   * ==========================
   */

  const normalizedSearch =
    search
      .trim()
      .toLocaleLowerCase(
        "pt-BR",
      );

  const filtered =
    useMemo(
      () =>
        payables
          .filter(
            (payable) => {
              if (
                !matchesStatus(
                  payable,
                  statusFilter,
                )
              ) {
                return false;
              }

              if (
                !matchesPeriod(
                  payable,
                  periodFilter,
                  todayKey,
                )
              ) {
                return false;
              }

              if (
                categoryFilter !==
                  "TODAS" &&
                payable.category !==
                  categoryFilter
              ) {
                return false;
              }

              if (
                normalizedSearch
              ) {
                const content = [
                  payable.description,

                  categoryLabels[
                    payable.category
                  ],

                  payable.notes ??
                    "",
                ]
                  .join(" ")
                  .toLocaleLowerCase(
                    "pt-BR",
                  );

                if (
                  !content.includes(
                    normalizedSearch,
                  )
                ) {
                  return false;
                }
              }

              return true;
            },
          )
          .sort(
            (
              first,
              second,
            ) => {
              const firstStatus =
                getEffectiveFinancialStatus(
                  first.status,
                  first.dueDate,
                );

              const secondStatus =
                getEffectiveFinancialStatus(
                  second.status,
                  second.dueDate,
                );

              const priorityDifference =
                getStatusPriority(
                  firstStatus,
                ) -
                getStatusPriority(
                  secondStatus,
                );

              if (
                priorityDifference !==
                0
              ) {
                return priorityDifference;
              }

              if (
                firstStatus ===
                  "PAGO" &&
                secondStatus ===
                  "PAGO"
              ) {
                return (
                  (getDateTimestamp(
                    second.paidAt,
                  ) ?? 0) -
                  (getDateTimestamp(
                    first.paidAt,
                  ) ?? 0)
                );
              }

              return (
                (getDateTimestamp(
                  first.dueDate,
                ) ?? 0) -
                (getDateTimestamp(
                  second.dueDate,
                ) ?? 0)
              );
            },
          ),
      [
        payables,
        statusFilter,
        periodFilter,
        categoryFilter,
        normalizedSearch,
        todayKey,
      ],
    );

  const hasFilters =
    Boolean(search) ||
    statusFilter !==
      "TODOS" ||
    periodFilter !==
      "TODOS" ||
    categoryFilter !==
      "TODAS";

  return (
    <div className="space-y-8">
      {/* ==========================
          CABEÇALHO E RESUMO
      ========================== */}

      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              <ReceiptText className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Contas a pagar
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Controle despesas,
                vencimentos e
                pagamentos do
                escritório.
              </p>
            </div>
          </div>

          <CreatePayableDialog />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="A pagar"
            value={
              totalToPay
            }
            description={
              toPayCount === 1
                ? "1 conta em aberto"
                : `${toPayCount} contas em aberto`
            }
            icon={
              <Wallet className="size-5" />
            }
            tone="payable"
          />

          <SummaryCard
            title="Em atraso"
            value={
              totalOverdue
            }
            description={
              overdueCount ===
              1
                ? "1 conta vencida"
                : `${overdueCount} contas vencidas`
            }
            icon={
              <AlertTriangle className="size-5" />
            }
            tone="overdue"
          />

          <SummaryCard
            title="Pago no mês"
            value={
              paidThisMonth
            }
            description={
              paidThisMonthCount ===
              1
                ? "1 pagamento realizado"
                : `${paidThisMonthCount} pagamentos realizados`
            }
            icon={
              <CheckCircle2 className="size-5" />
            }
            tone="paid"
          />

          <SummaryCard
            title="Previsto neste mês"
            value={
              expectedThisMonth
            }
            description={
              expectedThisMonthCount ===
              1
                ? "1 conta prevista"
                : `${expectedThisMonthCount} contas previstas`
            }
            icon={
              <CalendarClock className="size-5" />
            }
            tone="forecast"
          />
        </div>
      </section>

      {/* ==========================
          ATENÇÃO
      ========================== */}

      {(overduePayables.length >
        0 ||
        upcomingPayables.length >
          0) ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Atenção
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Despesas vencidas ou
              próximas do vencimento.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AttentionCard
              title="Em atraso"
              description="Contas que já ultrapassaram o vencimento."
              icon={
                <AlertTriangle className="size-5" />
              }
              payables={
                overduePayables
              }
              emptyMessage="Nenhuma conta em atraso."
              tone="danger"
            />

            <AttentionCard
              title="Próximos 7 dias"
              description="Contas com vencimento próximo."
              icon={
                <CalendarDays className="size-5" />
              }
              payables={
                upcomingPayables
              }
              emptyMessage="Nenhuma conta vence nos próximos 7 dias."
              tone="upcoming"
            />
          </div>
        </section>
      ) : null}

      {/* ==========================
          LISTAGEM
      ========================== */}

      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <CircleDollarSign className="size-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Despesas
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Consulte e gerencie
              todas as contas do
              escritório.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-rose-200/70 bg-card dark:border-rose-900">
          <div className="border-b bg-rose-50/40 p-4 dark:bg-rose-950/10">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-rose-700 dark:text-rose-300" />

              <p className="text-sm font-semibold">
                Filtros
              </p>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Buscar conta ou observação..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <FilterSelect
                label="Situação"
                value={
                  statusFilter
                }
                onChange={(
                  value,
                ) =>
                  setStatusFilter(
                    value as StatusFilter,
                  )
                }
              >
                <option value="TODOS">
                  Todas
                </option>

                <option value="PENDENTE">
                  A pagar
                </option>

                <option value="ATRASADO">
                  Atrasadas
                </option>

                <option value="PAGO">
                  Pagas
                </option>

                <option value="CANCELADO">
                  Canceladas
                </option>
              </FilterSelect>

              <FilterSelect
                label="Categoria"
                value={
                  categoryFilter
                }
                onChange={(
                  value,
                ) =>
                  setCategoryFilter(
                    value as CategoryFilter,
                  )
                }
              >
                <option value="TODAS">
                  Todas as categorias
                </option>

                {Object.entries(
                  categoryLabels,
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
                      {label}
                    </option>
                  ),
                )}
              </FilterSelect>

              <FilterSelect
                label="Período"
                value={
                  periodFilter
                }
                onChange={(
                  value,
                ) =>
                  setPeriodFilter(
                    value as PeriodFilter,
                  )
                }
              >
                <option value="TODOS">
                  Todos os períodos
                </option>

                <option value="ESTE_MES">
                  Este mês
                </option>

                <option value="PROXIMOS_30_DIAS">
                  Próximos 30 dias
                </option>
              </FilterSelect>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {filtered.length === 1
              ? "1 resultado"
              : `${filtered.length} resultados`}
          </p>

          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");

                setStatusFilter(
                  "TODOS",
                );

                setPeriodFilter(
                  "TODOS",
                );

                setCategoryFilter(
                  "TODAS",
                );
              }}
              className="text-sm font-semibold text-rose-700 transition hover:text-rose-800 hover:underline dark:text-rose-300"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>

        {payables.length === 0 ? (
          <EmptyState
            title="Nenhuma conta cadastrada."
            description="Cadastre as despesas do escritório para acompanhar seus vencimentos."
          />
        ) : filtered.length ===
          0 ? (
          <EmptyState
            title="Nenhuma conta encontrada."
            description="Tente alterar os filtros utilizados."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(
              (payable) => (
                <PayableCard
                  key={
                    payable.id
                  }
                  payable={
                    payable
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
 * SUMMARY
 * ==========================
 */

function SummaryCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string;

  value: number;

  description: string;

  icon: ReactNode;

  tone: SummaryTone;
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
        {formatMoney(
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
 * ATENÇÃO
 * ==========================
 */

function AttentionCard({
  title,
  description,
  icon,
  payables,
  emptyMessage,
  tone,
}: {
  title: string;

  description: string;

  icon: ReactNode;

  payables:
    OfficePayable[];

  emptyMessage: string;

  tone:
    AttentionTone;
}) {
  const isDanger =
    tone === "danger";

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-card ${
        isDanger
          ? "border-red-200 dark:border-red-900"
          : "border-blue-200 dark:border-blue-900"
      }`}
    >
      <div
        className={`border-b p-4 ${
          isDanger
            ? "bg-red-50/50 dark:bg-red-950/15"
            : "bg-blue-50/50 dark:bg-blue-950/15"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-xl ${
              isDanger
                ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
            }`}
          >
            {icon}
          </div>

          <div>
            <h3
              className={`font-semibold ${
                isDanger
                  ? "text-red-900 dark:text-red-200"
                  : "text-blue-900 dark:text-blue-200"
              }`}
            >
              {title}
            </h3>

            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>

      {payables.length ===
      0 ? (
        <div className="p-5 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y">
          {payables.map(
            (payable) => (
              <div
                key={
                  payable.id
                }
                className="flex items-center justify-between gap-4 p-4 transition hover:bg-muted/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {
                      payable.description
                    }
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {
                      categoryLabels[
                        payable.category
                      ]
                    }
                  </p>

                  <p
                    className={`mt-1 text-xs ${
                      isDanger
                        ? "font-medium text-red-700 dark:text-red-300"
                        : "text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {formatReceivableDate(
                      payable.dueDate,
                    )}
                  </p>
                </div>

                <p
                  className={`shrink-0 font-bold ${
                    isDanger
                      ? "text-red-700 dark:text-red-300"
                      : "text-blue-700 dark:text-blue-300"
                  }`}
                >
                  {formatMoney(
                    payable.amount,
                  )}
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/*
 * ==========================
 * FILTROS
 * ==========================
 */

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;

  value: string;

  onChange:
    (
      value: string,
    ) => void;

  children:
    ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>

      <select
        value={value}
        onChange={(
          event,
        ) =>
          onChange(
            event.target.value,
          )
        }
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
      >
        {children}
      </select>
    </label>
  );
}

/*
 * ==========================
 * CARD DA CONTA
 * ==========================
 */

function PayableCard({
  payable,
}: {
  payable:
    OfficePayable;
}) {
  const effectiveStatus =
    getEffectiveFinancialStatus(
      payable.status,
      payable.dueDate,
    );

  const statusConfig =
    getStatusConfig(
      effectiveStatus,
    );

  const isCanceled =
    effectiveStatus ===
    "CANCELADO";

  const editablePayable: EditablePayable =
    {
      id:
        payable.id,

      description:
        payable.description,

      category:
        payable.category,

      amount:
        payable.amount,

      dueDate:
        toDateInputValue(
          payable.dueDate,
        ),

      paidAt:
        toDateInputValue(
          payable.paidAt,
        ),

      status:
        effectiveStatus,

      paymentMethod:
        payable.paymentMethod,

      notes:
        payable.notes ??
        "",
    };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-card p-4 transition hover:shadow-sm ${
        effectiveStatus ===
        "ATRASADO"
          ? "border-red-200 bg-red-50/20 dark:border-red-900 dark:bg-red-950/10"
          : effectiveStatus ===
              "PAGO"
            ? "border-emerald-200/70 dark:border-emerald-900"
            : effectiveStatus ===
                "PARCIAL"
              ? "border-blue-200 dark:border-blue-900"
              : "border-border"
      } ${
        isCanceled
          ? "opacity-70"
          : ""
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${statusConfig.accent}`}
      />

      <div className="pl-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`font-semibold ${
                  isCanceled
                    ? "line-through"
                    : ""
                }`}
              >
                {
                  payable.description
                }
              </h3>

              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                {
                  categoryLabels[
                    payable.category
                  ]
                }
              </span>
            </div>

            {payable.notes ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {
                  payable.notes
                }
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-start gap-3">
            <div className="text-right">
              <p
                className={`text-lg font-bold ${
                  effectiveStatus ===
                  "ATRASADO"
                    ? "text-red-700 dark:text-red-300"
                    : effectiveStatus ===
                        "PAGO"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-rose-700 dark:text-rose-300"
                } ${
                  isCanceled
                    ? "line-through"
                    : ""
                }`}
              >
                {formatMoney(
                  payable.amount,
                )}
              </p>

              <p className="text-xs text-muted-foreground">
                valor
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.className}`}
            >
              {
                statusConfig.label
              }
            </span>

            <PayableActionsMenu
              payable={
                editablePayable
              }
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
          <span
            className={`inline-flex items-center gap-1.5 ${
              effectiveStatus ===
              "ATRASADO"
                ? "font-medium text-red-700 dark:text-red-300"
                : ""
            }`}
          >
            <CalendarDays className="size-3.5" />

            Vencimento:{" "}
            {formatReceivableDate(
              payable.dueDate,
            )}
          </span>

          {payable.paidAt ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5" />

              Pago em:{" "}
              {formatReceivableDate(
                payable.paidAt,
              )}
            </span>
          ) : null}

          {payable.paymentMethod ? (
            <span>
              {
                paymentMethodLabels[
                  payable.paymentMethod
                ] ??
                payable.paymentMethod
              }
            </span>
          ) : null}

          {isCanceled ? (
            <span>
              Conta cancelada
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/*
 * ==========================
 * EMPTY STATE
 * ==========================
 */

function EmptyState({
  title,
  description,
}: {
  title: string;

  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <ReceiptText className="size-5" />
      </div>

      <p className="mt-3 font-medium">
        {title}
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/*
 * ==========================
 * ESTILOS DOS RESUMOS
 * ==========================
 */

function getSummaryStyles(
  tone:
    SummaryTone,
) {
  switch (tone) {
    case "payable":
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

    case "overdue":
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

    case "paid":
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

    case "forecast":
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

/*
 * ==========================
 * STATUS DA CONTA
 * ==========================
 */

function getStatusConfig(
  status:
    FinancialStatus,
) {
  switch (status) {
    case "PAGO":
      return {
        label:
          "Pago",

        className:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",

        accent:
          "bg-emerald-500",
      };

    case "ATRASADO":
      return {
        label:
          "Atrasado",

        className:
          "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",

        accent:
          "bg-red-500",
      };

    case "PARCIAL":
      return {
        label:
          "Parcial",

        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",

        accent:
          "bg-blue-500",
      };

    case "CANCELADO":
      return {
        label:
          "Cancelado",

        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",

        accent:
          "bg-gray-400",
      };

    default:
      return {
        label:
          "Pendente",

        className:
          "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",

        accent:
          "bg-rose-500",
      };
  }
}