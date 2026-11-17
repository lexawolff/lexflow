"use server";

import {
  ActionError,
} from "@/lib/actions/action-error";

import {
  runAction,
} from "@/lib/actions/run-action";

import {
  randomUUID,
} from "crypto";

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
  splitAmount,
} from "../lib/split-amount";

import {
  createReceivableSchema,
} from "../schemas/create-receivable-schema";

async function createReceivableImpl(
  clientId:
    string,

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
    createReceivableSchema.safeParse({
      caseId:
        formData.get(
          "caseId",
        ),

      description:
        formData.get(
          "description",
        ),

      type:
        formData.get(
          "type",
        ),

      totalAmount:
        formData.get(
          "totalAmount",
        ),

      dueDate:
        formData.get(
          "dueDate",
        ),

      installmentDueDates:
        formData.get(
          "installmentDueDates",
        ),

      isInstallment:
        formData.get(
          "isInstallment",
        ),

      totalInstallments:
        formData.get(
          "totalInstallments",
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

  const client =
    await prisma.client.findFirst({
      where: {
        id:
          clientId,

        workspaceId:
          workspace.id,
      },

      select: {
        id:
          true,
      },
    });

  if (!client) {
    throw new ActionError(
      "Cliente não encontrado.",
    );
  }

  if (
    data.caseId
  ) {
    const relatedCase =
      await prisma.case.findFirst({
        where: {
          id:
            data.caseId,

          clientId,

          workspaceId:
            workspace.id,
        },

        select: {
          id:
            true,
        },
      });

    if (!relatedCase) {
      throw new ActionError(
        "O caso selecionado não pertence a este cliente.",
      );
    }
  }

  const installments =
    data.isInstallment
      ? data.totalInstallments
      : 1;

  if (
    data.installmentDueDates.length !==
    installments
  ) {
    throw new ActionError(
      "A quantidade de vencimentos não corresponde à quantidade de parcelas.",
    );
  }

  const installmentGroupId =
    installments > 1
      ? randomUUID()
      : null;

  const installmentValues =
    splitAmount(
      data.totalAmount,
      installments,
    );

  await prisma.$transaction(
    async (
      transaction,
    ) => {
      for (
        let index = 0;
        index <
        installments;
        index++
      ) {
        const installmentDueDate =
          data.installmentDueDates[
            index
          ];

        if (
          !installmentDueDate
        ) {
          throw new ActionError(
            `O vencimento da parcela ${
              index + 1
            } não foi informado.`,
          );
        }

        await transaction.receivable.create(
          {
            data: {
              workspaceId:
                workspace.id,

              clientId,

              caseId:
                data.caseId,

              description:
                data.description,

              type:
                data.type,

              totalAmount:
                installmentValues[
                  index
                ],

              paidAmount:
                0,

              dueDate:
                installmentDueDate,

              originalDueDate:
                installmentDueDate,

              installmentGroupId,

              installmentNumber:
                installments >
                1
                  ? index + 1
                  : null,

              totalInstallments:
                installments >
                1
                  ? installments
                  : null,

              notes:
                data.notes,
            },
          },
        );
      }
    },
  );

  revalidatePath(
    `/clientes/${clientId}`,
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

export async function createReceivable(
  ...args: Parameters<typeof createReceivableImpl>
) {
  return runAction(
    () =>
      createReceivableImpl(
        ...args,
      ),
  );
}
