"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Layers3,
} from "lucide-react";

import type { ClientDetails } from "@/features/clients/types";

import {
  formatReceivableDate,
  getDateTimestamp,
  getEffectiveFinancialStatus,
} from "../lib/receivable-display";

import type { ReceivableCaseOption } from "./create-receivable-form";
import { ReceivableCard } from "./receivable-card";

type ReceivableItem =
  ClientDetails["receivables"][number];

type Props = {
  receivables: ReceivableItem[];

  caseOptions?: ReceivableCaseOption[];
};

type GroupStatus =
  | "ATRASADO"
  | "PENDENTE"
  | "PAGO"
  | "CANCELADO";

const groupStatusMap: Record<
  GroupStatus,
  {
    label: string;
    badge: string;
  }
> = {
  ATRASADO: {
    label: "Em atraso",
    badge:
      "bg-red-100 text-red-800",
  },

  PENDENTE: {
    label: "Em aberto",
    badge:
      "bg-yellow-100 text-yellow-800",
  },

  PAGO: {
    label: "Quitado",
    badge:
      "bg-green-100 text-green-800",
  },

  CANCELADO: {
    label: "Cancelado",
    badge:
      "bg-gray-100 text-gray-700",
  },
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

function getGroupStatus(
  receivables: ReceivableItem[],
): GroupStatus {
  const statuses =
    receivables.map(
      (receivable) =>
        getEffectiveFinancialStatus(
          receivable.status,
          receivable.dueDate,
        ),
    );

  if (
    statuses.some(
      (status) =>
        status === "ATRASADO",
    )
  ) {
    return "ATRASADO";
  }

  if (
    statuses.some(
      (status) =>
        status === "PENDENTE" ||
        status === "PARCIAL",
    )
  ) {
    return "PENDENTE";
  }

  if (
    statuses.every(
      (status) =>
        status === "CANCELADO",
    )
  ) {
    return "CANCELADO";
  }

  return "PAGO";
}

function getNextOpenReceivable(
  receivables: ReceivableItem[],
): ReceivableItem | null {
  const openReceivables =
    receivables
      .filter(
        (receivable) => {
          const status =
            getEffectiveFinancialStatus(
              receivable.status,
              receivable.dueDate,
            );

          return (
            status !== "PAGO" &&
            status !== "CANCELADO"
          );
        },
      )
      .sort(
        (first, second) => {
          const firstDate =
            getDateTimestamp(
              first.dueDate,
            );

          const secondDate =
            getDateTimestamp(
              second.dueDate,
            );

          if (
            firstDate === null &&
            secondDate === null
          ) {
            return 0;
          }

          if (
            firstDate === null
          ) {
            return 1;
          }

          if (
            secondDate === null
          ) {
            return -1;
          }

          return (
            firstDate -
            secondDate
          );
        },
      );

  return (
    openReceivables[0] ??
    null
  );
}

export function InstallmentGroupCard({
  receivables,
  caseOptions = [],
}: Props) {
  const [expanded, setExpanded] =
    useState(false);

  const orderedReceivables =
    useMemo(
      () =>
        [...receivables].sort(
          (first, second) => {
            const firstNumber =
              first.installmentNumber ??
              Number.MAX_SAFE_INTEGER;

            const secondNumber =
              second.installmentNumber ??
              Number.MAX_SAFE_INTEGER;

            return (
              firstNumber -
              secondNumber
            );
          },
        ),
      [receivables],
    );

  const firstReceivable =
    orderedReceivables[0];

  if (!firstReceivable) {
    return null;
  }

  const groupStatus =
    getGroupStatus(
      orderedReceivables,
    );

  const statusStyle =
    groupStatusMap[
      groupStatus
    ];

  const expectedInstallments =
    orderedReceivables.reduce(
      (highest, item) =>
        Math.max(
          highest,
          item.totalInstallments ??
            0,
        ),
      orderedReceivables.length,
    );

  let originalTotal = 0;
  let activeTotal = 0;
  let totalReceived = 0;

  let paidCount = 0;
  let overdueCount = 0;
  let canceledCount = 0;
  let partialCount = 0;

  for (
    const receivable of
    orderedReceivables
  ) {
    const status =
      getEffectiveFinancialStatus(
        receivable.status,
        receivable.dueDate,
      );

    const totalAmount =
      Number(
        receivable.totalAmount,
      );

    const paidAmount =
      Number(
        receivable.paidAmount,
      );

    originalTotal +=
      totalAmount;

    totalReceived +=
      paidAmount;

    if (
      status !== "CANCELADO"
    ) {
      activeTotal +=
        totalAmount;
    }

    if (
      status === "PAGO"
    ) {
      paidCount += 1;
    }

    if (
      status === "ATRASADO"
    ) {
      overdueCount += 1;
    }

    if (
      status === "CANCELADO"
    ) {
      canceledCount += 1;
    }

    if (
      status === "PARCIAL"
    ) {
      partialCount += 1;
    }
  }

  const remainingAmount =
    Math.max(
      activeTotal -
        totalReceived,
      0,
    );

  const progress =
    activeTotal > 0
      ? Math.min(
          Math.max(
            (totalReceived /
              activeTotal) *
              100,
            0,
          ),
          100,
        )
      : 0;

  const nextReceivable =
    getNextOpenReceivable(
      orderedReceivables,
    );

  const nextStatus =
    nextReceivable
      ? getEffectiveFinancialStatus(
          nextReceivable.status,
          nextReceivable.dueDate,
        )
      : null;

  const isCanceled =
    groupStatus ===
    "CANCELADO";

  const hasMissingInstallments =
    orderedReceivables.length <
    expectedInstallments;

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        groupStatus ===
        "ATRASADO"
          ? "border-red-200"
          : ""
      } ${
        isCanceled
          ? "bg-muted/30 opacity-80"
          : "bg-card"
      }`}
    >
      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Layers3 className="size-4" />
              </div>

              <h3
                className={`font-semibold ${
                  isCanceled
                    ? "line-through"
                    : ""
                }`}
              >
                {
                  firstReceivable.description
                }
              </h3>

              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Parcelamento
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {paidCount} de{" "}
              {
                expectedInstallments
              }{" "}
              {expectedInstallments ===
              1
                ? "parcela paga"
                : "parcelas pagas"}
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.badge}`}
          >
            {statusStyle.label}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Total do
              parcelamento
            </p>

            <p
              className={`mt-1 text-lg font-semibold ${
                isCanceled
                  ? "line-through"
                  : ""
              }`}
            >
              {formatMoney(
                originalTotal,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Recebido
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatMoney(
                totalReceived,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Saldo em aberto
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatMoney(
                remainingAmount,
              )}
            </p>
          </div>
        </div>

        {!isCanceled ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-4 text-xs">
              <span className="text-muted-foreground">
                Progresso do
                recebimento
              </span>

              <span className="font-medium">
                {Math.round(
                  progress,
                )}
                %
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {paidCount > 0 ? (
            <span>
              {paidCount}{" "}
              {paidCount === 1
                ? "paga"
                : "pagas"}
            </span>
          ) : null}

          {overdueCount > 0 ? (
            <span className="font-medium text-red-700">
              {overdueCount}{" "}
              {overdueCount === 1
                ? "atrasada"
                : "atrasadas"}
            </span>
          ) : null}

          {partialCount > 0 ? (
            <span>
              {partialCount}{" "}
              {partialCount === 1
                ? "parcial"
                : "parciais"}
            </span>
          ) : null}

          {canceledCount > 0 ? (
            <span>
              {canceledCount}{" "}
              {canceledCount === 1
                ? "cancelada"
                : "canceladas"}
            </span>
          ) : null}

          {hasMissingInstallments ? (
            <span>
              {
                orderedReceivables.length
              }{" "}
              de{" "}
              {
                expectedInstallments
              }{" "}
              parcelas permanecem
              cadastradas
            </span>
          ) : null}
        </div>

        {nextReceivable ? (
          <div
            className={`mt-5 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              nextStatus ===
              "ATRASADO"
                ? "border-red-200 bg-red-50/40"
                : "bg-muted/30"
            }`}
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />

            <span>
              {nextStatus ===
              "ATRASADO"
                ? "Vencimento em atraso:"
                : "Próximo vencimento:"}{" "}
              <strong className="font-medium">
                {formatReceivableDate(
                  nextReceivable.dueDate,
                )}
              </strong>

              {nextReceivable.installmentNumber
                ? ` • Parcela ${nextReceivable.installmentNumber}/${expectedInstallments}`
                : ""}
            </span>
          </div>
        ) : null}

        <div className="mt-5 border-t pt-4">
          <button
            type="button"
            aria-expanded={
              expanded
            }
            onClick={() =>
              setExpanded(
                (current) =>
                  !current,
              )
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
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
      </div>

      {expanded ? (
        <div className="border-t bg-muted/20 p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold">
              Parcelas
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              As ações abaixo afetam
              somente a parcela
              selecionada.
            </p>
          </div>

          <div className="space-y-3">
            {orderedReceivables.map(
              (receivable) => (
                <ReceivableCard
                  key={
                    receivable.id
                  }
                  receivable={
                    receivable
                  }
                  caseOptions={
                    caseOptions
                  }
                />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}