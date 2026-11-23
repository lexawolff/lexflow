"use server";

import {
  RPV_LINKED_RECEIVABLE_MESSAGE,
} from "../lib/rpv-rules";

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
  reverseReceivablePaymentSchema,
} from "../schemas/reverse-receivable-payment-schema";

function getDateKey(
  date: Date,
): string {
  const year =
    date.getUTCFullYear();

  const month =
    String(
      date.getUTCMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getUTCDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function getTodayDateKey(): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Sao_Paulo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      },
    );

  const parts =
    formatter.formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day",
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    throw new ActionError(
      "Não foi possível determinar a data atual.",
    );
  }

  return `${year}-${month}-${day}`;
}

function getStatusAfterReversal(
  dueDate:
    Date | null,
): FinancialStatus {
  if (!dueDate) {
    return FinancialStatus.PENDENTE;
  }

  if (
    getDateKey(
      dueDate,
    ) <
    getTodayDateKey()
  ) {
    return FinancialStatus.ATRASADO;
  }

  return FinancialStatus.PENDENTE;
}

async function reverseReceivablePaymentImpl(
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
    reverseReceivablePaymentSchema.safeParse(
      {
        receivableId:
          formData.get(
            "receivableId",
          ),
      },
    );

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

  const {
    receivableId,
  } =
    parsed.data;

  const receivable =
    await prisma.receivable.findFirst(
      {
        where: {
          id:
            receivableId,

          workspaceId:
            workspace.id,
        },

        select: {
          rpvId: true,
          id:
            true,

          clientId:
            true,

          status:
            true,

          paidAmount:
            true,

          dueDate:
            true,

          receivedAt:
            true,
        },
      },
    );

  if (!receivable) {
    throw new ActionError(
      "Recebimento não encontrado.",
    );
  }

  if (receivable.rpvId) {
    throw new ActionError(
      RPV_LINKED_RECEIVABLE_MESSAGE,
    );
  }

  if (
    receivable.status !==
    FinancialStatus.PAGO
  ) {
    throw new ActionError(
      "Somente recebimentos marcados como pagos podem ser estornados.",
    );
  }

  if (
    receivable.paidAmount.lessThanOrEqualTo(
      0,
    )
  ) {
    throw new ActionError(
      "Este recebimento não possui valor pago para estornar.",
    );
  }

  const status =
    getStatusAfterReversal(
      receivable.dueDate,
    );

  await prisma.receivable.update({
    where: {
      id:
        receivable.id,
    },

    data: {
      paidAmount:
        0,

      receivedAt:
        null,

      paymentMethod:
        null,

      status,
    },
  });

  revalidatePath(
    `/clientes/${receivable.clientId}`,
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

export async function reverseReceivablePayment(
  ...args: Parameters<typeof reverseReceivablePaymentImpl>
) {
  return runAction(
    () =>
      reverseReceivablePaymentImpl(
        ...args,
      ),
  );
}
