import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import type {
  OfficeFinancialClient,
  OfficeFinancialData,
  OfficePayable,
  OfficeReceivable,
} from "../types/office-financial";

function getTodayKeyInSaoPaulo(): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    );

  const parts =
    formatter.formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day",
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    const now =
      new Date();

    return [
      now.getUTCFullYear(),
      String(
        now.getUTCMonth() + 1,
      ).padStart(2, "0"),
      String(
        now.getUTCDate(),
      ).padStart(2, "0"),
    ].join("-");
  }

  return `${year}-${month}-${day}`;
}

function getCaseLabel({
  title,
  number,
  administrativeNumber,
}: {
  title: string;

  number: string | null;

  administrativeNumber:
    | string
    | null;
}): string {
  const caseNumber =
    number ??
    administrativeNumber;

  if (!caseNumber) {
    return title;
  }

  return `${title} • ${caseNumber}`;
}

export async function getOfficeFinancialData(): Promise<OfficeFinancialData> {
  const workspace =
    await getDefaultWorkspace();

  const [
    receivables,
    clients,
    payables,
  ] = await Promise.all([
    prisma.receivable.findMany({
      where: {
        workspaceId:
          workspace.id,
      },

      select: {
        id: true,

        clientId: true,
        caseId: true,

        description: true,
        type: true,

        totalAmount: true,
        paidAmount: true,

        dueDate: true,
        originalDueDate: true,
        receivedAt: true,

        status: true,

        paymentMethod: true,
        notes: true,

        installmentGroupId: true,
        installmentNumber: true,
        totalInstallments: true,

        createdAt: true,
        updatedAt: true,

        client: {
          select: {
            name: true,
          },
        },

        case: {
          select: {
            title: true,
            number: true,
            administrativeNumber:
              true,
          },
        },
      },

      orderBy: [
        {
          dueDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    }),

    prisma.client.findMany({
      where: {
        workspaceId:
          workspace.id,
      },

      select: {
        id: true,
        name: true,

        cases: {
          select: {
            id: true,
            title: true,
            number: true,
            administrativeNumber:
              true,
          },

          orderBy: {
            createdAt: "desc",
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    }),

    prisma.payable.findMany({
      where: {
        workspaceId:
          workspace.id,
      },

      select: {
        id: true,

        description: true,

        category: true,

        amount: true,

        dueDate: true,

        paidAt: true,

        status: true,

        paymentMethod: true,

        notes: true,

        createdAt: true,

        updatedAt: true,
      },

      orderBy: [
        {
          dueDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    }),
  ]);

  const serializedReceivables: OfficeReceivable[] =
    receivables.map(
      (receivable) => ({
        id: receivable.id,

        clientId:
          receivable.clientId,

        clientName:
          receivable.client.name,

        caseId:
          receivable.caseId,

        caseTitle:
          receivable.case?.title ??
          null,

        caseNumber:
          receivable.case?.number ??
          receivable.case
            ?.administrativeNumber ??
          null,

        description:
          receivable.description,

        type:
          receivable.type,

        totalAmount:
          Number(
            receivable.totalAmount,
          ),

        paidAmount:
          Number(
            receivable.paidAmount,
          ),

        dueDate:
          receivable.dueDate
            ?.toISOString() ??
          null,

        originalDueDate:
          receivable.originalDueDate
            ?.toISOString() ??
          null,

        receivedAt:
          receivable.receivedAt
            ?.toISOString() ??
          null,

        status:
          receivable.status,

        paymentMethod:
          receivable.paymentMethod,

        notes:
          receivable.notes,

        installmentGroupId:
          receivable.installmentGroupId,

        installmentNumber:
          receivable.installmentNumber,

        totalInstallments:
          receivable.totalInstallments,

        createdAt:
          receivable.createdAt.toISOString(),

        updatedAt:
          receivable.updatedAt.toISOString(),
      }),
    );

  const serializedClients: OfficeFinancialClient[] =
    clients.map(
      (client) => ({
        id: client.id,

        name: client.name,

        cases:
          client.cases.map(
            (clientCase) => ({
              id: clientCase.id,

              label:
                getCaseLabel(
                  clientCase,
                ),
            }),
          ),
      }),
    );

  const serializedPayables: OfficePayable[] =
    payables.map(
      (payable) => ({
        id: payable.id,

        description:
          payable.description,

        category:
          payable.category,

        amount:
          Number(
            payable.amount,
          ),

        dueDate:
          payable.dueDate.toISOString(),

        paidAt:
          payable.paidAt
            ?.toISOString() ??
          null,

        status:
          payable.status,

        paymentMethod:
          payable.paymentMethod,

        notes:
          payable.notes,

        createdAt:
          payable.createdAt.toISOString(),

        updatedAt:
          payable.updatedAt.toISOString(),
      }),
    );

  return {
    todayKey:
      getTodayKeyInSaoPaulo(),

    clients:
      serializedClients,

    receivables:
      serializedReceivables,

    payables:
      serializedPayables,
  };
}