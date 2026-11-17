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
  registerReceivablePaymentSchema,
} from "../schemas/register-receivable-payment-schema";

async function registerReceivablePaymentImpl(
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
    registerReceivablePaymentSchema.safeParse(
      {
        receivableId:
          formData.get(
            "receivableId",
          ),

        receivedAt:
          formData.get(
            "receivedAt",
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
          id:
            true,

          clientId:
            true,

          totalAmount:
            true,

          paidAmount:
            true,

          status:
            true,
        },
      },
    );

  if (!receivable) {
    throw new ActionError(
      "Recebimento não encontrado.",
    );
  }

  if (
    receivable.status ===
    FinancialStatus.CANCELADO
  ) {
    throw new ActionError(
      "Não é possível registrar pagamento em um recebimento cancelado.",
    );
  }

  if (
    receivable.status ===
    FinancialStatus.PAGO
  ) {
    throw new ActionError(
      "Este recebimento já está marcado como pago.",
    );
  }

  await prisma.receivable.update({
    where: {
      id:
        receivable.id,
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

  revalidatePath(
    "/financeiro",
  );

  revalidatePath(
  "/financeiro/recebimentos",
);

revalidatePath(
  "/financeiro/fluxo-de-caixa",
);

  return {
    success:
      true,
  };
}

export async function registerReceivablePayment(
  ...args: Parameters<typeof registerReceivablePaymentImpl>
) {
  return runAction(
    () =>
      registerReceivablePaymentImpl(
        ...args,
      ),
  );
}
