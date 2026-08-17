"use server";

import { FinancialStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { reverseReceivablePaymentSchema } from "../schemas/reverse-receivable-payment-schema";

function getDateKey(
  date: Date,
): string {
  const year =
    date.getUTCFullYear();

  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getUTCDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDateKey(): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Sao_Paulo",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    );

  const parts =
    formatter.formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day",
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

function getStatusAfterReversal(
  dueDate: Date | null,
): FinancialStatus {
  if (!dueDate) {
    return FinancialStatus.PENDENTE;
  }

  if (
    getDateKey(dueDate) <
    getTodayDateKey()
  ) {
    return FinancialStatus.ATRASADO;
  }

  return FinancialStatus.PENDENTE;
}

export async function reverseReceivablePayment(
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    reverseReceivablePaymentSchema.safeParse(
      {
        receivableId:
          formData.get(
            "receivableId",
          ),
      },
    );

  if (!parsed.success) {
    console.error(
      parsed.error.flatten(),
    );

    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Dados inválidos.",
    );
  }

  const {
    receivableId,
  } = parsed.data;

  const receivable =
    await prisma.receivable.findFirst(
      {
        where: {
          id: receivableId,

          workspaceId:
            workspace.id,
        },

        select: {
          id: true,

          clientId: true,

          status: true,

          paidAmount: true,

          dueDate: true,

          receivedAt: true,
        },
      },
    );

  if (!receivable) {
    throw new Error(
      "Recebimento não encontrado.",
    );
  }

  if (
    receivable.status !==
    FinancialStatus.PAGO
  ) {
    throw new Error(
      "Somente recebimentos marcados como pagos podem ser estornados.",
    );
  }

  if (
    receivable.paidAmount.lessThanOrEqualTo(
      0,
    )
  ) {
    throw new Error(
      "Este recebimento não possui valor pago para estornar.",
    );
  }

  const status =
    getStatusAfterReversal(
      receivable.dueDate,
    );

  await prisma.receivable.update({
    where: {
      id: receivable.id,
    },

    data: {
      paidAmount: 0,

      receivedAt: null,

      paymentMethod: null,

      status,
    },
  });

  revalidatePath(
    `/clientes/${receivable.clientId}`,
  );

  revalidatePath(
    "/financeiro",
  );

  return {
    success: true,
  };
}