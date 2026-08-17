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
  removePayableSchema,
} from "../schemas/payable-actions-schema";

export async function removePayable(
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    removePayableSchema.safeParse({
      payableId:
        formData.get(
          "payableId",
        ),

      mode:
        formData.get(
          "mode",
        ),
    });

  if (!parsed.success) {
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
          paidAt: true,
        },
      },
    );

  if (!payable) {
    throw new Error(
      "Conta não encontrada.",
    );
  }

  if (
    data.mode === "CANCEL"
  ) {
    if (
      payable.status ===
        FinancialStatus.PAGO ||
      payable.status ===
        FinancialStatus.PARCIAL
    ) {
      throw new Error(
        "Não é possível cancelar uma conta que possui pagamento registrado.",
      );
    }

    if (
      payable.status ===
      FinancialStatus.CANCELADO
    ) {
      throw new Error(
        "Esta conta já está cancelada.",
      );
    }

    await prisma.payable.update({
      where: {
        id:
          payable.id,
      },

      data: {
        status:
          FinancialStatus.CANCELADO,
      },
    });

    revalidatePath(
      "/financeiro",
    );

    return {
      success: true,
    };
  }

  if (
    payable.status ===
      FinancialStatus.PAGO ||
    payable.status ===
      FinancialStatus.PARCIAL ||
    payable.paidAt
  ) {
    throw new Error(
      "Não é possível excluir uma conta que possui pagamento registrado. Estorne o pagamento primeiro.",
    );
  }

  await prisma.payable.delete({
    where: {
      id:
        payable.id,
    },
  });

  revalidatePath(
    "/financeiro",
  );

  return {
    success: true,
  };
}