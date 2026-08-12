"use server";

import { Prisma, FinancialStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { registerPaymentSchema } from "../schemas/register-payment-schema";

export async function registerPayment(
  formData: FormData,
) {
  const workspace = await getDefaultWorkspace();

  const parsed = registerPaymentSchema.safeParse({
    receivableId: formData.get("receivableId"),
    amount: Number(formData.get("amount")),
    paidAt: formData.get("paidAt"),
  });

  if (!parsed.success) {
    console.error(parsed.error.flatten());
    throw new Error("Dados inválidos.");
  }

  const data = parsed.data;

  const receivable = await prisma.receivable.findFirst({
    where: {
      id: data.receivableId,
      workspaceId: workspace.id,
    },
    select: {
      id: true,
      clientId: true,
      totalAmount: true,
      paidAmount: true,
      dueDate: true,
    },
  });

  if (!receivable) {
    throw new Error("Recebimento não encontrado.");
  }

  if (data.amount <= 0) {
    throw new Error(
      "O valor do pagamento deve ser maior que zero."
    );
  }

  const totalAmount = Number(receivable.totalAmount);
  const currentPaidAmount = Number(receivable.paidAmount);

  const newPaidAmount =
    currentPaidAmount + data.amount;

  if (newPaidAmount > totalAmount) {
    throw new Error(
      "O valor informado ultrapassa o saldo restante do recebimento."
    );
  }

  const isOverdue =
    receivable.dueDate !== null &&
    receivable.dueDate < new Date();

  let status: FinancialStatus;

  if (newPaidAmount >= totalAmount) {
    status = FinancialStatus.PAGO;
  } else if (newPaidAmount > 0) {
    status = isOverdue
      ? FinancialStatus.ATRASADO
      : FinancialStatus.PARCIAL;
  } else {
    status = isOverdue
      ? FinancialStatus.ATRASADO
      : FinancialStatus.PENDENTE;
  }

  await prisma.receivable.update({
    where: {
      id: receivable.id,
    },
    data: {
      paidAmount: new Prisma.Decimal(newPaidAmount),
      paidAt: data.paidAt,
      status,
    },
  });

  revalidatePath(
    `/clientes/${receivable.clientId}`,
  );

  return {
    success: true,
  };
}