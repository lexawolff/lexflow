"use server";

import {
  FinancialStatus,
  Prisma,
} from "@prisma/client";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { updateReceivableSchema } from "../schemas/update-receivable-schema";

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

function isOverdue(
  dueDate: Date | null,
): boolean {
  if (!dueDate) {
    return false;
  }

  return (
    getDateKey(dueDate) <
    getTodayDateKey()
  );
}

function calculateStatus({
  currentStatus,
  totalAmount,
  paidAmount,
  dueDate,
}: {
  currentStatus:
    FinancialStatus;

  totalAmount:
    Prisma.Decimal;

  paidAmount:
    Prisma.Decimal;

  dueDate:
    Date | null;
}): FinancialStatus {
  if (
    currentStatus ===
    FinancialStatus.CANCELADO
  ) {
    return FinancialStatus.CANCELADO;
  }

  if (
    paidAmount.greaterThanOrEqualTo(
      totalAmount,
    )
  ) {
    return FinancialStatus.PAGO;
  }

  if (isOverdue(dueDate)) {
    return FinancialStatus.ATRASADO;
  }

  if (
    paidAmount.greaterThan(0)
  ) {
    return FinancialStatus.PARCIAL;
  }

  return FinancialStatus.PENDENTE;
}

export async function updateReceivable(
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    updateReceivableSchema.safeParse({
      receivableId:
        formData.get(
          "receivableId",
        ),

      caseId:
        formData.get("caseId"),

      description:
        formData.get(
          "description",
        ),

      type:
        formData.get("type"),

      totalAmount:
        formData.get(
          "totalAmount",
        ),

      dueDate:
        formData.get("dueDate"),

      notes:
        formData.get("notes"),
    });

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

  const data =
    parsed.data;

  const receivable =
    await prisma.receivable.findFirst(
      {
        where: {
          id:
            data.receivableId,

          workspaceId:
            workspace.id,
        },

        select: {
          id: true,

          clientId: true,

          paidAmount: true,

          status: true,

          dueDate: true,

          originalDueDate:
            true,
        },
      },
    );

  if (!receivable) {
    throw new Error(
      "Recebimento não encontrado.",
    );
  }

  if (data.caseId) {
    const relatedCase =
      await prisma.case.findFirst({
        where: {
          id: data.caseId,

          clientId:
            receivable.clientId,

          workspaceId:
            workspace.id,
        },

        select: {
          id: true,
        },
      });

    if (!relatedCase) {
      throw new Error(
        "O processo selecionado não pertence a este cliente.",
      );
    }
  }

  const newTotalAmount =
    new Prisma.Decimal(
      data.totalAmount,
    );

  if (
    newTotalAmount.lessThan(
      receivable.paidAmount,
    )
  ) {
    throw new Error(
      "O novo valor não pode ser menor que o valor já recebido.",
    );
  }

  const status =
    calculateStatus({
      currentStatus:
        receivable.status,

      totalAmount:
        newTotalAmount,

      paidAmount:
        receivable.paidAmount,

      dueDate:
        data.dueDate,
    });

  const originalDueDate =
    receivable.originalDueDate ??
    receivable.dueDate ??
    data.dueDate;

  await prisma.receivable.update({
    where: {
      id: receivable.id,
    },

    data: {
      caseId:
        data.caseId,

      description:
        data.description,

      type:
        data.type,

      totalAmount:
        newTotalAmount,

      dueDate:
        data.dueDate,

      originalDueDate,

      notes:
        data.notes,

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