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
  createRpvSchema,
} from "../schemas/create-rpv-schema";

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

async function createRpvImpl(
  formData: FormData,
) {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "FINANCE_WRITE",
    );

  const parsed =
    createRpvSchema.safeParse({
      caseId:
        formData.get("caseId"),

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

      paidAt:
        formData.get("paidAt"),

      bank:
        formData.get("bank"),

      status:
        formData.get("status"),

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

  const clientCase =
    await prisma.case.findFirst({
      where: {
        id:
          data.caseId,

        workspaceId:
          workspace.id,
      },

      select: {
        id: true,
      },
    });

  if (!clientCase) {
    throw new ActionError(
      "Caso não encontrado.",
    );
  }

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
      "Os honorários contratuais não podem superar o valor bruto.",
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
        const rpv =
          await tx.rpv.create({
            data: {
              workspaceId:
                workspace.id,

              caseId:
                data.caseId,

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

              paidAt:
                data.paidAt,

              bank:
                data.bank,

              status:
                data.status,

              notes:
                data.notes,
            },

            select: {
              id: true,
            },
          });

        return syncRpvReceivables({
          tx,
          workspaceId:
            workspace.id,
          rpvId:
            rpv.id,
        });
      },
    );

  revalidateFinance(result);

  return {
    success: true,
  };
}

export async function createRpv(
  ...args: Parameters<typeof createRpvImpl>
) {
  return runAction(
    () =>
      createRpvImpl(
        ...args,
      ),
  );
}
