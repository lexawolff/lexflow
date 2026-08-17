"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import type {
  FinancialStatus,
} from "@prisma/client";

import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Layers3,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import {
  formatReceivableDate,
  getDateTimestamp,
  getEffectiveFinancialStatus,
  toDateInputValue,
} from "../lib/receivable-display";

import type {
  OfficeFinancialClient,
  OfficeReceivable,
} from "../types/office-financial";

import type {
  EditableReceivable,
} from "./edit-receivable-form";

import {
  ReceivableActionsMenu,
} from "./receivable-actions-menu";

import type {
  ReceivableCaseOption,
} from "./create-receivable-form";

type Props = {
  receivables:
    OfficeReceivable[];

  clients:
    OfficeFinancialClient[];

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
  | "PROXIMOS_30_DIAS"
  | "SEM_VENCIMENTO";

type DisplayUnit =
  | {
      kind: "single";

      key: string;

      receivable:
        OfficeReceivable;
    }
  | {
      kind: "group";

      key: string;

      receivables:
        OfficeReceivable[];
    };

const statusOptions: {
  value: StatusFilter;

  label: string;
}[] = [
  {
    value: "TODOS",
    label: "Todos",
  },

  {
    value: "PENDENTE",
    label: "A receber",
  },

  {
    value: "ATRASADO",
    label: "Atrasados",
  },

  {
    value: "PAGO",
    label: "Pagos",
  },

  {
    value: "CANCELADO",
    label: "Cancelados",
  },
];

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
  receivable:
    OfficeReceivable,

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
      receivable.status,
      receivable.dueDate,
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
  receivable:
    OfficeReceivable,

  filter:
    PeriodFilter,

  todayKey: string,
): boolean {
  if (
    filter === "TODOS"
  ) {
    return true;
  }

  if (
    filter ===
    "SEM_VENCIMENTO"
  ) {
    return !receivable.dueDate;
  }

  const dueTimestamp =
    getDateTimestamp(
      receivable.dueDate,
    );

  if (
    dueTimestamp === null
  ) {
    return false;
  }

  if (
    filter === "ESTE_MES"
  ) {
    const dueMonth =
      receivable.dueDate?.slice(
        0,
        7,
      );

    return (
      dueMonth ===
      todayKey.slice(
        0,
        7,
      )
    );
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

function buildDisplayUnits(
  receivables:
    OfficeReceivable[],
): DisplayUnit[] {
  const singles:
    OfficeReceivable[] = [];

  const groups =
    new Map<
      string,
      OfficeReceivable[]
    >();

  for (
    const receivable of
    receivables
  ) {
    if (
      !receivable.installmentGroupId
    ) {
      singles.push(
        receivable,
      );

      continue;
    }

    const existing =
      groups.get(
        receivable.installmentGroupId,
      );

    if (existing) {
      existing.push(
        receivable,
      );
    } else {
      groups.set(
        receivable.installmentGroupId,
        [
          receivable,
        ],
      );
    }
  }

  const units:
    DisplayUnit[] =
      singles.map(
        (receivable) => ({
          kind: "single",

          key:
            receivable.id,

          receivable,
        }),
      );

  for (
    const [
      groupId,
      groupReceivables,
    ] of groups
  ) {
    units.push({
      kind: "group",

      key: groupId,

      receivables:
        groupReceivables,
    });
  }

  return units;
}

function getUnitTimestamp(
  unit: DisplayUnit,
): number {
  if (
    unit.kind ===
    "single"
  ) {
    return (
      getDateTimestamp(
        unit.receivable.dueDate,
      ) ??
      Number.MAX_SAFE_INTEGER
    );
  }

  const timestamps =
    unit.receivables
      .map(
        (receivable) =>
          getDateTimestamp(
            receivable.dueDate,
          ),
      )
      .filter(
        (
          value,
        ): value is number =>
          value !== null,
      );

  if (
    timestamps.length ===
    0
  ) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.min(
    ...timestamps,
  );
}

function getCaseOptionsForClient(
  clientId: string,

  clients:
    OfficeFinancialClient[],
): ReceivableCaseOption[] {
  const client =
    clients.find(
      (item) =>
        item.id ===
        clientId,
    );

  return (
    client?.cases ?? []
  );
}

function toEditableReceivable(
  receivable:
    OfficeReceivable,
): EditableReceivable {
  const effectiveStatus =
    getEffectiveFinancialStatus(
      receivable.status,
      receivable.dueDate,
    );

  return {
    id:
      receivable.id,

    caseId:
      receivable.caseId,

    description:
      receivable.description,

    type:
      receivable.type,

    totalAmount:
      receivable.totalAmount,

    dueDate:
      toDateInputValue(
        receivable.dueDate,
      ),

    notes:
      receivable.notes ?? "",

    status:
      effectiveStatus,

    installmentGroupId:
      receivable.installmentGroupId,

    installmentNumber:
      receivable.installmentNumber,

    totalInstallments:
      receivable.totalInstallments,
  };
}

export function OfficeReceivablesList({
  receivables,
  clients,
  todayKey,
}: Props) {
  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "TODOS",
    );

  const [
    clientFilter,
    setClientFilter,
  ] =
    useState("TODOS");

  const [
    periodFilter,
    setPeriodFilter,
  ] =
    useState<PeriodFilter>(
      "TODOS",
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const normalizedSearch =
    search
      .trim()
      .toLocaleLowerCase(
        "pt-BR",
      );

  const filtered =
    useMemo(
      () =>
        receivables.filter(
          (receivable) => {
            if (
              clientFilter !==
                "TODOS" &&
              receivable.clientId !==
                clientFilter
            ) {
              return false;
            }

            if (
              !matchesStatus(
                receivable,
                statusFilter,
              )
            ) {
              return false;
            }

            if (
              !matchesPeriod(
                receivable,
                periodFilter,
                todayKey,
              )
            ) {
              return false;
            }

            if (
              normalizedSearch
            ) {
              const content = [
                receivable.clientName,

                receivable.description,

                receivable.caseTitle ??
                  "",

                receivable.caseNumber ??
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
        ),
      [
        receivables,
        clientFilter,
        statusFilter,
        periodFilter,
        todayKey,
        normalizedSearch,
      ],
    );

  const displayUnits =
    useMemo(() => {
      if (
        statusFilter !==
        "TODOS"
      ) {
        return filtered
          .map(
            (
              receivable,
            ): DisplayUnit => ({
              kind: "single",

              key:
                receivable.id,

              receivable,
            }),
          )
          .sort(
            (
              first,
              second,
            ) =>
              getUnitTimestamp(
                first,
              ) -
              getUnitTimestamp(
                second,
              ),
          );
      }

      return buildDisplayUnits(
        filtered,
      ).sort(
        (
          first,
          second,
        ) =>
          getUnitTimestamp(
            first,
          ) -
          getUnitTimestamp(
            second,
          ),
      );
    }, [
      filtered,
      statusFilter,
    ]);

  const hasFilters =
    clientFilter !==
      "TODOS" ||
    statusFilter !==
      "TODOS" ||
    periodFilter !==
      "TODOS" ||
    Boolean(search);

  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CircleDollarSign className="size-5" />
        </div>

        <div>
          <h2 className="text-lg font-semibold">
            Recebimentos
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Consulte e gerencie os
            lançamentos de todos os
            clientes do escritório.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-card dark:border-emerald-900">
        <div className="border-b bg-emerald-50/40 p-4 dark:bg-emerald-950/10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-emerald-700 dark:text-emerald-300" />

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
              placeholder="Buscar por cliente, cobrança ou processo..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <FilterSelect
              label="Cliente"
              value={
                clientFilter
              }
              onChange={
                setClientFilter
              }
            >
              <option value="TODOS">
                Todos os clientes
              </option>

              {clients.map(
                (client) => (
                  <option
                    key={
                      client.id
                    }
                    value={
                      client.id
                    }
                  >
                    {
                      client.name
                    }
                  </option>
                ),
              )}
            </FilterSelect>

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
              {statusOptions.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
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

              <option value="SEM_VENCIMENTO">
                Sem vencimento
              </option>
            </FilterSelect>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {displayUnits.length ===
          1
            ? "1 resultado"
            : `${displayUnits.length} resultados`}
        </p>

        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setClientFilter(
                "TODOS",
              );

              setStatusFilter(
                "TODOS",
              );

              setPeriodFilter(
                "TODOS",
              );

              setSearch("");
            }}
            className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline dark:text-emerald-300"
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      {displayUnits.length ===
      0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Search className="size-5" />
          </div>

          <p className="mt-3 font-medium">
            Nenhum recebimento
            encontrado.
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Tente alterar os filtros
            utilizados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayUnits.map(
            (unit) => {
              if (
                unit.kind ===
                "group"
              ) {
                return (
                  <OfficeInstallmentGroup
                    key={
                      unit.key
                    }
                    receivables={
                      unit.receivables
                    }
                    clients={
                      clients
                    }
                  />
                );
              }

              return (
                <OfficeReceivableCard
                  key={
                    unit.key
                  }
                  receivable={
                    unit.receivable
                  }
                  clients={
                    clients
                  }
                />
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;

  value: string;

  onChange:
    (value: string) => void;

  children:
    React.ReactNode;
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
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
      >
        {children}
      </select>
    </label>
  );
}

function OfficeReceivableCard({
  receivable,
  clients,
}: {
  receivable:
    OfficeReceivable;

  clients:
    OfficeFinancialClient[];
}) {
  const status =
    getEffectiveFinancialStatus(
      receivable.status,
      receivable.dueDate,
    );

  const remaining =
    Math.max(
      receivable.totalAmount -
        receivable.paidAmount,
      0,
    );

  const statusConfig =
    getStatusConfig(
      status,
    );

  const editableReceivable =
    toEditableReceivable(
      receivable,
    );

  const caseOptions =
    getCaseOptionsForClient(
      receivable.clientId,
      clients,
    );

  const isCanceled =
    status ===
    "CANCELADO";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-card p-4 transition hover:shadow-sm ${
        status === "ATRASADO"
          ? "border-red-200 bg-red-50/20 dark:border-red-900 dark:bg-red-950/10"
          : status === "PAGO"
            ? "border-emerald-200/70 dark:border-emerald-900"
            : status === "PARCIAL"
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5">
                <UserRound className="size-3.5 text-muted-foreground" />

                <Link
                  href={`/clientes/${receivable.clientId}`}
                  className="font-semibold hover:underline"
                >
                  {
                    receivable.clientName
                  }
                </Link>
              </div>

              {receivable.installmentNumber &&
              receivable.totalInstallments ? (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Parcela{" "}
                  {
                    receivable.installmentNumber
                  }
                  /
                  {
                    receivable.totalInstallments
                  }
                </span>
              ) : null}
            </div>

            <p
              className={`mt-2 text-sm font-medium ${
                isCanceled
                  ? "line-through"
                  : ""
              }`}
            >
              {
                receivable.description
              }
            </p>

            {receivable.caseId &&
            receivable.caseTitle ? (
              <Link
                href={`/casos/${receivable.caseId}`}
                className="mt-1 inline-block text-xs text-muted-foreground transition hover:text-foreground hover:underline"
              >
                {
                  receivable.caseTitle
                }

                {receivable.caseNumber
                  ? ` • ${receivable.caseNumber}`
                  : ""}
              </Link>
            ) : null}
          </div>

          <div className="flex shrink-0 items-start gap-3">
            <div className="text-right">
              <p
                className={`text-lg font-bold ${
                  status ===
                  "ATRASADO"
                    ? "text-red-700 dark:text-red-300"
                    : status ===
                        "PAGO"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : ""
                }`}
              >
                {formatMoney(
                  status ===
                    "PAGO"
                    ? receivable.paidAmount
                    : remaining,
                )}
              </p>

              <p className="text-xs text-muted-foreground">
                {status ===
                "PAGO"
                  ? "recebido"
                  : "saldo"}
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.className}`}
            >
              {
                statusConfig.label
              }
            </span>

            <ReceivableActionsMenu
              receivable={
                editableReceivable
              }
              caseOptions={
                caseOptions
              }
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
          <span
            className={`inline-flex items-center gap-1.5 ${
              status ===
              "ATRASADO"
                ? "font-medium text-red-700 dark:text-red-300"
                : ""
            }`}
          >
            <CalendarDays className="size-3.5" />

            Vencimento:{" "}
            {formatReceivableDate(
              receivable.dueDate,
            )}
          </span>

          {receivable.receivedAt ? (
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              Recebido em:{" "}
              {formatReceivableDate(
                receivable.receivedAt,
              )}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OfficeInstallmentGroup({
  receivables,
  clients,
}: {
  receivables:
    OfficeReceivable[];

  clients:
    OfficeFinancialClient[];
}) {
  const [
    expanded,
    setExpanded,
  ] =
    useState(false);

  const ordered =
    [...receivables].sort(
      (
        first,
        second,
      ) =>
        (first.installmentNumber ??
          0) -
        (second.installmentNumber ??
          0),
    );

  const first =
    ordered[0];

  if (!first) {
    return null;
  }

  const expectedInstallments =
    Math.max(
      ...ordered.map(
        (receivable) =>
          receivable.totalInstallments ??
          ordered.length,
      ),
    );

  let total = 0;
  let received = 0;
  let paidCount = 0;
  let overdueCount = 0;
  let canceledCount = 0;

  for (
    const receivable of
    ordered
  ) {
    const status =
      getEffectiveFinancialStatus(
        receivable.status,
        receivable.dueDate,
      );

    if (
      status !==
      "CANCELADO"
    ) {
      total +=
        receivable.totalAmount;
    }

    received +=
      receivable.paidAmount;

    if (
      status === "PAGO"
    ) {
      paidCount += 1;
    }

    if (
      status ===
      "ATRASADO"
    ) {
      overdueCount += 1;
    }

    if (
      status ===
      "CANCELADO"
    ) {
      canceledCount += 1;
    }
  }

  const remaining =
    Math.max(
      total - received,
      0,
    );

  const progress =
    total > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (received / total) *
              100,
          ),
        )
      : 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-card ${
        overdueCount > 0
          ? "border-red-200 dark:border-red-900"
          : "border-emerald-200/70 dark:border-emerald-900"
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${
          overdueCount > 0
            ? "bg-red-500"
            : "bg-emerald-500"
        }`}
      />

      <div className="p-5 pl-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`flex size-8 items-center justify-center rounded-lg ${
                  overdueCount > 0
                    ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                }`}
              >
                <Layers3 className="size-4" />
              </div>

              <Link
                href={`/clientes/${first.clientId}`}
                className="font-semibold hover:underline"
              >
                {
                  first.clientName
                }
              </Link>

              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Parcelamento
              </span>
            </div>

            <p className="mt-3 text-sm font-medium">
              {
                first.description
              }
            </p>

            {first.caseId &&
            first.caseTitle ? (
              <Link
                href={`/casos/${first.caseId}`}
                className="mt-1 inline-block text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {
                  first.caseTitle
                }

                {first.caseNumber
                  ? ` • ${first.caseNumber}`
                  : ""}
              </Link>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                {paidCount} de{" "}
                {
                  expectedInstallments
                }{" "}
                pagas
              </span>

              {overdueCount > 0 ? (
                <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  {overdueCount}{" "}
                  {overdueCount ===
                  1
                    ? "atrasada"
                    : "atrasadas"}
                </span>
              ) : null}

              {canceledCount > 0 ? (
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  {canceledCount}{" "}
                  {canceledCount ===
                  1
                    ? "cancelada"
                    : "canceladas"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="text-left lg:text-right">
            <p
              className={`text-xl font-bold ${
                overdueCount > 0
                  ? "text-red-700 dark:text-red-300"
                  : "text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {formatMoney(
                remaining,
              )}
            </p>

            <p className="text-xs text-muted-foreground">
              saldo em aberto
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <GroupMetric
            label="Total"
            value={
              formatMoney(
                total,
              )
            }
            tone="neutral"
          />

          <GroupMetric
            label="Recebido"
            value={
              formatMoney(
                received,
              )
            }
            tone="income"
          />

          <GroupMetric
            label="Saldo"
            value={
              formatMoney(
                remaining,
              )
            }
            tone={
              overdueCount > 0
                ? "danger"
                : "open"
            }
          />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-muted-foreground">
              Progresso do
              recebimento
            </span>

            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              {Math.round(
                progress,
              )}
              %
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setExpanded(
              (current) =>
                !current,
            )
          }
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-300"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-4" />
              Ocultar parcelas
            </>
          ) : (
            <>
              <ChevronDown className="size-4" />
              Ver parcelas
            </>
          )}
        </button>
      </div>

      {expanded ? (
        <div className="space-y-3 border-t bg-muted/20 p-4">
          {ordered.map(
            (receivable) => (
              <OfficeReceivableCard
                key={
                  receivable.id
                }
                receivable={
                  receivable
                }
                clients={
                  clients
                }
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function GroupMetric({
  label,
  value,
  tone,
}: {
  label: string;

  value: string;

  tone:
    | "neutral"
    | "income"
    | "open"
    | "danger";
}) {
  const styles = {
    neutral:
      "bg-muted/40",

    income:
      "bg-emerald-50/70 dark:bg-emerald-950/20",

    open:
      "bg-blue-50/70 dark:bg-blue-950/20",

    danger:
      "bg-red-50/70 dark:bg-red-950/20",
  };

  const valueStyles = {
    neutral: "",

    income:
      "text-emerald-700 dark:text-emerald-300",

    open:
      "text-blue-700 dark:text-blue-300",

    danger:
      "text-red-700 dark:text-red-300",
  };

  return (
    <div
      className={`rounded-xl p-3 ${styles[tone]}`}
    >
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-1 font-bold ${valueStyles[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}

function getStatusConfig(
  status:
    FinancialStatus,
) {
  switch (status) {
    case "PAGO":
      return {
        label: "Pago",

        className:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",

        accent:
          "bg-emerald-500",
      };

    case "ATRASADO":
      return {
        label: "Atrasado",

        className:
          "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",

        accent:
          "bg-red-500",
      };

    case "PARCIAL":
      return {
        label: "Parcial",

        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",

        accent:
          "bg-blue-500",
      };

    case "CANCELADO":
      return {
        label: "Cancelado",

        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",

        accent:
          "bg-gray-400",
      };

    default:
      return {
        label: "Pendente",

        className:
          "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",

        accent:
          "bg-amber-500",
      };
  }
}