"use server";

import {
  RpvStatus,
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
  updateRpvStatusSchema,
} from "../schemas/rpv-actions-schema";

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

export async function updateRpvStatus(
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    updateRpvStatusSchema.safeParse({
      rpvId:
        formData.get(
          "rpvId",
        ),

      status:
        formData.get(
          "status",
        ),

      paidAt:
        formData.get(
          "paidAt",
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
            status:
              data.status,

            paidAt:
              data.status ===
              RpvStatus.PAGA
                ? data.paidAt
                : null,
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