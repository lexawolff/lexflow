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
  RpvStatus,
  RpvType,
} from "@prisma/client";

import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Landmark,
  Search,
  SlidersHorizontal,
  UserRound,
  WalletCards,
} from "lucide-react";

import {
  formatReceivableDate,
  toDateInputValue,
} from "../lib/receivable-display";

import type {
  OfficeRpvData,
  OfficeRpvRecord,
} from "../types/office-rpv";

import {
  CreateRpvDialog,
} from "./create-rpv-dialog";

import {
  RpvActionsMenu,
  type EditableRpv,
} from "./rpv-actions-menu";

type Props = {
  data:
    OfficeRpvData;
};

type StatusFilter =
  | "TODOS"
  | RpvStatus;

type TypeFilter =
  | "TODOS"
  | RpvType;

const statusLabels: Record<
  RpvStatus,
  string
> = {
  AGUARDANDO_EXPEDICAO:
    "Aguardando expedição",

  EXPEDIDA:
    "Expedida",

  AUTUADA:
    "Autuada",

  LIBERADA:
    "Liberada",

  PAGA:
    "Paga",

  CANCELADA:
    "Cancelada",
};

const typeLabels: Record<
  RpvType,
  string
> = {
  RPV:
    "RPV",

  PRECATORIO:
    "Precatório",
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

function getContractualFee(
  rpv:
    OfficeRpvRecord,
): number {
  if (
    rpv.contractualFeeValue !==
    null
  ) {
    return rpv.contractualFeeValue;
  }

  if (
    rpv.contractualFeeRate !==
    null
  ) {
    return (
      rpv.grossAmount *
      (rpv.contractualFeeRate /
        100)
    );
  }

  return 0;
}

function getOfficeFees(
  rpv:
    OfficeRpvRecord,
): number {
  return (
    getContractualFee(
      rpv,
    ) +
    (rpv.sucumbencyFeeValue ??
      0)
  );
}

function toEditableRpv(
  rpv:
    OfficeRpvRecord,
): EditableRpv {
  return {
    id:
      rpv.id,

    type:
      rpv.type,

    requisitionNumber:
      rpv.requisitionNumber ??
      "",

    court:
      rpv.court ?? "",

    grossAmount:
      rpv.grossAmount,

    contractualFeeRate:
      rpv.contractualFeeRate ??
      0,

    contractualFeeValue:
      rpv.contractualFeeValue ??
      0,

    sucumbencyFeeValue:
      rpv.sucumbencyFeeValue ??
      0,

    expectedPaymentDate:
      toDateInputValue(
        rpv.expectedPaymentDate,
      ),

    paidAt:
      toDateInputValue(
        rpv.paidAt,
      ),

    bank:
      rpv.bank ?? "",

    status:
      rpv.status,

    notes:
      rpv.notes ?? "",
  };
}

export function OfficeRpvDashboard({
  data,
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
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>(
      "TODOS",
    );

  /*
   * ==========================
   * RESUMO
   * ==========================
   */

  let waitingIssueAmount =
    0;

  let waitingIssueCount =
    0;

  let processingAmount =
    0;

  let processingCount =
    0;

  let releasedAmount =
    0;

  let releasedCount =
    0;

  let feesPaidThisYear =
    0;

  let paidThisYearCount =
    0;

  const currentYear =
    data.todayKey.slice(
      0,
      4,
    );

  for (
    const rpv of
    data.rpvs
  ) {
    if (
      rpv.status ===
      "CANCELADA"
    ) {
      continue;
    }

    if (
      rpv.status ===
      "AGUARDANDO_EXPEDICAO"
    ) {
      waitingIssueAmount +=
        rpv.grossAmount;

      waitingIssueCount +=
        1;
    }

    if (
      rpv.status ===
        "EXPEDIDA" ||
      rpv.status ===
        "AUTUADA"
    ) {
      processingAmount +=
        rpv.grossAmount;

      processingCount +=
        1;
    }

    if (
      rpv.status ===
      "LIBERADA"
    ) {
      releasedAmount +=
        rpv.grossAmount;

      releasedCount +=
        1;
    }

    if (
      rpv.status ===
        "PAGA" &&
      rpv.paidAt?.startsWith(
        currentYear,
      )
    ) {
      feesPaidThisYear +=
        getOfficeFees(
          rpv,
        );

      paidThisYearCount +=
        1;
    }
  }

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
        data.rpvs
          .filter(
            (rpv) => {
              if (
                statusFilter !==
                  "TODOS" &&
                rpv.status !==
                  statusFilter
              ) {
                return false;
              }

              if (
                typeFilter !==
                  "TODOS" &&
                rpv.type !==
                  typeFilter
              ) {
                return false;
              }

              if (
                !normalizedSearch
              ) {
                return true;
              }

              const content = [
                rpv.clientName,

                rpv.caseTitle,

                rpv.caseNumber ??
                  "",

                rpv.requisitionNumber ??
                  "",

                rpv.court ??
                  "",

                rpv.bank ??
                  "",

                rpv.notes ??
                  "",
              ]
                .join(" ")
                .toLocaleLowerCase(
                  "pt-BR",
                );

              return content.includes(
                normalizedSearch,
              );
            },
          )
          .sort(
            (
              first,
              second,
            ) =>
              getStatusPriority(
                first.status,
              ) -
              getStatusPriority(
                second.status,
              ),
          ),
      [
        data.rpvs,
        normalizedSearch,
        statusFilter,
        typeFilter,
      ],
    );

  const hasFilters =
    Boolean(search) ||
    statusFilter !==
      "TODOS" ||
    typeFilter !==
      "TODOS";

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
              <Landmark className="size-5" />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                RPVs e Precatórios
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Acompanhe requisições,
                pagamentos e
                honorários vinculados
                aos processos.
              </p>
            </div>
          </div>

          <CreateRpvDialog
            cases={
              data.cases
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="A expedir"
            value={
              waitingIssueAmount
            }
            description={
              waitingIssueCount ===
              1
                ? "1 requisição aguardando expedição"
                : `${waitingIssueCount} requisições aguardando expedição`
            }
            icon={
              <Clock3 className="size-5" />
            }
            tone="amber"
          />

          <SummaryCard
            title="Aguardando pagamento"
            value={
              processingAmount
            }
            description={
              processingCount ===
              1
                ? "1 requisição em tramitação"
                : `${processingCount} requisições em tramitação`
            }
            icon={
              <CalendarClock className="size-5" />
            }
            tone="blue"
          />

          <SummaryCard
            title="Liberado"
            value={
              releasedAmount
            }
            description={
              releasedCount ===
              1
                ? "1 valor disponível"
                : `${releasedCount} valores disponíveis`
            }
            icon={
              <WalletCards className="size-5" />
            }
            tone="emerald"
          />

          <SummaryCard
            title="Honorários no ano"
            value={
              feesPaidThisYear
            }
            description={
              paidThisYearCount ===
              1
                ? "1 requisição paga no ano"
                : `${paidThisYearCount} requisições pagas no ano`
            }
            icon={
              <CircleDollarSign className="size-5" />
            }
            tone="violet"
          />
        </div>
      </section>

      <section className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-violet-200/70 bg-card dark:border-violet-900">
          <div className="border-b bg-violet-50/40 p-4 dark:bg-violet-950/10">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-violet-700 dark:text-violet-300" />

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
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Buscar cliente, processo, requisição, tribunal..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FilterSelect
                label="Tipo"
                value={typeFilter}
                onChange={(value) =>
                  setTypeFilter(
                    value as TypeFilter,
                  )
                }
              >
                <option value="TODOS">
                  RPVs e Precatórios
                </option>

                <option value="RPV">
                  Somente RPVs
                </option>

                <option value="PRECATORIO">
                  Somente Precatórios
                </option>
              </FilterSelect>

              <FilterSelect
                label="Situação"
                value={
                  statusFilter
                }
                onChange={(value) =>
                  setStatusFilter(
                    value as StatusFilter,
                  )
                }
              >
                <option value="TODOS">
                  Todas
                </option>

                {Object.entries(
                  statusLabels,
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
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

                setTypeFilter(
                  "TODOS",
                );
              }}
              className="text-sm font-semibold text-violet-700 hover:underline dark:text-violet-300"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>

        {data.rpvs.length ===
        0 ? (
          <EmptyState />
        ) : filtered.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="font-medium">
              Nenhuma requisição
              encontrada.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Tente alterar os filtros
              utilizados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(
              (rpv) => (
                <RpvCard
                  key={rpv.id}
                  rpv={rpv}
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function RpvCard({
  rpv,
}: {
  rpv:
    OfficeRpvRecord;
}) {
  const statusStyle =
    getStatusStyle(
      rpv.status,
    );

  const contractualFee =
    getContractualFee(
      rpv,
    );

  const sucumbencyFee =
    rpv.sucumbencyFeeValue ??
    0;

  const officeFees =
    contractualFee +
    sucumbencyFee;

  const clientNet =
    rpv.clientNetAmount ??
    Math.max(
      rpv.grossAmount -
        contractualFee,
      0,
    );

  const isCanceled =
    rpv.status ===
    "CANCELADA";

  const editableRpv =
    toEditableRpv(
      rpv,
    );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-card p-5 transition hover:shadow-sm ${statusStyle.border} ${
        isCanceled
          ? "opacity-70"
          : ""
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${statusStyle.accent}`}
      />

      <div className="pl-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  rpv.type ===
                  "PRECATORIO"
                    ? "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                }`}
              >
                {
                  typeLabels[
                    rpv.type
                  ]
                }
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.badge}`}
              >
                {
                  statusLabels[
                    rpv.status
                  ]
                }
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <UserRound className="size-4 text-muted-foreground" />

              <Link
                href={`/clientes/${rpv.clientId}`}
                className="font-semibold hover:underline"
              >
                {
                  rpv.clientName
                }
              </Link>
            </div>

            <Link
              href={`/casos/${rpv.caseId}`}
              className="mt-1 block text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {
                rpv.caseTitle
              }

              {rpv.caseNumber
                ? ` • ${rpv.caseNumber}`
                : ""}
            </Link>

            {(rpv.requisitionNumber ||
              rpv.court) ? (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                {rpv.requisitionNumber ? (
                  <span>
                    Requisição:{" "}
                    <strong className="font-medium text-foreground">
                      {
                        rpv.requisitionNumber
                      }
                    </strong>
                  </span>
                ) : null}

                {rpv.court ? (
                  <span>
                    Tribunal:{" "}
                    <strong className="font-medium text-foreground">
                      {
                        rpv.court
                      }
                    </strong>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-start gap-3">
            <div className="lg:text-right">
              <p className="text-xs text-muted-foreground">
                Crédito bruto
              </p>

              <p
                className={`mt-1 text-2xl font-bold ${
                  isCanceled
                    ? "line-through"
                    : ""
                }`}
              >
                {formatMoney(
                  rpv.grossAmount,
                )}
              </p>
            </div>

            <RpvActionsMenu
              rpv={
                editableRpv
              }
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FinancialMetric
            label="Honorários contratuais"
            value={
              contractualFee
            }
            description={
              rpv.contractualFeeRate !==
              null
                ? `${rpv.contractualFeeRate.toLocaleString(
                    "pt-BR",
                    {
                      maximumFractionDigits:
                        2,
                    },
                  )}% do crédito`
                : null
            }
            tone="violet"
          />

          <FinancialMetric
            label="Sucumbenciais"
            value={
              sucumbencyFee
            }
            tone="blue"
          />

          <FinancialMetric
            label="Honorários do escritório"
            value={
              officeFees
            }
            tone="emerald"
          />

          <FinancialMetric
            label="Líquido do cliente"
            value={
              clientNet
            }
            tone="neutral"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
          {rpv.expectedPaymentDate ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5" />

              Previsão:{" "}
              {formatReceivableDate(
                rpv.expectedPaymentDate,
              )}
            </span>
          ) : null}

          {rpv.paidAt ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5" />

              Pago em:{" "}
              {formatReceivableDate(
                rpv.paidAt,
              )}
            </span>
          ) : null}

          {rpv.bank ? (
            <span className="inline-flex items-center gap-1.5">
              <Landmark className="size-3.5" />

              {rpv.bank}
            </span>
          ) : null}
        </div>

        {rpv.notes ? (
          <div className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {rpv.notes}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FinancialMetric({
  label,
  value,
  description,
  tone,
}: {
  label: string;

  value: number;

  description?:
    string | null;

  tone:
    | "violet"
    | "blue"
    | "emerald"
    | "neutral";
}) {
  const styles = {
    violet:
      "bg-violet-50/70 text-violet-800 dark:bg-violet-950/20 dark:text-violet-300",

    blue:
      "bg-blue-50/70 text-blue-800 dark:bg-blue-950/20 dark:text-blue-300",

    emerald:
      "bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300",

    neutral:
      "bg-muted/40 text-foreground",
  };

  return (
    <div
      className={`rounded-xl p-3 ${styles[tone]}`}
    >
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 font-bold">
        {formatMoney(value)}
      </p>

      {description ? (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

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

  tone:
    | "amber"
    | "blue"
    | "emerald"
    | "violet";
}) {
  const styles = {
    amber: {
      container:
        "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/15",

      accent:
        "bg-amber-500",

      text:
        "text-amber-800 dark:text-amber-300",

      icon:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    },

    blue: {
      container:
        "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/15",

      accent:
        "bg-blue-500",

      text:
        "text-blue-800 dark:text-blue-300",

      icon:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    },

    emerald: {
      container:
        "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/15",

      accent:
        "bg-emerald-500",

      text:
        "text-emerald-800 dark:text-emerald-300",

      icon:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    },

    violet: {
      container:
        "border-violet-200 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/15",

      accent:
        "bg-violet-500",

      text:
        "text-violet-800 dark:text-violet-300",

      icon:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
    },
  }[tone];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 ${styles.container}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`}
      />

      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-sm font-semibold ${styles.text}`}
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
        className={`mt-5 text-2xl font-bold tracking-tight ${styles.text}`}
      >
        {formatMoney(value)}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
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
    ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
      >
        {children}
      </select>
    </label>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
        <Banknote className="size-6" />
      </div>

      <p className="mt-4 font-semibold">
        Nenhuma RPV ou precatório
        cadastrado.
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        Cadastre as requisições dos
        processos para acompanhar
        expedição, pagamento e
        honorários.
      </p>
    </div>
  );
}

function getStatusPriority(
  status:
    RpvStatus,
): number {
  switch (status) {
    case "LIBERADA":
      return 0;

    case "AGUARDANDO_EXPEDICAO":
      return 1;

    case "EXPEDIDA":
      return 2;

    case "AUTUADA":
      return 3;

    case "PAGA":
      return 4;

    case "CANCELADA":
      return 5;
  }
}

function getStatusStyle(
  status:
    RpvStatus,
) {
  switch (status) {
    case "AGUARDANDO_EXPEDICAO":
      return {
        border:
          "border-amber-200 dark:border-amber-900",

        accent:
          "bg-amber-500",

        badge:
          "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
      };

    case "EXPEDIDA":
      return {
        border:
          "border-blue-200 dark:border-blue-900",

        accent:
          "bg-blue-500",

        badge:
          "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
      };

    case "AUTUADA":
      return {
        border:
          "border-indigo-200 dark:border-indigo-900",

        accent:
          "bg-indigo-500",

        badge:
          "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300",
      };

    case "LIBERADA":
      return {
        border:
          "border-emerald-200 dark:border-emerald-900",

        accent:
          "bg-emerald-500",

        badge:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
      };

    case "PAGA":
      return {
        border:
          "border-teal-200 dark:border-teal-900",

        accent:
          "bg-teal-500",

        badge:
          "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300",
      };

    case "CANCELADA":
      return {
        border:
          "border-border",

        accent:
          "bg-gray-400",

        badge:
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      };
  }
}