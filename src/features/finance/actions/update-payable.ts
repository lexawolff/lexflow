"use server";

import {
  ActionError,
} from "@/lib/actions/action-error";

import {
  runAction,
} from "@/lib/actions/run-action";

import {
  Prisma,
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
  getPayableStatusAfterEdit,
} from "../lib/payable-status";

import {
  updatePayableSchema,
} from "../schemas/payable-actions-schema";

async function updatePayableImpl(
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
    updatePayableSchema.safeParse({
      payableId:
        formData.get(
          "payableId",
        ),

      description:
        formData.get(
          "description",
        ),

      category:
        formData.get(
          "category",
        ),

      amount:
        formData.get(
          "amount",
        ),

      dueDate:
        formData.get(
          "dueDate",
        ),

      notes:
        formData.get(
          "notes",
        ),
    });

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

  const status =
    getPayableStatusAfterEdit({
      currentStatus:
        payable.status,

      dueDate:
        data.dueDate,
    });

  await prisma.payable.update({
    where: {
      id:
        payable.id,
    },

    data: {
      description:
        data.description,

      category:
        data.category,

      amount:
        new Prisma.Decimal(
          data.amount,
        ),

      dueDate:
        data.dueDate,

      notes:
        data.notes,

      status,
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

export async function updatePayable(
  ...args: Parameters<typeof updatePayableImpl>
) {
  return runAction(
    () =>
      updatePayableImpl(
        ...args,
      ),
  );
}
