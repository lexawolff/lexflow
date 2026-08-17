"use server";

import {
  Prisma,
} from "@prisma/client";

import {
  revalidatePath,
} from "next/cache";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import {
  syncRpvReceivables,
} from "../lib/sync-rpv-receivables";

import {
  updateRpvSchema,
} from "../schemas/rpv-actions-schema";

function roundMoney(
  value: number,
): number {
  return (
    Math.round(
      (value +
        Number.EPSILON) *
        100,
    ) / 100
  );
}

function revalidateFinance({
  clientId,
  caseId,
}: {
  clientId: string;

  caseId: string;
}) {
  revalidatePath(
    "/financeiro",
  );

  revalidatePath(
    "/financeiro/recebimentos",
  );

  revalidatePath(
    "/financeiro/fluxo-de-caixa",
  );

  revalidatePath(
    "/financeiro/rpvs-e-precatorios",
  );

  revalidatePath(
    `/clientes/${clientId}`,
  );

  revalidatePath(
    `/casos/${caseId}`,
  );
}

export async function updateRpv(
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    updateRpvSchema.safeParse({
      rpvId:
        formData.get(
          "rpvId",
        ),

      type:
        formData.get(
          "type",
        ),

      requisitionNumber:
        formData.get(
          "requisitionNumber",
        ),

      court:
        formData.get(
          "court",
        ),

      grossAmount:
        formData.get(
          "grossAmount",
        ),

      contractualFeeRate:
        formData.get(
          "contractualFeeRate",
        ),

      contractualFeeValue:
        formData.get(
          "contractualFeeValue",
        ),

      sucumbencyFeeValue:
        formData.get(
          "sucumbencyFeeValue",
        ),

      expectedPaymentDate:
        formData.get(
          "expectedPaymentDate",
        ),

      bank:
        formData.get(
          "bank",
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

    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Dados inválidos.",
    );
  }

  const data =
    parsed.data;

  let contractualFeeValue =
    data.contractualFeeValue;

  if (
    contractualFeeValue ===
      null &&
    data.contractualFeeRate !==
      null
  ) {
    contractualFeeValue =
      roundMoney(
        data.grossAmount *
          (data.contractualFeeRate /
            100),
      );
  }

  if (
    contractualFeeValue !==
      null &&
    contractualFeeValue >
      data.grossAmount
  ) {
    throw new Error(
      "Os honorários contratuais não podem superar o crédito bruto.",
    );
  }

  const clientNetAmount =
    roundMoney(
      Math.max(
        data.grossAmount -
          (contractualFeeValue ??
            0),
        0,
      ),
    );

  const result =
    await prisma.$transaction(
      async (tx) => {
        const existing =
          await tx.rpv.findFirst({
            where: {
              id:
                data.rpvId,

              workspaceId:
                workspace.id,
            },

            select: {
              id: true,
            },
          });

        if (!existing) {
          throw new Error(
            "Requisição não encontrada.",
          );
        }

        await tx.rpv.update({
          where: {
            id:
              existing.id,
          },

          data: {
            type:
              data.type,

            requisitionNumber:
              data.requisitionNumber,

            court:
              data.court,

            grossAmount:
              new Prisma.Decimal(
                data.grossAmount,
              ),

            contractualFeeRate:
              data.contractualFeeRate ===
              null
                ? null
                : new Prisma.Decimal(
                    data.contractualFeeRate,
                  ),

            contractualFeeValue:
              contractualFeeValue ===
              null
                ? null
                : new Prisma.Decimal(
                    contractualFeeValue,
                  ),

            sucumbencyFeeValue:
              data.sucumbencyFeeValue ===
              null
                ? null
                : new Prisma.Decimal(
                    data.sucumbencyFeeValue,
                  ),

            clientNetAmount:
              new Prisma.Decimal(
                clientNetAmount,
              ),

            expectedPaymentDate:
              data.expectedPaymentDate,

            bank:
              data.bank,

            notes:
              data.notes,
          },
        });

        return syncRpvReceivables({
          tx,

          workspaceId:
            workspace.id,

          rpvId:
            existing.id,
        });
      },
    );

  revalidateFinance(
    result,
  );

  return {
    success: true,
  };
}