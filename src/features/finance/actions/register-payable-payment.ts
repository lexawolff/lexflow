"use server";

import {
  ActionError,
} from "@/lib/actions/action-error";

import {
  runAction,
} from "@/lib/actions/run-action";

import {
  FinancialStatus,
} from "@prisma/client";

import {
  revalidatePath,
} from "next/cache";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  registerPayablePaymentSchema,
} from "../schemas/payable-actions-schema";

async function registerPayablePaymentImpl(
  formData:
    FormData,
) {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "FINANCE_WRITE",
    );

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

    throw new ActionError(
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
          id:
            true,

          status:
            true,
        },
      },
    );

  if (!payable) {
    throw new ActionError(
      "Conta não encontrada.",
    );
  }

  if (
    payable.status ===
    FinancialStatus.CANCELADO
  ) {
    throw new ActionError(
      "Não é possível pagar uma conta cancelada.",
    );
  }

  if (
    payable.status ===
    FinancialStatus.PAGO
  ) {
    throw new ActionError(
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
  revalidatePath(
    "/financeiro/contas-a-pagar",
  );

  revalidatePath(
    "/financeiro/fluxo-de-caixa",
  );

  return {
    success:
      true,
  };
}

export async function registerPayablePayment(
  ...args: Parameters<typeof registerPayablePaymentImpl>
) {
  return runAction(
    () =>
      registerPayablePaymentImpl(
        ...args,
      ),
  );
}
