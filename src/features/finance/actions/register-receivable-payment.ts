"use server";

import { FinancialStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { registerReceivablePaymentSchema } from "../schemas/register-receivable-payment-schema";

export async function registerReceivablePayment(
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    registerReceivablePaymentSchema.safeParse({
      receivableId:
        formData.get("receivableId"),

      receivedAt:
        formData.get("receivedAt"),

      paymentMethod:
        formData.get("paymentMethod"),
    });

  if (!parsed.success) {
    console.error(
      parsed.error.flatten(),
    );

    throw new Error(
      parsed.error.issues[0]?.message ??
        "Dados inválidos.",
    );
  }

  const data = parsed.data;

  const receivable =
    await prisma.receivable.findFirst({
      where: {
        id: data.receivableId,
        workspaceId: workspace.id,
      },

      select: {
        id: true,

        clientId: true,

        totalAmount: true,

        paidAmount: true,

        status: true,
      },
    });

  if (!receivable) {
    throw new Error(
      "Recebimento não encontrado.",
    );
  }

  if (
    receivable.status ===
    FinancialStatus.CANCELADO
  ) {
    throw new Error(
      "Não é possível registrar pagamento em um recebimento cancelado.",
    );
  }

  if (
    receivable.status ===
    FinancialStatus.PAGO
  ) {
    throw new Error(
      "Este recebimento já está marcado como pago.",
    );
  }

  await prisma.receivable.update({
    where: {
      id: receivable.id,
    },

    data: {
      paidAmount:
        receivable.totalAmount,

      receivedAt:
        data.receivedAt,

      paymentMethod:
        data.paymentMethod,

      status:
        FinancialStatus.PAGO,
    },
  });

  revalidatePath(
    `/clientes/${receivable.clientId}`,
  );

  return {
    success: true,
  };
}