"use server";

import { randomUUID } from "crypto";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { splitAmount } from "../lib/split-amount";
import { createReceivableSchema } from "../schemas/create-receivable-schema";

export async function createReceivable(
  clientId: string,
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    createReceivableSchema.safeParse({
      caseId:
        formData.get("caseId"),

      description:
        formData.get(
          "description",
        ),

      type:
        formData.get("type"),

      totalAmount:
        formData.get(
          "totalAmount",
        ),

      dueDate:
        formData.get("dueDate"),

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
        formData.get("notes"),
    });

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

  const data = parsed.data;

  const client =
    await prisma.client.findFirst({
      where: {
        id: clientId,

        workspaceId:
          workspace.id,
      },

      select: {
        id: true,
      },
    });

  if (!client) {
    throw new Error(
      "Cliente não encontrado.",
    );
  }

  if (data.caseId) {
    const relatedCase =
      await prisma.case.findFirst({
        where: {
          id: data.caseId,

          clientId,

          workspaceId:
            workspace.id,
        },

        select: {
          id: true,
        },
      });

    if (!relatedCase) {
      throw new Error(
        "O processo selecionado não pertence a este cliente.",
      );
    }
  }

  const installments =
    data.isInstallment
      ? data.totalInstallments
      : 1;

  if (
    data.installmentDueDates
      .length !== installments
  ) {
    throw new Error(
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
    async (transaction) => {
      for (
        let index = 0;
        index < installments;
        index++
      ) {
        const installmentDueDate =
          data.installmentDueDates[
            index
          ];

        if (
          !installmentDueDate
        ) {
          throw new Error(
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

              paidAmount: 0,

              dueDate:
                installmentDueDate,

              originalDueDate:
                installmentDueDate,

              installmentGroupId,

              installmentNumber:
                installments > 1
                  ? index + 1
                  : null,

              totalInstallments:
                installments > 1
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

  return {
    success: true,
  };
}