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
  removePayableSchema,
} from "../schemas/payable-actions-schema";

async function removePayableImpl(
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

          paidAt:
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
    data.mode ===
    "CANCEL"
  ) {
    if (
      payable.status ===
      FinancialStatus.PAGO ||
      payable.status ===
      FinancialStatus.PARCIAL
    ) {
      throw new ActionError(
        "Não é possível cancelar uma conta que possui pagamento registrado.",
      );
    }

    if (
      payable.status ===
      FinancialStatus.CANCELADO
    ) {
      throw new ActionError(
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
      success:
        true,
    };
  }

  if (
    payable.status ===
    FinancialStatus.PAGO ||
    payable.status ===
    FinancialStatus.PARCIAL ||
    payable.paidAt
  ) {
    throw new ActionError(
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

export async function removePayable(
  ...args: Parameters<typeof removePayableImpl>
) {
  return runAction(
    () =>
      removePayableImpl(
        ...args,
      ),
  );
}
