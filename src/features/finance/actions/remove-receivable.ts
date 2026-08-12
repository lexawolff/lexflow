"use server";

import { FinancialStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { removeReceivableSchema } from "../schemas/remove-receivable-schema";

function hasPayment({
  paidAmount,
  status,
}: {
  paidAmount: {
    greaterThan: (value: number) => boolean;
  };
  status: FinancialStatus;
}) {
  return (
    paidAmount.greaterThan(0) ||
    status === FinancialStatus.PAGO ||
    status === FinancialStatus.PARCIAL
  );
}

export async function removeReceivable(
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    removeReceivableSchema.safeParse({
      receivableId:
        formData.get("receivableId"),

      mode:
        formData.get("mode"),

      scope:
        formData.get("scope"),
    });

  if (!parsed.success) {
    console.error(
      parsed.error.flatten(),
    );

    throw new Error(
      parsed.error.issues[0]?.message ??
        "Dados inválidos.",
    );
  }

  const data = parsed.data;

  const receivable =
    await prisma.receivable.findFirst({
      where: {
        id: data.receivableId,
        workspaceId: workspace.id,
      },

      select: {
        id: true,
        clientId: true,
        installmentGroupId: true,
        paidAmount: true,
        status: true,
      },
    });

  if (!receivable) {
    throw new Error(
      "Recebimento não encontrado.",
    );
  }

  const useGroup =
    data.scope === "GROUP" &&
    Boolean(
      receivable.installmentGroupId,
    );

  /*
   * ==========================
   * CANCELAMENTO
   * ==========================
   */
  if (data.mode === "CANCEL") {
    if (!useGroup) {
      if (
        hasPayment({
          paidAmount:
            receivable.paidAmount,
          status:
            receivable.status,
        })
      ) {
        throw new Error(
          "Não é possível cancelar um recebimento que já possui pagamento registrado.",
        );
      }

      if (
        receivable.status ===
        FinancialStatus.CANCELADO
      ) {
        throw new Error(
          "Este recebimento já está cancelado.",
        );
      }

      await prisma.receivable.update({
        where: {
          id: receivable.id,
        },

        data: {
          status:
            FinancialStatus.CANCELADO,
        },
      });

      revalidatePath(
        `/clientes/${receivable.clientId}`,
      );

      return {
        success: true,
      };
    }

    /*
     * Ao cancelar todo o parcelamento,
     * parcelas já pagas ou parcialmente
     * pagas permanecem intactas.
     */
    await prisma.receivable.updateMany({
      where: {
        workspaceId: workspace.id,

        installmentGroupId:
          receivable.installmentGroupId,

        paidAmount: 0,

        status: {
          notIn: [
            FinancialStatus.PAGO,
            FinancialStatus.PARCIAL,
            FinancialStatus.CANCELADO,
          ],
        },
      },

      data: {
        status:
          FinancialStatus.CANCELADO,
      },
    });

    revalidatePath(
      `/clientes/${receivable.clientId}`,
    );

    return {
      success: true,
    };
  }

  /*
   * ==========================
   * EXCLUSÃO DEFINITIVA
   * ==========================
   */
  if (!useGroup) {
    if (
      hasPayment({
        paidAmount:
          receivable.paidAmount,
        status:
          receivable.status,
      })
    ) {
      throw new Error(
        "Não é possível excluir um recebimento que já possui pagamento registrado.",
      );
    }

    await prisma.receivable.delete({
      where: {
        id: receivable.id,
      },
    });

    revalidatePath(
      `/clientes/${receivable.clientId}`,
    );

    return {
      success: true,
    };
  }

  const groupReceivables =
    await prisma.receivable.findMany({
      where: {
        workspaceId: workspace.id,

        installmentGroupId:
          receivable.installmentGroupId,
      },

      select: {
        id: true,
        paidAmount: true,
        status: true,
      },
    });

  const groupHasPayment =
    groupReceivables.some(
      (item) =>
        hasPayment({
          paidAmount:
            item.paidAmount,
          status:
            item.status,
        }),
    );

  if (groupHasPayment) {
    throw new Error(
      "Não é possível excluir todo o parcelamento porque existem parcelas com pagamento registrado. Você pode excluir individualmente apenas as parcelas ainda sem pagamento.",
    );
  }

  await prisma.receivable.deleteMany({
    where: {
      workspaceId: workspace.id,

      installmentGroupId:
        receivable.installmentGroupId,
    },
  });

  revalidatePath(
    `/clientes/${receivable.clientId}`,
  );

  return {
    success: true,
  };
}