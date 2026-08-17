"use server";

import {
  FinancialStatus,
} from "@prisma/client";

import {
  revalidatePath,
} from "next/cache";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import {
  registerPayablePaymentSchema,
} from "../schemas/payable-actions-schema";

export async function registerPayablePayment(
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    registerPayablePaymentSchema.safeParse(
      {
        payableId:
          formData.get(
            "payableId",
          ),

        paidAt:
          formData.get(
            "paidAt",
          ),

        paymentMethod:
          formData.get(
            "paymentMethod",
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

  const data =
    parsed.data;

  const payable =
    await prisma.payable.findFirst(
      {
        where: {
          id:
            data.payableId,

          workspaceId:
            workspace.id,
        },

        select: {
          id: true,
          status: true,
        },
      },
    );

  if (!payable) {
    throw new Error(
      "Conta não encontrada.",
    );
  }

  if (
    payable.status ===
    FinancialStatus.CANCELADO
  ) {
    throw new Error(
      "Não é possível pagar uma conta cancelada.",
    );
  }

  if (
    payable.status ===
    FinancialStatus.PAGO
  ) {
    throw new Error(
      "Esta conta já está marcada como paga.",
    );
  }

  await prisma.payable.update({
    where: {
      id:
        payable.id,
    },

    data: {
      paidAt:
        data.paidAt,

      paymentMethod:
        data.paymentMethod,

      status:
        FinancialStatus.PAGO,
    },
  });

  revalidatePath(
    "/financeiro",
  );

  return {
    success: true,
  };
}