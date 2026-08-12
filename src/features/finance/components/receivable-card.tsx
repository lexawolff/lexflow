import type {
  FinancialStatus,
  Receivable,
} from "@prisma/client";

import {
  Ban,
  CalendarDays,
  CircleCheck,
  CircleDollarSign,
} from "lucide-react";

import type { ReceivableCaseOption } from "./create-receivable-form";
import type { EditableReceivable } from "./edit-receivable-form";
import { ReceivableActionsMenu } from "./receivable-actions-menu";

import {
  formatReceivableDate,
  getEffectiveFinancialStatus,
  toDateInputValue,
} from "../lib/receivable-display";

type ReceivableWithSerializableDates =
  Omit<
    Receivable,
    | "dueDate"
    | "receivedAt"
  > & {
    dueDate:
      | Date
      | string
      | null;

    receivedAt:
      | Date
      | string
      | null;
  };

type Props = {
  receivable:
    ReceivableWithSerializableDates;

  caseOptions?:
    ReceivableCaseOption[];
};

const statusMap = {
  PENDENTE: {
    label: "Pendente",
    badge:
      "bg-yellow-100 text-yellow-800",
  },

  PAGO: {
    label: "Pago",
    badge:
      "bg-green-100 text-green-800",
  },

  ATRASADO: {
    label: "Atrasado",
    badge:
      "bg-red-100 text-red-800",
  },

  PARCIAL: {
    label: "Parcial",
    badge:
      "bg-blue-100 text-blue-800",
  },

  CANCELADO: {
    label: "Cancelado",
    badge:
      "bg-gray-100 text-gray-700",
  },
} satisfies Record<
  FinancialStatus,
  {
    label: string;
    badge: string;
  }
>;

const paymentMethodLabels: Record<
  string,
  string
> = {
  PIX: "PIX",

  DINHEIRO: "Dinheiro",

  CARTAO: "Cartão",

  TRANSFERENCIA:
    "Transferência",

  DEPOSITO: "Depósito",

  BOLETO: "Boleto",

  OUTRO: "Outro",
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

export function ReceivableCard({
  receivable,
  caseOptions = [],
}: Props) {
  const effectiveStatus =
    getEffectiveFinancialStatus(
      receivable.status,
      receivable.dueDate,
    );

  const status =
    statusMap[
      effectiveStatus
    ];

  const totalAmount =
    Number(
      receivable.totalAmount,
    );

  const paidAmount =
    Number(
      receivable.paidAmount,
    );

  const remainingAmount =
    Math.max(
      totalAmount -
        paidAmount,
      0,
    );

  const editableReceivable: EditableReceivable =
    {
      id:
        receivable.id,

      caseId:
        receivable.caseId,

      description:
        receivable.description,

      type:
        receivable.type,

      totalAmount,

      dueDate:
        toDateInputValue(
          receivable.dueDate,
        ),

      notes:
        receivable.notes ?? "",

      /*
       * Usamos o status visual para
       * que uma cobrança vencida
       * também se comporte como
       * ATRASADO no menu.
       */
      status:
        effectiveStatus,

      installmentGroupId:
        receivable.installmentGroupId,

      installmentNumber:
        receivable.installmentNumber,

      totalInstallments:
        receivable.totalInstallments,
    };

  const isPaid =
    effectiveStatus ===
    "PAGO";

  const isPartial =
    effectiveStatus ===
    "PARCIAL";

  const isCanceled =
    effectiveStatus ===
    "CANCELADO";

  const isOverdue =
    effectiveStatus ===
    "ATRASADO";

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        isCanceled
          ? "bg-muted/30 opacity-75"
          : isOverdue
            ? "border-red-200 bg-red-50/20"
            : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`font-medium ${
                isCanceled
                  ? "line-through"
                  : ""
              }`}
            >
              {
                receivable.description
              }
            </h3>

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
            className={`mt-1 text-2xl font-bold ${
              isCanceled
                ? "line-through"
                : ""
            }`}
          >
            {formatMoney(
              totalAmount,
            )}
          </p>

          {isPartial ? (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Recebido:{" "}
                <strong className="font-medium text-foreground">
                  {formatMoney(
                    paidAmount,
                  )}
                </strong>
              </span>

              <span>
                Restante:{" "}
                <strong className="font-medium text-foreground">
                  {formatMoney(
                    remainingAmount,
                  )}
                </strong>
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${status.badge}`}
          >
            {status.label}
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

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0" />

          <span>
            Vencimento:{" "}
            {formatReceivableDate(
              receivable.dueDate,
            )}
          </span>
        </div>

        {isPaid &&
        receivable.receivedAt ? (
          <div className="flex items-center gap-2">
            <CircleCheck className="h-4 w-4 shrink-0" />

            <span>
              Recebido em{" "}
              {formatReceivableDate(
                receivable.receivedAt,
              )}

              {receivable.paymentMethod
                ? ` • ${
                    paymentMethodLabels[
                      receivable
                        .paymentMethod
                    ] ??
                    receivable
                      .paymentMethod
                  }`
                : ""}
            </span>
          </div>
        ) : null}

        {isPartial ? (
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 shrink-0" />

            <span>
              Pagamento parcial
              registrado
            </span>
          </div>
        ) : null}

        {isCanceled ? (
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 shrink-0" />

            <span>
              Cobrança cancelada
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}