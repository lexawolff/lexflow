import { Prisma } from "@prisma/client";

export const caseDetailsInclude =
  Prisma.validator<Prisma.CaseDefaultArgs>()({
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },

      events: {
        orderBy: {
          date: "desc",
        },
      },

      documents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

export type CaseDetails =
  Prisma.CaseGetPayload<typeof caseDetailsInclude>;