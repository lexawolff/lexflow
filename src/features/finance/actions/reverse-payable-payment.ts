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
  getOpenPayableStatus,
} from "../lib/payable-status";

import {
  reversePayablePaymentSchema,
} from "../schemas/payable-actions-schema";

export async function reversePayablePayment(
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    reversePayablePaymentSchema.safeParse(
      {
        payableId:
          formData.get(
            "payableId",
          ),
      },
    );

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Dados inválidos.",
    );
  }

  const payable =
    await prisma.payable.findFirst(
      {
        where: {
          id:
            parsed.data.payableId,

          workspaceId:
            workspace.id,
        },

        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },
    );

  if (!payable) {
    throw new Error(
      "Conta não encontrada.",
    );
  }

  if (
    payable.status !==
    FinancialStatus.PAGO
  ) {
    throw new Error(
      "Somente contas pagas podem ter o pagamento estornado.",
    );
  }

  const status =
    getOpenPayableStatus(
      payable.dueDate,
    );

  await prisma.payable.update({
    where: {
      id:
        payable.id,
    },

    data: {
      paidAt: null,

      paymentMethod: null,

      status,
    },
  });

  revalidatePath(
    "/financeiro",
  );

  return {
    success: true,
  };
}