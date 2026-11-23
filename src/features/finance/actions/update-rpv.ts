"use server";

import {
  getRpvContractualFee,
} from "../lib/rpv-rules";

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
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/recebimentos");
  revalidatePath("/financeiro/fluxo-de-caixa");
  revalidatePath("/financeiro/rpvs-e-precatorios");
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath(`/clientes/${clientId}/casos/${caseId}`);
}

async function updateRpvImpl(
  formData: FormData,
) {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "FINANCE_WRITE",
    );

  const parsed =
    updateRpvSchema.safeParse({
      rpvId:
        formData.get("rpvId"),

      type:
        formData.get("type"),

      requisitionNumber:
        formData.get(
          "requisitionNumber",
        ),

      court:
        formData.get("court"),

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
        formData.get("bank"),

      notes:
        formData.get("notes"),
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

  /*
   * Só o valor digitado é gravado. Honorários pelo percentual são
   * recalculados sempre que o percentual ou o valor bruto mudam.
   */
  const contractualFee =
    getRpvContractualFee({
      grossAmount: data.grossAmount,
      contractualFeeRate: data.contractualFeeRate,
      contractualFeeValue: data.contractualFeeValue,
    });

  if (contractualFee > data.grossAmount) {
    throw new ActionError(
      "Os honorários contratuais não podem superar o crédito bruto.",
    );
  }

  const clientNetAmount =
    roundMoney(
      Math.max(
        data.grossAmount - contractualFee,
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
          throw new ActionError(
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
              data.contractualFeeRate === null
                ? null
                : new Prisma.Decimal(
                    data.contractualFeeRate,
                  ),

            contractualFeeValue:
              data.contractualFeeValue === null
                ? null
                : new Prisma.Decimal(
                    data.contractualFeeValue,
                  ),

            sucumbencyFeeValue:
              data.sucumbencyFeeValue === null
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

  revalidateFinance(result);

  return {
    success: true,
  };
}

export async function updateRpv(
  ...args: Parameters<typeof updateRpvImpl>
) {
  return runAction(
    () =>
      updateRpvImpl(
        ...args,
      ),
  );
}
