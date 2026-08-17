import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import type {
  OfficeRpvCaseOption,
  OfficeRpvData,
  OfficeRpvRecord,
} from "../types/office-rpv";

function getTodayKeyInSaoPaulo(): string {
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
    throw new Error(
      "Não foi possível determinar a data atual.",
    );
  }

  return `${year}-${month}-${day}`;
}

function getCaseNumber({
  number,
  administrativeNumber,
}: {
  number: string | null;
  administrativeNumber: string | null;
}): string | null {
  return (
    number ??
    administrativeNumber ??
    null
  );
}

function getCaseLabel({
  clientName,
  title,
  number,
  administrativeNumber,
}: {
  clientName: string;
  title: string;
  number: string | null;
  administrativeNumber: string | null;
}): string {
  const caseNumber =
    getCaseNumber({
      number,
      administrativeNumber,
    });

  if (!caseNumber) {
    return `${clientName} — ${title}`;
  }

  return `${clientName} — ${title} • ${caseNumber}`;
}

export async function getOfficeRpvData(): Promise<OfficeRpvData> {
  const workspace =
    await getDefaultWorkspace();

  const [
    rpvs,
    cases,
  ] =
    await Promise.all([
      prisma.rpv.findMany({
        where: {
          workspaceId:
            workspace.id,
        },

        select: {
          id: true,

          type: true,

          caseId: true,

          requisitionNumber:
            true,

          court: true,

          grossAmount: true,

          contractualFeeRate:
            true,

          contractualFeeValue:
            true,

          sucumbencyFeeValue:
            true,

          clientNetAmount:
            true,

          expectedPaymentDate:
            true,

          paidAt: true,

          bank: true,

          status: true,

          notes: true,

          createdAt: true,

          updatedAt: true,

          case: {
            select: {
              title: true,

              number: true,

              administrativeNumber:
                true,

              clientId: true,

              client: {
                select: {
                  name: true,
                },
              },
            },
          },
        },

        orderBy: [
          {
            expectedPaymentDate:
              "asc",
          },

          {
            createdAt:
              "desc",
          },
        ],
      }),

      prisma.case.findMany({
        where: {
          workspaceId:
            workspace.id,
        },

        select: {
          id: true,

          clientId: true,

          title: true,

          number: true,

          administrativeNumber:
            true,

          client: {
            select: {
              name: true,
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      }),
    ]);

  const serializedRpvs: OfficeRpvRecord[] =
    rpvs.map(
      (rpv) => ({
        id:
          rpv.id,

        type:
          rpv.type,

        caseId:
          rpv.caseId,

        clientId:
          rpv.case.clientId,

        clientName:
          rpv.case.client.name,

        caseTitle:
          rpv.case.title,

        caseNumber:
          getCaseNumber({
            number:
              rpv.case.number,

            administrativeNumber:
              rpv.case
                .administrativeNumber,
          }),

        requisitionNumber:
          rpv.requisitionNumber,

        court:
          rpv.court,

        grossAmount:
          Number(
            rpv.grossAmount,
          ),

        contractualFeeRate:
          rpv.contractualFeeRate ===
          null
            ? null
            : Number(
                rpv.contractualFeeRate,
              ),

        contractualFeeValue:
          rpv.contractualFeeValue ===
          null
            ? null
            : Number(
                rpv.contractualFeeValue,
              ),

        sucumbencyFeeValue:
          rpv.sucumbencyFeeValue ===
          null
            ? null
            : Number(
                rpv.sucumbencyFeeValue,
              ),

        clientNetAmount:
          rpv.clientNetAmount ===
          null
            ? null
            : Number(
                rpv.clientNetAmount,
              ),

        expectedPaymentDate:
          rpv.expectedPaymentDate?.toISOString() ??
          null,

        paidAt:
          rpv.paidAt?.toISOString() ??
          null,

        bank:
          rpv.bank,

        status:
          rpv.status,

        notes:
          rpv.notes,

        createdAt:
          rpv.createdAt.toISOString(),

        updatedAt:
          rpv.updatedAt.toISOString(),
      }),
    );

  const serializedCases: OfficeRpvCaseOption[] =
    cases.map(
      (clientCase) => ({
        id:
          clientCase.id,

        clientId:
          clientCase.clientId,

        clientName:
          clientCase.client.name,

        title:
          clientCase.title,

        number:
          clientCase.number,

        administrativeNumber:
          clientCase.administrativeNumber,

        label:
          getCaseLabel({
            clientName:
              clientCase.client.name,

            title:
              clientCase.title,

            number:
              clientCase.number,

            administrativeNumber:
              clientCase.administrativeNumber,
          }),
      }),
    );

  return {
    todayKey:
      getTodayKeyInSaoPaulo(),

    cases:
      serializedCases,

    rpvs:
      serializedRpvs,
  };
}