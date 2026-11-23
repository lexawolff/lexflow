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
  updateReceivableSchema,
} from "../schemas/update-receivable-schema";

function getDateKey(
  date:
    Date,
): string {
  const year =
    date.getUTCFullYear();

  const month =
    String(
      date.getUTCMonth() +
        1,
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
      (
        part,
      ) =>
        part.type ===
        "year",
    )?.value;

  const month =
    parts.find(
      (
        part,
      ) =>
        part.type ===
        "month",
    )?.value;

  const day =
    parts.find(
      (
        part,
      ) =>
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

function isOverdue(
  dueDate:
    Date | null,
): boolean {
  if (!dueDate) {
    return false;
  }

  return (
    getDateKey(
      dueDate,
    ) <
    getTodayDateKey()
  );
}

function calculateStatus({
  currentStatus,
  totalAmount,
  paidAmount,
  dueDate,
}: {
  currentStatus:
    FinancialStatus;

  totalAmount:
    Prisma.Decimal;

  paidAmount:
    Prisma.Decimal;

  dueDate:
    Date | null;
}): FinancialStatus {
  if (
    currentStatus ===
    FinancialStatus.CANCELADO
  ) {
    return FinancialStatus.CANCELADO;
  }

  if (
    paidAmount.greaterThanOrEqualTo(
      totalAmount,
    )
  ) {
    return FinancialStatus.PAGO;
  }

  if (
    isOverdue(
      dueDate,
    )
  ) {
    return FinancialStatus.ATRASADO;
  }

  if (
    paidAmount.greaterThan(
      0,
    )
  ) {
    return FinancialStatus.PARCIAL;
  }

  return FinancialStatus.PENDENTE;
}

async function updateReceivableImpl(
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
    updateReceivableSchema.safeParse({
      receivableId:
        formData.get(
          "receivableId",
        ),

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

  const receivable =
    await prisma.receivable.findFirst(
      {
        where: {
          id:
            data.receivableId,

          workspaceId:
            workspace.id,
        },

        select: {
          rpvId: true,
          totalAmount: true,
          type: true,
          caseId: true,
          id:
            true,

          clientId:
            true,

          paidAmount:
            true,

          status:
            true,

          dueDate:
            true,

          originalDueDate:
            true,
        },
      },
    );

  if (!receivable) {
    throw new ActionError(
      "Recebimento não encontrado.",
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

          clientId:
            receivable.clientId,

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

  const newTotalAmount =
    new Prisma.Decimal(
      data.totalAmount,
    );

  // Descrição, vencimento e observações continuam editáveis.
  if (
    receivable.rpvId &&
    (
      !newTotalAmount.equals(receivable.totalAmount) ||
      data.type !== receivable.type ||
      (data.caseId ?? null) !== receivable.caseId
    )
  ) {
    throw new ActionError(
      RPV_LINKED_RECEIVABLE_MESSAGE,
    );
  }

  if (
    newTotalAmount.lessThan(
      receivable.paidAmount,
    )
  ) {
    throw new ActionError(
      "O novo valor não pode ser menor que o valor já recebido.",
    );
  }

  const status =
    calculateStatus({
      currentStatus:
        receivable.status,

      totalAmount:
        newTotalAmount,

      paidAmount:
        receivable.paidAmount,

      dueDate:
        data.dueDate,
    });

  const originalDueDate =
    receivable.originalDueDate ??
    receivable.dueDate ??
    data.dueDate;

  await prisma.receivable.update({
    where: {
      id:
        receivable.id,
    },

    data: {
      caseId:
        data.caseId,

      description:
        data.description,

      type:
        data.type,

      totalAmount:
        newTotalAmount,

      dueDate:
        data.dueDate,

      originalDueDate,

      notes:
        data.notes,

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

export async function updateReceivable(
  ...args: Parameters<typeof updateReceivableImpl>
) {
  return runAction(
    () =>
      updateReceivableImpl(
        ...args,
      ),
  );
}
