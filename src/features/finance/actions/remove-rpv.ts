"use server";

import {
  ActionError,
} from "@/lib/actions/action-error";

import {
  runAction,
} from "@/lib/actions/run-action";

import {
  RpvStatus,
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
  removeRpvSchema,
} from "../schemas/rpv-actions-schema";

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

async function removeRpvImpl(
  formData: FormData,
) {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "FINANCE_WRITE",
    );

  const parsed =
    removeRpvSchema.safeParse({
      rpvId:
        formData.get(
          "rpvId",
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

  const result =
    await prisma.$transaction(
      async (tx) => {
        const rpv =
          await tx.rpv.findFirst({
            where: {
              id:
                data.rpvId,

              workspaceId:
                workspace.id,
            },

            select: {
              id: true,
              status: true,
              paidAt: true,
              caseId: true,

              case: {
                select: {
                  clientId:
                    true,
                },
              },
            },
          });

        if (!rpv) {
          throw new ActionError(
            "Requisição não encontrada.",
          );
        }

        const revalidationData = {
          clientId:
            rpv.case.clientId,

          caseId:
            rpv.caseId,
        };

        if (
          data.mode ===
          "CANCEL"
        ) {
          if (
            rpv.status ===
              RpvStatus.PAGA ||
            rpv.paidAt
          ) {
            throw new ActionError(
              "Não é possível cancelar uma requisição paga. Altere a situação primeiro.",
            );
          }

          if (
            rpv.status ===
            RpvStatus.CANCELADA
          ) {
            throw new ActionError(
              "Esta requisição já está cancelada.",
            );
          }

          await tx.rpv.update({
            where: {
              id:
                rpv.id,
            },

            data: {
              status:
                RpvStatus.CANCELADA,

              paidAt:
                null,
            },
          });

          await syncRpvReceivables({
            tx,
            workspaceId:
              workspace.id,
            rpvId:
              rpv.id,
          });

          return revalidationData;
        }

        if (
          rpv.status ===
            RpvStatus.PAGA ||
          rpv.paidAt
        ) {
          throw new ActionError(
            "Não é possível excluir uma requisição paga. Altere a situação primeiro.",
          );
        }

        await tx.rpv.delete({
          where: {
            id:
              rpv.id,
          },
        });

        return revalidationData;
      },
    );

  revalidateFinance(result);

  return {
    success: true,
  };
}

export async function removeRpv(
  ...args: Parameters<typeof removeRpvImpl>
) {
  return runAction(
    () =>
      removeRpvImpl(
        ...args,
      ),
  );
}
